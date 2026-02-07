import type { AgentDefinition } from '../agents';
import { extractCurrentPhase } from '../hooks/extractors';
import { readSwarmFileAsync } from '../hooks/utils';

export async function handleStatusCommand(
	directory: string,
	agents: Record<string, AgentDefinition>,
): Promise<string> {
	// 1. Read plan.md
	const planContent = await readSwarmFileAsync(directory, 'plan.md');

	// 2. If no plan.md, return early
	if (!planContent) {
		return 'No active swarm plan found.';
	}

	// 3. Extract current phase using existing extractCurrentPhase()
	const currentPhase = extractCurrentPhase(planContent) || 'Unknown';

	// 4. Count tasks: completed (- [x]) vs total (- [x] + - [ ]) in the ENTIRE plan
	//    Use regex to count across all lines
	const completedTasks = (planContent.match(/^- \[x\]/gm) || []).length;
	const incompleteTasks = (planContent.match(/^- \[ \]/gm) || []).length;
	const totalTasks = completedTasks + incompleteTasks;

	// 5. Get agent count
	const agentCount = Object.keys(agents).length;

	// 6. Format as concise markdown
	const lines = [
		'## Swarm Status',
		'',
		`**Current Phase**: ${currentPhase}`,
		`**Tasks**: ${completedTasks}/${totalTasks} complete`,
		`**Agents**: ${agentCount} registered`,
	];

	return lines.join('\n');
}
