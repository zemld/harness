/**
 * Skill bodies reference each other in prose as `` `/skill-name` `` — Claude
 * Code's slash-invocation syntax. Codex's CLI parser doesn't recognize a
 * leading slash as invocation; it uses `$skill-name` instead. Codex installs
 * get this rewrite; every other provider keeps the source text verbatim.
 */
const SKILL_REFERENCE = /`\/([a-z][a-z0-9-]*)`/g

export function rewriteSkillReferences(content: string, skillNames: ReadonlySet<string>): string {
  return content.replace(SKILL_REFERENCE, (match, name: string) =>
    skillNames.has(name) ? `\`$${name}\`` : match,
  )
}
