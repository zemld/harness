import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const skill = readFileSync(
  new URL('../skills/engineering/implement-feature/SKILL.md', import.meta.url),
  'utf8',
)

describe('implement-feature publication contract', () => {
  it('publishes a pull request without a second user request', () => {
    expect(skill).toContain('publishable non-default branch')
    expect(skill).toContain('Do not wait for a separate request to create the pull request.')
    expect(skill).toContain('create or update its pull request')
  })

  it('publishes blocked work as a draft and verifies the remote result', () => {
    expect(skill).toContain('publish or update a draft pull request')
    expect(skill).toContain('Read the published pull request back and verify')
    expect(skill).toContain('never merge the pull request')
  })
})
