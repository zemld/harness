import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { PlanItem } from './plan.js'
import { rewriteSkillReferences } from './skill-refs.js'

/**
 * Write one plan item to disk. Always overwrites: the destination folder is
 * removed first so no stale files from a previous version survive, then the
 * canonical skill folder is copied verbatim (including any `references/`,
 * but excluding the skill's own `evals/` — those stay in the repo for
 * development and are not part of the installed skill).
 *
 * Codex is the one provider whose CLI parser doesn't recognize `/skill-name`
 * as invocation syntax, so its copy gets every `.md` file's skill references
 * rewritten to `$skill-name` after the verbatim copy. Every other provider's
 * files are left untouched.
 */
export function installItem(item: PlanItem, allSkillNames: ReadonlySet<string>): void {
  rmSync(item.targetDir, { recursive: true, force: true })
  mkdirSync(dirname(item.targetDir), { recursive: true })
  const evalsDir = join(item.skill.dir, 'evals')
  cpSync(item.skill.dir, item.targetDir, {
    recursive: true,
    filter: (source) => source !== evalsDir,
  })

  if (item.provider.id === 'codex') {
    rewriteSkillReferencesInDir(item.targetDir, allSkillNames)
  }
}

function rewriteSkillReferencesInDir(dir: string, skillNames: ReadonlySet<string>): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      rewriteSkillReferencesInDir(full, skillNames)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue

    const content = readFileSync(full, 'utf8')
    const rewritten = rewriteSkillReferences(content, skillNames)
    if (rewritten !== content) writeFileSync(full, rewritten, 'utf8')
  }
}
