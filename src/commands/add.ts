import { homedir } from 'node:os'
import * as p from '@clack/prompts'
import ansis from 'ansis'
import { discoverAgents, type Agent } from '../core/agents.js'
import { deltaProfilesRoot } from '../core/delta.js'
import { installAgent, installItem } from '../core/install.js'
import {
  buildAgentPlan, buildDeltaAgentPlan, buildPlan, conflictingSkillTargets,
  type AgentPlanItem, type PlanItem,
} from '../core/plan.js'
import { isDetected, PROVIDERS, type Scope } from '../core/providers.js'
import { discoverSkills, resolveWithDeps, type Skill } from '../core/skills.js'

export interface AddOptions {
  skillsRootDir: string
  agentsRootDir: string
  deltaAgentsRootDir: string
  dryRun: boolean
}

type Platform = 'codex' | 'delta'
type Step =
  | { kind: 'providers' }
  | { kind: 'scope' }
  | { kind: 'skills'; topic: string }
  | { kind: 'agents'; platform: Platform }
  | { kind: 'confirm' }

export async function runAdd({ skillsRootDir, agentsRootDir, deltaAgentsRootDir, dryRun }: AddOptions): Promise<void> {
  const cwd = process.cwd()
  const home = homedir()
  const profilesDir = deltaProfilesRoot(home)

  p.intro(ansis.bold('harness') + ansis.dim(' · install skills and subagents · Esc = back'))

  const skills = discoverSkills(skillsRootDir)
  const agents = { codex: discoverAgents(agentsRootDir), delta: discoverAgents(deltaAgentsRootDir, 'delta') }
  if (skills.length === 0 && agents.codex.length === 0 && agents.delta.length === 0) {
    p.cancel('No skills or subagents found in this repository.')
    process.exit(1)
  }

  const detected = PROVIDERS.filter((pr) => isDetected(pr, home)).map((pr) => pr.id)
  const state = {
    providers: detected,
    scope: 'project' as Scope,
    selected: [] as string[],
    selectedAgents: { codex: [] as string[], delta: [] as string[] },
  }

  // One step per topic keeps every skill list short: no scrolling past one
  // category to reach the next. Esc walks one step back; from the first step it
  // leaves the wizard.
  const topics = [...new Set(skills.map((s) => s.topic))]
  const steps: Step[] = [
    { kind: 'providers' },
    { kind: 'scope' },
    ...topics.map((topic): Step => ({ kind: 'skills', topic })),
    { kind: 'agents', platform: 'codex' },
    { kind: 'agents', platform: 'delta' },
    { kind: 'confirm' },
  ]

  const move = (index: number, direction: -1 | 1): number => {
    let next = index + direction
    while (true) {
      const candidate = steps[next]
      if (candidate?.kind !== 'agents' ||
        (state.providers.includes(candidate.platform) && agents[candidate.platform].length > 0)) break
      next += direction
    }
    return next
  }

  let i = 0
  while (i < steps.length) {
    const step = steps[i]

    if (step.kind === 'providers') {
      const r = await pickProviders(detected, state.providers)
      if (r === 'CANCEL') return exit()
      state.providers = r
      i = move(i, 1)
    } else if (step.kind === 'scope') {
      const r = await pickScope(cwd, home, state.scope)
      if (r === 'CANCEL') i = move(i, -1)
      else {
        state.scope = r
        i = move(i, 1)
      }
    } else if (step.kind === 'skills') {
      const topicSkills = skills.filter((s) => s.topic === step.topic)
      const names = topicSkills.map((s) => s.name)
      const initial = state.selected.filter((n) => names.includes(n))
      const r = await pickTopicSkills(step.topic, topicSkills, initial)
      if (r === 'CANCEL') i = move(i, -1)
      else {
        state.selected = [...state.selected.filter((n) => !names.includes(n)), ...r]
        i = move(i, 1)
      }
    } else if (step.kind === 'agents') {
      const r = await pickAgents(agents[step.platform], state.selectedAgents[step.platform], step.platform)
      if (r === 'CANCEL') i = move(i, -1)
      else {
        state.selectedAgents[step.platform] = r
        i = move(i, 1)
      }
    } else {
      const hasAgents = (['codex', 'delta'] as const)
        .some((platform) => state.providers.includes(platform) && state.selectedAgents[platform].length > 0)
      if (state.selected.length === 0 && !hasAgents) {
        p.log.warn('Pick at least one skill or subagent.')
        i = move(i, -1)
        continue
      }
      const r = await confirmStep(
        skills, agents, state.providers, state.scope, state.selected, state.selectedAgents,
        dryRun, home, cwd, profilesDir,
      )
      if (r === 'ABORT') return exit()
      if (r === 'BACK') i = move(i, -1)
      else if (r === 'DRYRUN') return
      else break // GO
    }
  }

  const providers = PROVIDERS.filter((pr) => state.providers.includes(pr.id))
  const { skills: resolved } = resolveWithDeps(state.selected, skills)
  const skillPlan = buildPlan(resolved, providers, state.scope, cwd, home)
  const selectedAgents = {
    codex: state.providers.includes('codex')
      ? agents.codex.filter((a) => state.selectedAgents.codex.includes(a.name)) : [],
    delta: state.providers.includes('delta')
      ? agents.delta.filter((a) => state.selectedAgents.delta.includes(a.name)) : [],
  }
  const agentPlan = [
    ...buildAgentPlan(selectedAgents.codex, state.scope, cwd, home),
    ...buildDeltaAgentPlan(selectedAgents.delta, profilesDir),
  ]
  const fileCount = skillPlan.length + agentPlan.length

  const allSkillNames = new Set(skills.map((sk) => sk.name))
  const s = p.spinner()
  s.start('Installing')
  let done = 0
  for (const item of skillPlan) {
    installItem(item, allSkillNames)
    done += 1
    s.message(`Installing ${done}/${fileCount}`)
  }
  for (const item of agentPlan) {
    installAgent(item)
    done += 1
    s.message(`Installing ${done}/${fileCount}`)
  }
  s.stop(ansis.green(`Installed ${fileCount} item(s)`))

  p.note(renderNextSteps(), 'next steps')
  p.outro(ansis.green(`done · ${resolved.length} skills, ${agentPlan.length} subagents`))
}

async function pickProviders(detected: string[], initial: string[]): Promise<string[] | 'CANCEL'> {
  const res = await p.multiselect<string>({
    message: 'Select providers  ' + ansis.dim('(space toggle · a = all/none)'),
    options: PROVIDERS.map((pr) => ({
      value: pr.id,
      label: pr.label,
      hint: detected.includes(pr.id) ? 'detected' : undefined,
    })),
    initialValues: initial,
    required: true,
  })
  if (p.isCancel(res)) return 'CANCEL'
  return res
}

async function pickScope(cwd: string, home: string, initial: Scope): Promise<Scope | 'CANCEL'> {
  const res = await p.select<Scope>({
    message: 'Install scope',
    options: [
      { value: 'project', label: 'project', hint: cwd },
      { value: 'global', label: 'global', hint: home },
    ],
    initialValue: initial,
  })
  if (p.isCancel(res)) return 'CANCEL'
  return res
}

async function pickTopicSkills(
  topic: string,
  topicSkills: Skill[],
  initial: string[],
): Promise<string[] | 'CANCEL'> {
  const res = await p.multiselect<string>({
    message: `Select ${ansis.cyan(topic)} skills  ${ansis.dim('(space · a = all/none · empty = skip)')}`,
    options: topicSkills.map((s) => ({ value: s.name, label: s.name, hint: s.description })),
    initialValues: initial,
    required: false,
    maxItems: 10,
  })
  if (p.isCancel(res)) return 'CANCEL'
  return res
}

async function pickAgents(agents: Agent[], initial: string[], platform: Platform): Promise<string[] | 'CANCEL'> {
  const res = await p.multiselect<string>({
    message: `Select ${ansis.cyan(platform === 'delta' ? 'Delta subagents (machine-local)' : 'Codex agents')}  ${ansis.dim('(space · a = all/none · empty = skip)')}`,
    options: agents.map((agent) => ({ value: agent.name, label: agent.name, hint: agent.description })),
    initialValues: initial,
    required: false,
  })
  if (p.isCancel(res)) return 'CANCEL'
  return res
}

async function confirmStep(
  skills: Skill[],
  agents: Record<Platform, Agent[]>,
  providerIds: string[],
  scope: Scope,
  selected: string[],
  selectedAgents: Record<Platform, string[]>,
  dryRun: boolean,
  home: string,
  cwd: string,
  profilesDir: string,
): Promise<'GO' | 'DRYRUN' | 'BACK' | 'ABORT'> {
  const providers = PROVIDERS.filter((pr) => providerIds.includes(pr.id))
  const { skills: resolved, added } = resolveWithDeps(selected, skills)
  const skillPlan = buildPlan(resolved, providers, scope, cwd, home)
  const codexPlan = buildAgentPlan(
    providerIds.includes('codex') ? agents.codex.filter((a) => selectedAgents.codex.includes(a.name)) : [],
    scope, cwd, home,
  )
  const deltaPlan = buildDeltaAgentPlan(
    providerIds.includes('delta') ? agents.delta.filter((a) => selectedAgents.delta.includes(a.name)) : [],
    profilesDir,
  )

  p.note(renderReview(skillPlan, codexPlan, deltaPlan, resolved, providers, scope, added, home, cwd), 'Review')

  const conflicts = conflictingSkillTargets(skillPlan)
  if (conflicts.length > 0) {
    p.log.error(
      'Codex and Delta global skills share ~/.agents/skills but require different skill references. ' +
      'Choose project scope or only one of these providers.',
    )
    if (dryRun) {
      p.outro(ansis.red('dry run · conflicting destinations · nothing written'))
      return 'DRYRUN'
    }
    return 'BACK'
  }

  if (dryRun) {
    p.outro(ansis.dim('dry run · nothing written · drop --dry-run to install'))
    return 'DRYRUN'
  }

  const action = await p.select<'go' | 'cancel'>({
    message: `Install ${skillPlan.length + codexPlan.length + deltaPlan.length} item(s)?  ${ansis.dim('(Esc = back)')}`,
    options: [
      { value: 'go', label: 'Install' },
      { value: 'cancel', label: 'Cancel' },
    ],
    initialValue: 'go',
  })
  if (p.isCancel(action)) return 'BACK'
  if (action === 'cancel') return 'ABORT'
  return 'GO'
}

function renderReview(
  skillPlan: PlanItem[],
  codexPlan: AgentPlanItem[],
  deltaPlan: AgentPlanItem[],
  resolved: Skill[],
  providers: { label: string }[],
  scope: Scope,
  added: string[],
  home: string,
  cwd: string,
): string {
  // Everything is listed vertically so the box stays readable in a narrow
  // terminal — one provider, skill and file per line.
  const addedSet = new Set(added)
  const lines: string[] = []

  lines.push(ansis.cyan('providers') + ansis.dim(` · ${providers.length}`))
  for (const pr of providers) lines.push(`  ${pr.label}`)

  lines.push('', `${ansis.cyan('skill scope')}  ${scope}` + (codexPlan.length ? ' · Codex agents follow scope' : ''))

  lines.push('', ansis.cyan('skills') + ansis.dim(` · ${resolved.length}`))
  for (const s of resolved) {
    lines.push(`  ${s.name}${addedSet.has(s.name) ? ansis.magenta('  +dep') : ''}`)
  }

  lines.push('', ansis.cyan('Codex agents') + ansis.dim(` · ${codexPlan.length}`))
  for (const item of codexPlan) lines.push(`  ${item.agent.name}`)

  lines.push('', ansis.cyan('Delta subagents (machine-local)') + ansis.dim(` · ${deltaPlan.length}`))
  for (const item of deltaPlan) lines.push(`  ${item.agent.name}`)

  lines.push('', ansis.cyan('destinations') + ansis.dim(` · ${skillPlan.length + codexPlan.length + deltaPlan.length}`))
  for (const item of skillPlan) {
    const tag = item.status === 'overwrite' ? ansis.yellow('~') : ansis.green('+')
    lines.push(`  ${tag} ${shorten(item.targetDir, home, cwd)}`)
  }
  for (const item of [...codexPlan, ...deltaPlan]) {
    const tag = item.status === 'overwrite' ? ansis.yellow('~') : ansis.green('+')
    lines.push(`  ${tag} ${shorten(item.targetFile, home, cwd)}`)
  }

  return lines.join('\n')
}

function renderNextSteps(): string {
  return [
    `${ansis.cyan('run')}     try an installed skill or agent`,
    `${ansis.cyan('update')}  re-run add — it always overwrites`,
    `${ansis.cyan('list')}    npx --allow-git=root github:zemld/harness list`,
  ].join('\n')
}

function shorten(path: string, home: string, cwd: string): string {
  if (path.startsWith(cwd)) return '.' + path.slice(cwd.length)
  if (path.startsWith(home)) return '~' + path.slice(home.length)
  return path
}

function exit(): void {
  p.cancel('Cancelled — nothing written.')
  process.exit(0)
}
