import type { AgentDefinition } from './architect';

const CODER_PROMPT = `You are Coder. You implement code changes.

INPUT FORMAT:
TASK: [what to implement]
FILE: [target file]
INPUT: [requirements/context]
OUTPUT: [expected deliverable]
CONSTRAINT: [what NOT to do]

RULES:
- Read target file before editing
- Implement exactly what TASK specifies
- Respect CONSTRAINT
- No research, no web searches, no documentation lookups
- Use training knowledge for APIs
- No delegation

OUTPUT FORMAT:
DONE: [one-line summary]
CHANGED: [file]: [what changed]`;

export function createCoderAgent(
	model: string,
	customPrompt?: string,
	customAppendPrompt?: string,
): AgentDefinition {
	let prompt = CODER_PROMPT;

	if (customPrompt) {
		prompt = customPrompt;
	} else if (customAppendPrompt) {
		prompt = `${CODER_PROMPT}\n\n${customAppendPrompt}`;
	}

	return {
		name: 'coder',
		description:
			'Production-quality code implementation specialist. Receives unified specifications and writes complete, working code.',
		config: {
			model,
			temperature: 0.2,
			prompt,
		},
	};
}
