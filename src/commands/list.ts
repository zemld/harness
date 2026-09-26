import ansis from 'ansis'
import { discoverAgents } from '../core/agents.js'
import { discoverSkills } from '../core/skills.js'

/** Print available skills and subagent profiles with their descriptions. */
export function runList({
  skillsRootDir,
  agentsRootDir,
  deltaAgentsRootDir,
}: { skillsRootDir: string; agentsRootDir: string; deltaAgentsRootDir: string }): void {
  const skills = discoverSkills(skillsRootDir)
  const agents = discoverAgents(agentsRootDir)
  const deltaAgents = discoverAgents(deltaAgentsRootDir, 'delta')
  if (skills.length === 0 && agents.length === 0 && deltaAgents.length === 0) {
    console.log('No skills or subagents found.')
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
  if (deltaAgents.length > 0) {
    console.log('\n' + ansis.bold.cyan('Delta subagents'))
    for (const agent of deltaAgents) {
      console.log(`  ${ansis.green(agent.name.padEnd(22))} ${ansis.dim(agent.description)}`)
    }
  }
  console.log()
}
