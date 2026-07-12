import ansis from 'ansis'
import { discoverSkills } from '../core/skills.js'

/** Print every available skill grouped by topic, with its description. */
export function runList({ skillsRootDir }: { skillsRootDir: string }): void {
  const skills = discoverSkills(skillsRootDir)
  if (skills.length === 0) {
    console.log('No skills found.')
    return
  }

  let currentTopic = ''
  for (const skill of skills) {
    if (skill.topic !== currentTopic) {
      currentTopic = skill.topic
      console.log('\n' + ansis.bold.cyan(currentTopic))
    }
    console.log(`  ${ansis.green(skill.name.padEnd(22))} ${ansis.dim(skill.description)}`)
  }
  console.log()
}
