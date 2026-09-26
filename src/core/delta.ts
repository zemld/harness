import { join } from 'node:path'

/** Delta's machine-local config directory, not the repository's .delta directory. */
export function deltaProfilesRoot(
  home: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (env.DELTA_CONFIG_DIR) return join(env.DELTA_CONFIG_DIR, 'profiles')
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'delta', 'profiles')
  if (platform === 'win32') return join(env.APPDATA || join(home, 'AppData', 'Roaming'), 'delta', 'profiles')
  return join(env.XDG_CONFIG_HOME || join(home, '.config'), 'delta', 'profiles')
}
