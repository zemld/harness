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
    installItem({ skill: skill('a', src), provider: providerById('claude')!, targetDir, status: 'new' }, new Set())

    expect(readFileSync(join(targetDir, 'SKILL.md'), 'utf8')).toBe('body')
    expect(readFileSync(join(targetDir, 'references', 'r.md'), 'utf8')).toBe('ref')
  })

  it('skips the evals folder while copying everything else', () => {
    const src = tmp('harness-src-')
    writeFileSync(join(src, 'SKILL.md'), 'body')
    mkdirSync(join(src, 'evals'))
    writeFileSync(join(src, 'evals', 'evals.json'), '[]')

    const dest = tmp('harness-dest-')
    const targetDir = join(dest, '.claude', 'skills', 'a')
    installItem({ skill: skill('a', src), provider: providerById('claude')!, targetDir, status: 'new' }, new Set())

    expect(readFileSync(join(targetDir, 'SKILL.md'), 'utf8')).toBe('body')
    expect(readdirSync(targetDir)).not.toContain('evals')
  })

  it('overwrites cleanly, dropping files removed from the source', () => {
    const src = tmp('harness-src-')
    writeFileSync(join(src, 'SKILL.md'), 'v2')

    const dest = tmp('harness-dest-')
    const targetDir = join(dest, 'skills', 'a')
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(join(targetDir, 'stale.md'), 'old')

    installItem(
      { skill: skill('a', src), provider: providerById('claude')!, targetDir, status: 'overwrite' },
      new Set(),
    )

    expect(readdirSync(targetDir)).toEqual(['SKILL.md'])
    expect(readFileSync(join(targetDir, 'SKILL.md'), 'utf8')).toBe('v2')
  })

  it('rewrites `/skill-name` refs to `$skill-name` for codex only, leaving other providers untouched', () => {
    const src = tmp('harness-src-')
    writeFileSync(join(src, 'SKILL.md'), 'Then run `/test-feature` against the acceptance criteria.\nSee `/unknown-skill` too.')

    const codexDest = tmp('harness-dest-')
    const codexTarget = join(codexDest, '.agents', 'skills', 'a')
    installItem(
      { skill: skill('a', src), provider: providerById('codex')!, targetDir: codexTarget, status: 'new' },
      new Set(['test-feature']),
    )
    expect(readFileSync(join(codexTarget, 'SKILL.md'), 'utf8')).toBe(
      'Then run `$test-feature` against the acceptance criteria.\nSee `/unknown-skill` too.',
    )

    const claudeDest = tmp('harness-dest-')
    const claudeTarget = join(claudeDest, '.claude', 'skills', 'a')
    installItem(
      { skill: skill('a', src), provider: providerById('claude')!, targetDir: claudeTarget, status: 'new' },
      new Set(['test-feature']),
    )
    expect(readFileSync(join(claudeTarget, 'SKILL.md'), 'utf8')).toBe(
      'Then run `/test-feature` against the acceptance criteria.\nSee `/unknown-skill` too.',
    )
  })
})
