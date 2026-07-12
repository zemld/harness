import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import type { PlanItem } from './plan.js'

/**
 * Write one plan item to disk. Always overwrites: the destination folder is
 * removed first so no stale files from a previous version survive, then the
 * canonical skill folder is copied verbatim (including any `references/`).
 */
export function installItem(item: PlanItem): void {
  rmSync(item.targetDir, { recursive: true, force: true })
  mkdirSync(dirname(item.targetDir), { recursive: true })
  cpSync(item.skill.dir, item.targetDir, { recursive: true })
}
