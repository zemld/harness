import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { discoverSkills, resolveWithDeps, type Skill } from '../src/core/skills.js'

describe('repository skill catalog', () => {
  it('offers the current personal skills and excludes the deprecated archive', () => {
    const skillsRoot = fileURLToPath(new URL('../skills/', import.meta.url))
    const skills = discoverSkills(skillsRoot)

    expect(skills.map((entry) => entry.name).sort()).toEqual([
      'analyze-review-issues',
      'create-slides',
      'create-spec',
      'grill-me',
      'handoff',
      'implement-spec',
      'refactor-project',
      'test-feature',
      'upsert-skill',
    ])
    expect(skills.every((entry) => entry.topic !== 'deprecated')).toBe(true)
  })
})

function skill(name: string, requires: string[] = []): Skill {
  return { name, topic: 'productivity', description: '', requires, dir: `/skills/${name}` }
}

const ALL: Skill[] = [
  skill('grill'),
  skill('grill-me', ['grill']),
  skill('create-prd', ['grill']),
  skill('divide-prd', ['create-prd']),
  skill('lonely'),
]

describe('resolveWithDeps', () => {
  it('pulls in a direct dependency and reports it as added', () => {
    const { skills, added } = resolveWithDeps(['grill-me'], ALL)
    expect(skills.map((s) => s.name).sort()).toEqual(['grill', 'grill-me'])
    expect(added).toEqual(['grill'])
  })

  it('resolves dependencies transitively', () => {
    const { skills, added } = resolveWithDeps(['divide-prd'], ALL)
    expect(skills.map((s) => s.name).sort()).toEqual(['create-prd', 'divide-prd', 'grill'])
    expect(added.sort()).toEqual(['create-prd', 'grill'])
  })

  it('does not duplicate a shared dependency', () => {
    const { skills } = resolveWithDeps(['grill-me', 'create-prd'], ALL)
    expect(skills.map((s) => s.name).filter((n) => n === 'grill')).toHaveLength(1)
  })

  it('reports nothing added when the selection is already closed', () => {
    const { added } = resolveWithDeps(['lonely'], ALL)
    expect(added).toEqual([])
  })

  it('ignores an unknown dependency name without throwing', () => {
    const withMissing = [skill('needs-ghost', ['ghost'])]
    const { skills, added } = resolveWithDeps(['needs-ghost'], withMissing)
    expect(skills.map((s) => s.name)).toEqual(['needs-ghost'])
    expect(added).toEqual([])
  })
})
