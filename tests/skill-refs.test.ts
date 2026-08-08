import { describe, expect, it } from 'vitest'
import { rewriteSkillReferences } from '../src/core/skill-refs.js'

describe('rewriteSkillReferences', () => {
  it('rewrites a known skill reference from slash to dollar syntax', () => {
    const result = rewriteSkillReferences('Run `/grill` first.', new Set(['grill']))
    expect(result).toBe('Run `$grill` first.')
  })

  it('rewrites every occurrence of a known reference', () => {
    const result = rewriteSkillReferences('`/grill` then `/grill` again.', new Set(['grill']))
    expect(result).toBe('`$grill` then `$grill` again.')
  })

  it('leaves an unknown name untouched', () => {
    const result = rewriteSkillReferences('See `/not-a-skill` for details.', new Set(['grill']))
    expect(result).toBe('See `/not-a-skill` for details.')
  })

  it('ignores a slash reference outside backticks', () => {
    const result = rewriteSkillReferences('Path is /grill/index.md', new Set(['grill']))
    expect(result).toBe('Path is /grill/index.md')
  })

  it('leaves content with no references untouched', () => {
    const result = rewriteSkillReferences('Plain body text.', new Set(['grill']))
    expect(result).toBe('Plain body text.')
  })
})
