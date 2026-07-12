import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from './frontmatter.js'

/** A single skill discovered under `skills/<topic>/<name>/SKILL.md`. */
export interface Skill {
  name: string
  topic: string
  description: string
  requires: string[]
  dir: string
}

const HIDDEN_TOPICS = new Set(['deprecated'])

/** Scan the repo's `skills/` root and return every skill grouped by topic. */
export function discoverSkills(skillsRootDir: string): Skill[] {
  const skills: Skill[] = []

  for (const topic of subdirs(skillsRootDir)) {
    if (HIDDEN_TOPICS.has(topic)) continue
    const topicDir = join(skillsRootDir, topic)

    for (const name of subdirs(topicDir)) {
      const dir = join(topicDir, name)
      const skill = readSkill(dir, topic, name)
      if (skill) skills.push(skill)
    }
  }

  skills.sort((a, b) => a.topic.localeCompare(b.topic) || a.name.localeCompare(b.name))
  return skills
}

/**
 * Expand a selection to include every transitive `requires` dependency.
 * Returns the full skill set plus the names that were pulled in automatically.
 */
export function resolveWithDeps(
  selected: string[],
  all: Skill[],
): { skills: Skill[]; added: string[] } {
  const byName = new Map(all.map((s) => [s.name, s]))
  const chosen = new Set<string>()
  const queue = [...selected]

  while (queue.length > 0) {
    const name = queue.shift()!
    if (chosen.has(name)) continue
    chosen.add(name)
    const skill = byName.get(name)
    if (skill) queue.push(...skill.requires)
  }

  const skills = all.filter((s) => chosen.has(s.name))
  const selectedSet = new Set(selected)
  const added = skills.map((s) => s.name).filter((name) => !selectedSet.has(name))
  return { skills, added }
}

function readSkill(dir: string, topic: string, name: string): Skill | null {
  let content: string
  try {
    content = readFileSync(join(dir, 'SKILL.md'), 'utf8')
  } catch {
    return null
  }

  const { data } = parseFrontmatter(content)
  const description = typeof data.description === 'string' ? data.description : ''
  const requires = Array.isArray(data.requires) ? data.requires : []
  return { name, topic, description, requires, dir }
}

function subdirs(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}
