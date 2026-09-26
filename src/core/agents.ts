import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Agent {
  name: string
  description: string
  file: string
}

/** Discover Codex agents or Delta profiles from their TOML source directory. */
export function discoverAgents(dir: string, platform: 'codex' | 'delta' = 'codex'): Agent[] {
  const agents: Agent[] = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return agents
  }

  const names = new Set<string>()
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.toml')) continue
    const file = join(dir, entry.name)
    const content = readFileSync(file, 'utf8')
    // Delta's profile id is its filename. Built-in reviewer overrides need no
    // name or description in the TOML; Codex uses the name inside the file.
    const name = platform === 'delta' ? entry.name.slice(0, -5) : readString(content, 'name')
    const description = readString(content, 'description') ?? (platform === 'delta' && name === 'reviewer'
      ? 'Reviews code changes against a specification.'
      : undefined)
    if (!name || !/^[a-z][a-z0-9_-]*$/.test(name) || !description || names.has(name)) {
      throw new Error(`Invalid or duplicate ${platform === 'delta' ? 'Delta profile' : 'Codex agent'}: ${file}`)
    }
    names.add(name)
    agents.push({ name, description, file })
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name))
}

function readString(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`^${key}\\s*=\\s*(?:"([^"\\n]*)"|'([^'\\n]*)')\\s*$`, 'm'))
  return match?.[1] ?? match?.[2]
}
