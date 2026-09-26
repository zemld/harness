import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { discoverAgents } from '../src/core/agents.js'
import { deltaProfilesRoot } from '../src/core/delta.js'
import { installAgent } from '../src/core/install.js'
import { buildAgentPlan, buildDeltaAgentPlan } from '../src/core/plan.js'

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'harness-agents-'))
}

describe('Codex agent installation', () => {
  it('uses the TOML name rather than its source filename for the destination', () => {
    const source = tmp()
    const content = 'name = "local-tester"\ndescription = "Tests a change"\ndeveloper_instructions = "Test it"\n'
    writeFileSync(join(source, 'tester.toml'), content)
    writeFileSync(join(source, 'notes.md'), 'not an agent')

    const agents = discoverAgents(source)
    const cwd = tmp()
    const plan = buildAgentPlan(agents, 'project', cwd, '/home/unused')
    expect(plan).toHaveLength(1)
    expect(plan[0].targetFile).toBe(join(cwd, '.codex', 'agents', 'local-tester.toml'))
    expect(plan[0].status).toBe('new')

    installAgent(plan[0])
    expect(readFileSync(plan[0].targetFile, 'utf8')).toBe(content)
  })

  it('overwrites only the selected global agent file', () => {
    const source = tmp()
    writeFileSync(join(source, 'reviewer.toml'), 'name = "reviewer"\ndescription = "Reviews changes"\n')
    const home = tmp()
    const targetDir = join(home, '.codex', 'agents')
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(join(targetDir, 'reviewer.toml'), 'old')
    writeFileSync(join(targetDir, 'other.toml'), 'keep')

    const plan = buildAgentPlan(discoverAgents(source), 'global', '/repo/unused', home)
    expect(plan[0].status).toBe('overwrite')
    installAgent(plan[0])

    expect(readFileSync(join(targetDir, 'reviewer.toml'), 'utf8')).toContain('Reviews changes')
    expect(readFileSync(join(targetDir, 'other.toml'), 'utf8')).toBe('keep')
  })

  it('rejects duplicate agent names before writing', () => {
    const source = tmp()
    const content = 'name = "reviewer"\ndescription = "Reviews changes"\n'
    writeFileSync(join(source, 'one.toml'), content)
    writeFileSync(join(source, 'two.toml'), content)

    expect(() => discoverAgents(source)).toThrow('Invalid or duplicate Codex agent')
  })
})

describe('Delta profile installation', () => {
  it('uses the filename as profile id and accepts a built-in reviewer override', () => {
    const source = tmp()
    writeFileSync(join(source, 'reviewer.toml'), 'worktree = "shared"\nprompt = "Check changes"\n')
    writeFileSync(join(source, 'code-writer.toml'), 'name = "Writer"\ndescription = "Implements a specification."\n')

    const agents = discoverAgents(source, 'delta')
    expect(agents.map((agent) => agent.name)).toEqual(['code-writer', 'reviewer'])
    const profiles = join(tmp(), 'delta', 'profiles')
    const plan = buildDeltaAgentPlan(agents, profiles)
    expect(plan[0].targetFile).toBe(join(profiles, 'code-writer.toml'))
    expect(plan[1].targetFile).toBe(join(profiles, 'reviewer.toml'))
    for (const item of plan) installAgent(item)
    expect(readFileSync(join(profiles, 'reviewer.toml'), 'utf8')).toBe('worktree = "shared"\nprompt = "Check changes"\n')
  })

  it('rejects a custom profile without a description', () => {
    const source = tmp()
    writeFileSync(join(source, 'writer.toml'), 'name = "Writer"\n')
    expect(() => discoverAgents(source, 'delta')).toThrow('Invalid or duplicate Delta profile')
  })

  it('uses Delta config paths regardless of the selected skill scope', () => {
    const home = tmp()
    expect(deltaProfilesRoot(home, 'darwin', {})).toBe(join(home, 'Library', 'Application Support', 'delta', 'profiles'))
    expect(deltaProfilesRoot(home, 'linux', { XDG_CONFIG_HOME: join(home, 'xdg') }))
      .toBe(join(home, 'xdg', 'delta', 'profiles'))
    expect(deltaProfilesRoot(home, 'win32', { APPDATA: join(home, 'appdata') }))
      .toBe(join(home, 'appdata', 'delta', 'profiles'))
    expect(deltaProfilesRoot(home, 'darwin', { DELTA_CONFIG_DIR: join(home, 'custom') }))
      .toBe(join(home, 'custom', 'profiles'))
  })
})
