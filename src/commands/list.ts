import ansis from 'ansis'
import { discoverAgents } from '../core/agents.js'
import { discoverSkills } from '../core/skills.js'

/** Print available skills and Codex agents with their descriptions. */
export function runList({ skillsRootDir, agentsRootDir }: { skillsRootDir: string; agentsRootDir: string }): void {
  const skills = discoverSkills(skillsRootDir)
  const agents = discoverAgents(agentsRootDir)
  if (skills.length === 0 && agents.length === 0) {
    console.log('No skills or Codex agents found.')
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
  if (agents.length > 0) {
    console.log('\n' + ansis.bold.cyan('Codex agents'))
    for (const agent of agents) {
      console.log(`  ${ansis.green(agent.name.padEnd(22))} ${ansis.dim(agent.description)}`)
    }
  }
  console.log()
}
