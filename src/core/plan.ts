import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Agent } from './agents.js'
import { type Provider, type Scope, skillsRoot } from './providers.js'
import type { Skill } from './skills.js'

/** One skill-to-destination write, tagged new vs overwrite. */
export interface PlanItem {
  skill: Skill
  provider: Provider
  targetDir: string
  status: 'new' | 'overwrite'
}

export interface AgentPlanItem {
  agent: Agent
  targetFile: string
  status: 'new' | 'overwrite'
}

/**
 * Compute the full install plan: every (skill × provider) pair with its
 * absolute destination and whether that destination already exists.
 */
export function buildPlan(
  skills: Skill[],
  providers: Provider[],
  scope: Scope,
  cwd: string,
  home: string,
): PlanItem[] {
  const plan: PlanItem[] = []

  for (const provider of providers) {
    const root = skillsRoot(provider, scope, cwd, home)
    for (const skill of skills) {
      const targetDir = join(root, skill.name)
      plan.push({
        skill,
        provider,
        targetDir,
        status: existsSync(targetDir) ? 'overwrite' : 'new',
      })
    }
  }

  return plan
}

/** Compute Codex agent destinations for the selected scope. */
export function buildAgentPlan(agents: Agent[], scope: Scope, cwd: string, home: string): AgentPlanItem[] {
  const root = join(scope === 'project' ? cwd : home, '.codex', 'agents')
  return agents.map((agent) => {
    const targetFile = join(root, `${agent.name}.toml`)
    return { agent, targetFile, status: existsSync(targetFile) ? 'overwrite' : 'new' }
  })
}
