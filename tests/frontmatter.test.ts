import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '../src/core/frontmatter.js'

describe('parseFrontmatter', () => {
  it('parses scalar keys and returns the body', () => {
    const { data, body } = parseFrontmatter('---\nname: grill\ndescription: Grills you\n---\nBody text\n')
    expect(data.name).toBe('grill')
    expect(data.description).toBe('Grills you')
    expect(body).toBe('Body text\n')
  })

  it('parses an inline array', () => {
    const { data } = parseFrontmatter('---\nname: grill-me\nrequires: [grill, other]\n---\n')
    expect(data.requires).toEqual(['grill', 'other'])
  })

  it('parses a block array', () => {
    const { data } = parseFrontmatter('---\nrequires:\n  - grill\n  - other\n---\n')
    expect(data.requires).toEqual(['grill', 'other'])
  })

  it('strips surrounding quotes', () => {
    const { data } = parseFrontmatter('---\ndescription: "Designs a feature."\n---\n')
    expect(data.description).toBe('Designs a feature.')
  })

  it('returns empty data and the whole content when no frontmatter is present', () => {
    const { data, body } = parseFrontmatter('Just a body, no frontmatter')
    expect(data).toEqual({})
    expect(body).toBe('Just a body, no frontmatter')
  })
})
