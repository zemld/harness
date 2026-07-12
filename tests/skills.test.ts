import { describe, expect, it } from 'vitest'
import { resolveWithDeps, type Skill } from '../src/core/skills.js'

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
