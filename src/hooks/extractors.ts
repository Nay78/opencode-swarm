/**
 * Swarm File Extractors
 *
 * Pure parsing functions for extracting structured data from .swarm/ files.
 * Used by system-enhancer and compaction-customizer hooks.
 */

/**
 * Extracts the current phase information from plan content.
 */
export function extractCurrentPhase(planContent: string): string | null {
	if (!planContent) {
		return null;
	}

	const lines = planContent.split('\n');

	// Look for IN PROGRESS phase in the first 20 lines
	for (let i = 0; i < Math.min(20, lines.length); i++) {
		const line = lines[i].trim();
		const progressMatch = line.match(
			/^## Phase (\d+):?\s*(.*?)\s*\[IN PROGRESS\]/i,
		);
		if (progressMatch) {
			const phaseNum = progressMatch[1];
			const description = progressMatch[2]?.trim() || '';
			return `Phase ${phaseNum}: ${description} [IN PROGRESS]`;
		}
	}

	// Look for Phase: N in the first 3 lines (header)
	for (let i = 0; i < Math.min(3, lines.length); i++) {
		const line = lines[i].trim();
		const phaseMatch = line.match(/Phase:\s*(\d+)/i);
		if (phaseMatch) {
			const phaseNum = phaseMatch[1];
			return `Phase ${phaseNum} [PENDING]`;
		}
	}

	return null;
}

/**
 * Extracts the first incomplete task from the current IN PROGRESS phase.
 */
export function extractCurrentTask(planContent: string): string | null {
	if (!planContent) {
		return null;
	}

	const lines = planContent.split('\n');
	let inCurrentPhase = false;

	for (const line of lines) {
		// Find the IN PROGRESS phase
		if (line.startsWith('## ') && /\[IN PROGRESS\]/i.test(line)) {
			inCurrentPhase = true;
			continue;
		}

		if (inCurrentPhase) {
			// Stop at the next phase heading or horizontal rule
			if (line.startsWith('## ') || line.trim() === '---') {
				break;
			}
			// Find the first incomplete task
			if (line.trim().startsWith('- [ ]')) {
				return line.trim();
			}
		}
	}

	return null;
}

/**
 * Extracts decisions section from context content.
 */
export function extractDecisions(
	contextContent: string,
	maxChars: number = 500,
): string | null {
	if (!contextContent) {
		return null;
	}

	const lines = contextContent.split('\n');
	let decisionsText = '';
	let inDecisionsSection = false;

	for (const line of lines) {
		if (line.trim() === '## Decisions') {
			inDecisionsSection = true;
			continue;
		}

		if (inDecisionsSection) {
			if (line.startsWith('## ')) {
				// Reached next section
				break;
			}
			if (line.startsWith('- ')) {
				decisionsText += `${line}\n`;
			}
		}
	}

	if (!decisionsText.trim()) {
		return null;
	}

	// Truncate to maxChars and clean up
	const trimmed = decisionsText.trim();
	if (trimmed.length <= maxChars) {
		return trimmed;
	}

	return `${trimmed.slice(0, maxChars)}...`;
}

/**
 * Extracts incomplete tasks from plan content under the current IN PROGRESS phase.
 */
export function extractIncompleteTasks(
	planContent: string,
	maxChars: number = 500,
): string | null {
	if (!planContent) {
		return null;
	}

	const lines = planContent.split('\n');
	let tasksText = '';
	let inCurrentPhase = false;

	for (const line of lines) {
		// Find the IN PROGRESS phase
		if (line.startsWith('## ') && /\[IN PROGRESS\]/i.test(line)) {
			inCurrentPhase = true;
			continue;
		}

		if (inCurrentPhase) {
			// Stop at the next phase heading or horizontal rule
			if (line.startsWith('## ') || line.trim() === '---') {
				break;
			}
			// Collect incomplete tasks (- [ ] lines)
			if (line.trim().startsWith('- [ ]')) {
				tasksText += `${line.trim()}\n`;
			}
		}
	}

	if (!tasksText.trim()) {
		return null;
	}

	const trimmed = tasksText.trim();
	if (trimmed.length <= maxChars) {
		return trimmed;
	}

	return `${trimmed.slice(0, maxChars)}...`;
}

/**
 * Extracts patterns section from context content.
 */
export function extractPatterns(
	contextContent: string,
	maxChars: number = 500,
): string | null {
	if (!contextContent) {
		return null;
	}

	const lines = contextContent.split('\n');
	let patternsText = '';
	let inPatternsSection = false;

	for (const line of lines) {
		if (line.trim() === '## Patterns') {
			inPatternsSection = true;
			continue;
		}

		if (inPatternsSection) {
			if (line.startsWith('## ')) {
				break;
			}
			if (line.startsWith('- ')) {
				patternsText += `${line}\n`;
			}
		}
	}

	if (!patternsText.trim()) {
		return null;
	}

	const trimmed = patternsText.trim();
	if (trimmed.length <= maxChars) {
		return trimmed;
	}

	return `${trimmed.slice(0, maxChars)}...`;
}
