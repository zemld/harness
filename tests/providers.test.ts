import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { isDetected, providerById, skillsRoot } from '../src/core/providers.js'

describe('skillsRoot', () => {
  it('maps each provider to its project-scoped skills dir', () => {
    const cwd = '/repo'
    const home = '/home/u'
    expect(skillsRoot(providerById('claude')!, 'project', cwd, home)).toBe('/repo/.claude/skills')
    expect(skillsRoot(providerById('cursor')!, 'project', cwd, home)).toBe('/repo/.cursor/skills')
    expect(skillsRoot(providerById('opencode')!, 'project', cwd, home)).toBe('/repo/.opencode/skills')
    expect(skillsRoot(providerById('codex')!, 'project', cwd, home)).toBe('/repo/.codex/skills')
    expect(skillsRoot(providerById('delta')!, 'project', cwd, home)).toBe('/repo/.delta/skills')
  })

  it('maps global scope under the home directory', () => {
    const home = '/home/u'
    expect(skillsRoot(providerById('claude')!, 'global', '/repo', home)).toBe('/home/u/.claude/skills')
    expect(skillsRoot(providerById('opencode')!, 'global', '/repo', home)).toBe('/home/u/.config/opencode/skills')
    expect(skillsRoot(providerById('codex')!, 'global', '/repo', home)).toBe('/home/u/.codex/skills')
    expect(skillsRoot(providerById('delta')!, 'global', '/repo', home)).toBe('/home/u/.agents/skills')
  })
})

describe('isDetected', () => {
  it('detects a provider when its config dir exists under home', () => {
    const home = mkdtempSync(join(tmpdir(), 'harness-detect-'))
    mkdirSync(join(home, '.cursor'))
    expect(isDetected(providerById('cursor')!, home)).toBe(true)
    expect(isDetected(providerById('claude')!, home)).toBe(false)
  })

  it('detects codex via .codex, not Delta’s .agents', () => {
    const home = mkdtempSync(join(tmpdir(), 'harness-detect-'))
    mkdirSync(join(home, '.agents'))
    expect(isDetected(providerById('codex')!, home)).toBe(false)
    mkdirSync(join(home, '.codex'))
    expect(isDetected(providerById('codex')!, home)).toBe(true)
  })

  it('detects Delta in its active config directory', () => {
    const home = mkdtempSync(join(tmpdir(), 'harness-detect-'))
    const config = join(home, 'custom-delta')
    vi.stubEnv('DELTA_CONFIG_DIR', config)
    try {
      expect(isDetected(providerById('delta')!, home)).toBe(false)
      mkdirSync(config)
      expect(isDetected(providerById('delta')!, home)).toBe(true)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
