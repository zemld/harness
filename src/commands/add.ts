import { homedir } from 'node:os'
import * as p from '@clack/prompts'
import ansis from 'ansis'
import { installItem } from '../core/install.js'
import { buildPlan, type PlanItem } from '../core/plan.js'
import { isDetected, PROVIDERS, type Scope } from '../core/providers.js'
import { discoverSkills, resolveWithDeps, type Skill } from '../core/skills.js'

export interface AddOptions {
  skillsRootDir: string
  dryRun: boolean
}

type Step = { kind: 'providers' } | { kind: 'scope' } | { kind: 'skills'; topic: string } | { kind: 'confirm' }

export async function runAdd({ skillsRootDir, dryRun }: AddOptions): Promise<void> {
  const cwd = process.cwd()
  const home = homedir()

  p.intro(ansis.bold('harness') + ansis.dim(' · install agent skills · Esc = back'))

  const skills = discoverSkills(skillsRootDir)
  if (skills.length === 0) {
    p.cancel('No skills found in this repository.')
    process.exit(1)
  }

  const detected = PROVIDERS.filter((pr) => isDetected(pr, home)).map((pr) => pr.id)
  const state = { providers: detected, scope: 'project' as Scope, selected: [] as string[] }

  // One step per topic keeps every skill list short: no scrolling past one
  // category to reach the next. Esc walks one step back; from the first step it
  // leaves the wizard.
  const topics = [...new Set(skills.map((s) => s.topic))]
  const steps: Step[] = [
    { kind: 'providers' },
    { kind: 'scope' },
    ...topics.map((topic): Step => ({ kind: 'skills', topic })),
    { kind: 'confirm' },
  ]

  let i = 0
  while (i < steps.length) {
    const step = steps[i]

    if (step.kind === 'providers') {
      const r = await pickProviders(detected, state.providers)
      if (r === 'CANCEL') return exit()
      state.providers = r
      i += 1
    } else if (step.kind === 'scope') {
      const r = await pickScope(cwd, home, state.scope)
      if (r === 'CANCEL') i -= 1
      else {
        state.scope = r
        i += 1
      }
    } else if (step.kind === 'skills') {
      const topicSkills = skills.filter((s) => s.topic === step.topic)
      const names = topicSkills.map((s) => s.name)
      const initial = state.selected.filter((n) => names.includes(n))
      const r = await pickTopicSkills(step.topic, topicSkills, initial)
      if (r === 'CANCEL') i -= 1
      else {
        state.selected = [...state.selected.filter((n) => !names.includes(n)), ...r]
        i += 1
      }
    } else {
      if (state.selected.length === 0) {
        p.log.warn('Pick at least one skill.')
        i -= 1
        continue
      }
      const r = await confirmStep(skills, state.providers, state.scope, state.selected, dryRun, home, cwd)
      if (r === 'ABORT') return exit()
      if (r === 'BACK') i -= 1
      else if (r === 'DRYRUN') return
      else break // GO
    }
  }

  const providers = PROVIDERS.filter((pr) => state.providers.includes(pr.id))
  const { skills: resolved } = resolveWithDeps(state.selected, skills)
  const plan = buildPlan(resolved, providers, state.scope, cwd, home)

  const s = p.spinner()
  s.start('Installing')
  let done = 0
  for (const item of plan) {
    installItem(item)
    done += 1
    s.message(`Installing ${done}/${plan.length}`)
  }
  s.stop(ansis.green(`Installed ${plan.length} file(s)`))

  p.note(renderNextSteps(), 'next steps')
  p.outro(ansis.green(`done · ${resolved.length} skills → ${providers.length} providers`))
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

async function confirmStep(
  skills: Skill[],
  providerIds: string[],
  scope: Scope,
  selected: string[],
  dryRun: boolean,
  home: string,
  cwd: string,
): Promise<'GO' | 'DRYRUN' | 'BACK' | 'ABORT'> {
  const providers = PROVIDERS.filter((pr) => providerIds.includes(pr.id))
  const { skills: resolved, added } = resolveWithDeps(selected, skills)
  const plan = buildPlan(resolved, providers, scope, cwd, home)

  p.note(renderReview(plan, resolved, providers, scope, added, home, cwd), 'Review')

  if (dryRun) {
    p.outro(ansis.dim('dry run · nothing written · drop --dry-run to install'))
    return 'DRYRUN'
  }

  const action = await p.select<'go' | 'cancel'>({
    message: `Install ${plan.length} file(s)?  ${ansis.dim('(Esc = back)')}`,
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
  plan: PlanItem[],
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

  lines.push('', `${ansis.cyan('scope')}  ${scope}`)

  lines.push('', ansis.cyan('skills') + ansis.dim(` · ${resolved.length}`))
  for (const s of resolved) {
    lines.push(`  ${s.name}${addedSet.has(s.name) ? ansis.magenta('  +dep') : ''}`)
  }

  lines.push('', ansis.cyan('files') + ansis.dim(` · ${plan.length}`))
  for (const item of plan) {
    const tag = item.status === 'overwrite' ? ansis.yellow('~') : ansis.green('+')
    lines.push(`  ${tag} ${shorten(item.targetDir, home, cwd)}`)
  }

  return lines.join('\n')
}

function renderNextSteps(): string {
  return [
    `${ansis.cyan('run')}     try a skill in your agent`,
    `${ansis.cyan('update')}  re-run add — it always overwrites`,
    `${ansis.cyan('list')}    npx github:zemld/harness list`,
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
