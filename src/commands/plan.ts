import { readSwarmFileAsync } from '../hooks/utils';

export async function handlePlanCommand(
	directory: string,
	args: string[],
): Promise<string> {
	// 1. Read plan.md
	const planContent = await readSwarmFileAsync(directory, 'plan.md');

	if (!planContent) {
		return 'No active swarm plan found.';
	}

	// 2. If no args, return full plan
	if (args.length === 0) {
		return planContent;
	}

	// 3. If numeric arg, extract that specific phase
	const phaseNum = parseInt(args[0], 10);
	if (Number.isNaN(phaseNum)) {
		// Non-numeric arg — return full plan
		return planContent;
	}

	// 4. Extract specific phase section
	//    Split on ## Phase N headers, find matching section
	const lines = planContent.split('\n');
	const phaseLines: string[] = [];
	let inTargetPhase = false;

	for (const line of lines) {
		// Check for phase header: "## Phase N" (with any trailing text)
		const phaseMatch = line.match(/^## Phase (\d+)/);

		if (phaseMatch) {
			const num = parseInt(phaseMatch[1], 10);
			if (num === phaseNum) {
				inTargetPhase = true;
				phaseLines.push(line);
				continue;
			} else if (inTargetPhase) {
				// Hit the next phase — stop
				break;
			}
		}

		// Also stop at --- (horizontal rule between phases) if we're in target phase
		// and we've already collected lines
		if (inTargetPhase && line.trim() === '---' && phaseLines.length > 1) {
			break;
		}

		if (inTargetPhase) {
			phaseLines.push(line);
		}
	}

	if (phaseLines.length === 0) {
		return `Phase ${phaseNum} not found in plan.`;
	}

	return phaseLines.join('\n').trim();
}
