import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installItem } from '../src/core/install.js'
import { buildPlan } from '../src/core/plan.js'
import { providerById } from '../src/core/providers.js'
import type { Skill } from '../src/core/skills.js'

function tmp(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function skill(name: string, dir: string): Skill {
  return { name, topic: 'productivity', description: '', requires: [], dir }
}

describe('buildPlan', () => {
  it('produces one item per (skill × provider) pair', () => {
    const plan = buildPlan(
      [skill('a', '/s/a'), skill('b', '/s/b')],
      [providerById('claude')!, providerById('cursor')!],
      'project',
      '/repo',
      '/home',
    )
    expect(plan).toHaveLength(4)
  })

  it('marks an existing target as overwrite and a fresh one as new', () => {
    const cwd = tmp('harness-plan-')
    mkdirSync(join(cwd, '.claude', 'skills', 'a'), { recursive: true })

    const plan = buildPlan(
      [skill('a', '/s/a'), skill('b', '/s/b')],
      [providerById('claude')!],
      'project',
      cwd,
      '/home',
    )
    expect(plan.find((i) => i.skill.name === 'a')!.status).toBe('overwrite')
    expect(plan.find((i) => i.skill.name === 'b')!.status).toBe('new')
  })
})

describe('installItem', () => {
  it('copies the skill folder (including references) to the target', () => {
    const src = tmp('harness-src-')
    writeFileSync(join(src, 'SKILL.md'), 'body')
    mkdirSync(join(src, 'references'))
    writeFileSync(join(src, 'references', 'r.md'), 'ref')

    const dest = tmp('harness-dest-')
    const targetDir = join(dest, '.claude', 'skills', 'a')
    installItem({ skill: skill('a', src), provider: providerById('claude')!, targetDir, status: 'new' })

    expect(readFileSync(join(targetDir, 'SKILL.md'), 'utf8')).toBe('body')
    expect(readFileSync(join(targetDir, 'references', 'r.md'), 'utf8')).toBe('ref')
  })

  it('overwrites cleanly, dropping files removed from the source', () => {
    const src = tmp('harness-src-')
    writeFileSync(join(src, 'SKILL.md'), 'v2')

    const dest = tmp('harness-dest-')
    const targetDir = join(dest, 'skills', 'a')
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(join(targetDir, 'stale.md'), 'old')

    installItem({ skill: skill('a', src), provider: providerById('claude')!, targetDir, status: 'overwrite' })

    expect(readdirSync(targetDir)).toEqual(['SKILL.md'])
    expect(readFileSync(join(targetDir, 'SKILL.md'), 'utf8')).toBe('v2')
  })
})
