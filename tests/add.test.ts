import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runAdd } from '../src/commands/add.js'

const prompts = vi.hoisted(() => ({
  intro: vi.fn(),
  cancel: vi.fn(),
  multiselect: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn(() => false),
  note: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), message: vi.fn(), stop: vi.fn() })),
}))

vi.mock('@clack/prompts', () => prompts)

function sources() {
  const root = mkdtempSync(join(tmpdir(), 'harness-add-'))
  const deltaAgentsRootDir = join(root, 'delta')
  mkdirSync(deltaAgentsRootDir)
  writeFileSync(join(deltaAgentsRootDir, 'reviewer.toml'), 'worktree = "shared"\nprompt = "Review"\n')
  return { skillsRootDir: join(root, 'skills'), agentsRootDir: join(root, 'codex'), deltaAgentsRootDir }
}

describe('Delta wizard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers Delta subagents without Codex and previews the machine-local profile', async () => {
    prompts.multiselect.mockImplementation(({ message }: { message: string }) =>
      message.includes('Select providers') ? ['delta'] : ['reviewer'])
    prompts.select.mockResolvedValue('project')

    await runAdd({ ...sources(), dryRun: true })

    expect(prompts.multiselect).toHaveBeenCalledTimes(2)
    expect(prompts.multiselect.mock.calls[1][0].message).toContain('Delta subagents')
    expect(prompts.note.mock.calls[0][0]).toContain('profiles/reviewer.toml')
    expect(prompts.outro).toHaveBeenCalled()
  })

  it('installs a selected Delta profile into the active config directory', async () => {
    const dirs = sources()
    const config = join(dirname(dirs.deltaAgentsRootDir), 'config')
    vi.stubEnv('DELTA_CONFIG_DIR', config)
    try {
      prompts.multiselect.mockImplementation(({ message }: { message: string }) =>
        message.includes('Select providers') ? ['delta'] : ['reviewer'])
      prompts.select.mockImplementation(({ message }: { message: string }) =>
        message.includes('Install scope') ? 'project' : 'go')

      await runAdd({ ...dirs, dryRun: false })

      expect(prompts.spinner).toHaveBeenCalled()
      expect(prompts.note.mock.calls[0][0]).toContain(join(config, 'profiles', 'reviewer.toml'))
      expect(readFileSync(join(config, 'profiles', 'reviewer.toml'), 'utf8'))
        .toBe('worktree = "shared"\nprompt = "Review"\n')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('previews separate global Codex and Delta skill destinations', async () => {
    const dirs = sources()
    const skillDir = join(dirs.skillsRootDir, 'engineering', 'review')
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(join(skillDir, 'SKILL.md'), '---\nname: review\ndescription: Review\n---\n\nReview.')
    prompts.multiselect.mockImplementation(({ message }: { message: string }) => {
      if (message.includes('Select providers')) return ['codex', 'delta']
      if (message.includes('Select engineering')) return ['review']
      return []
    })
    prompts.select.mockResolvedValue('global')

    await runAdd({ ...dirs, dryRun: true })

    expect(prompts.log.error).not.toHaveBeenCalled()
    const review = prompts.note.mock.calls[0][0]
    expect(review).toContain('.codex/skills/review')
    expect(review).toContain('.agents/skills/review')
    expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining('dry run · nothing written'))
  })
})
