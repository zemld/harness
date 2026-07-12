import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isDetected, providerById, skillsRoot } from '../src/core/providers.js'

describe('skillsRoot', () => {
  it('maps each provider to its project-scoped skills dir', () => {
    const cwd = '/repo'
    const home = '/home/u'
    expect(skillsRoot(providerById('claude')!, 'project', cwd, home)).toBe('/repo/.claude/skills')
    expect(skillsRoot(providerById('cursor')!, 'project', cwd, home)).toBe('/repo/.cursor/skills')
    expect(skillsRoot(providerById('opencode')!, 'project', cwd, home)).toBe('/repo/.opencode/skills')
    expect(skillsRoot(providerById('codex')!, 'project', cwd, home)).toBe('/repo/.agents/skills')
  })

  it('maps global scope under the home directory', () => {
    const home = '/home/u'
    expect(skillsRoot(providerById('claude')!, 'global', '/repo', home)).toBe('/home/u/.claude/skills')
    expect(skillsRoot(providerById('opencode')!, 'global', '/repo', home)).toBe('/home/u/.config/opencode/skills')
  })
})

describe('isDetected', () => {
  it('detects a provider when its config dir exists under home', () => {
    const home = mkdtempSync(join(tmpdir(), 'harness-detect-'))
    mkdirSync(join(home, '.cursor'))
    expect(isDetected(providerById('cursor')!, home)).toBe(true)
    expect(isDetected(providerById('claude')!, home)).toBe(false)
  })

  it('detects codex via either .codex or .agents', () => {
    const home = mkdtempSync(join(tmpdir(), 'harness-detect-'))
    mkdirSync(join(home, '.agents'))
    expect(isDetected(providerById('codex')!, home)).toBe(true)
  })
})
