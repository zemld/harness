import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { deltaProfilesRoot } from './delta.js'

export type Scope = 'project' | 'global'

/**
 * A target agent platform. Under the open Agent Skills standard every provider
 * reads the canonical `SKILL.md` folder verbatim, so a provider is just a pair
 * of destination directories (project / global) plus a detection signal — no
 * format conversion is ever needed.
 */
export interface Provider {
  id: string
  label: string
  /** Path segments of the skills root, relative to the project cwd. */
  projectDir: string[]
  /** Path segments of the skills root, relative to the user home dir. */
  globalDir: string[]
  /** Candidate home-relative dirs; the provider is "detected" if any exists. */
  detect: string[][]
}

export const PROVIDERS: Provider[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    projectDir: ['.claude', 'skills'],
    globalDir: ['.claude', 'skills'],
    detect: [['.claude']],
  },
  {
    id: 'cursor',
    label: 'Cursor',
    projectDir: ['.cursor', 'skills'],
    globalDir: ['.cursor', 'skills'],
    detect: [['.cursor']],
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    projectDir: ['.opencode', 'skills'],
    globalDir: ['.config', 'opencode', 'skills'],
    detect: [['.config', 'opencode']],
  },
  {
    id: 'codex',
    label: 'Codex',
    projectDir: ['.codex', 'skills'],
    globalDir: ['.codex', 'skills'],
    detect: [['.codex']],
  },
  {
    id: 'delta',
    label: 'Delta',
    projectDir: ['.delta', 'skills'],
    globalDir: ['.agents', 'skills'],
    detect: [], // The active config path may be relocated by DELTA_CONFIG_DIR.
  },
]

export function providerById(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

/** Absolute skills-root directory for a provider at the given scope. */
export function skillsRoot(provider: Provider, scope: Scope, cwd: string, home: string): string {
  const segments = scope === 'project' ? provider.projectDir : provider.globalDir
  return join(scope === 'project' ? cwd : home, ...segments)
}

/** True when the provider's config directory is present on this machine. */
export function isDetected(provider: Provider, home: string): boolean {
  if (provider.id === 'delta') return existsSync(dirname(deltaProfilesRoot(home)))
  return provider.detect.some((segments) => existsSync(join(home, ...segments)))
}
