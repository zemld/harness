import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { PlanItem } from './plan.js'

/**
 * Write one plan item to disk. Always overwrites: the destination folder is
 * removed first so no stale files from a previous version survive, then the
 * canonical skill folder is copied verbatim (including any `references/`,
 * but excluding the skill's own `evals/` — those stay in the repo for
 * development and are not part of the installed skill).
 */
export function installItem(item: PlanItem): void {
  rmSync(item.targetDir, { recursive: true, force: true })
  mkdirSync(dirname(item.targetDir), { recursive: true })
  const evalsDir = join(item.skill.dir, 'evals')
  cpSync(item.skill.dir, item.targetDir, {
    recursive: true,
    filter: (source) => source !== evalsDir,
  })
}
