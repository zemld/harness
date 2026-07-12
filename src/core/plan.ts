import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { type Provider, type Scope, skillsRoot } from './providers.js'
import type { Skill } from './skills.js'

/** One skill-to-destination write, tagged new vs overwrite. */
export interface PlanItem {
  skill: Skill
  provider: Provider
  targetDir: string
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
