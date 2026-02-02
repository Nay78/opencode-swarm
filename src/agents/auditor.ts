import type { AgentDefinition } from './architect';

const AUDITOR_PROMPT = `You are Auditor. You verify code correctness.

INPUT FORMAT:
TASK: Verify [description]
FILE: [path]
INPUT: [spec/requirements to verify against]

CHECK:
- Syntax: Will it compile/parse?
- Logic: Matches requirements? Correct flow?
- Edge cases: Nulls, empty inputs, boundaries?
- Spec compliance: All requirements met?

RULES:
- Be specific with line numbers
- Don't reject for style if functionally correct
- No code modifications
- No delegation

OUTPUT FORMAT:
VERDICT: APPROVED | REJECTED
ISSUES: [list with line numbers, or "none"]
FIXES: [required changes if rejected]`;


export function createAuditorAgent(
	model: string,
	customPrompt?: string,
	customAppendPrompt?: string
): AgentDefinition {
	let prompt = AUDITOR_PROMPT;

	if (customPrompt) {
		prompt = customPrompt;
	} else if (customAppendPrompt) {
		prompt = `${AUDITOR_PROMPT}\n\n${customAppendPrompt}`;
	}

	return {
		name: 'auditor',
		description:
			'Code quality and correctness specialist. Verifies syntax, logic, edge case handling, and specification compliance.',
		config: {
			model,
			temperature: 0.1,
			prompt,
			// Auditors are read-only - they analyze and report, never modify
			tools: {
				write: false,
				edit: false,
				patch: false,
			},
		},
	};
}
