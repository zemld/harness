/**
 * Minimal YAML frontmatter reader for skill files. Skills use a flat block of
 * `key: value` lines plus an optional `requires` list, so a full YAML parser is
 * unnecessary. Supports scalars, inline arrays (`requires: [a, b]`) and block
 * arrays (`- item` on following lines).
 */
export interface Frontmatter {
  data: Record<string, string | string[]>
  body: string
}

export function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: content }

  const data: Record<string, string | string[]> = {}
  const lines = match[1].split(/\r?\n/)
  let listKey: string | null = null

  for (const line of lines) {
    if (line.trim() === '') continue

    const listItem = line.match(/^\s*-\s+(.*)$/)
    if (listItem && listKey) {
      ;(data[listKey] as string[]).push(unquote(listItem[1].trim()))
      continue
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!pair) continue

    const key = pair[1]
    const raw = pair[2].trim()
    listKey = null

    if (raw === '') {
      data[key] = []
      listKey = key
    } else if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key] = raw
        .slice(1, -1)
        .split(',')
        .map((item) => unquote(item.trim()))
        .filter((item) => item !== '')
    } else {
      data[key] = unquote(raw)
    }
  }

  return { data, body: content.slice(match[0].length) }
}

function unquote(value: string): string {
  if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
    return value.slice(1, -1)
  }
  return value
}
