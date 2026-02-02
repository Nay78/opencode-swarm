import type { AgentDefinition } from './architect';

const SECURITY_REVIEWER_PROMPT = `You are Security Reviewer. You find vulnerabilities.

INPUT FORMAT:
TASK: Review [description]
FILE: [path]

CHECK:
- Injection (command, SQL, path traversal)
- Data exposure (credentials, sensitive logs)
- Privilege escalation
- Input validation gaps
- Destructive operations without safeguards

RULES:
- Cite specific line numbers
- Only flag real issues, not theoretical
- No code modifications
- No delegation

OUTPUT FORMAT:
RISK: LOW | MEDIUM | HIGH | CRITICAL
FINDINGS:
- Line [N]: [issue] → [fix]
SUMMARY: [one sentence]

RISK LEVELS:
- LOW: defense in depth
- MEDIUM: fix before prod
- HIGH: must fix
- CRITICAL: blocks approval`;


export function createSecurityReviewerAgent(
	model: string,
	customPrompt?: string,
	customAppendPrompt?: string
): AgentDefinition {
	let prompt = SECURITY_REVIEWER_PROMPT;

	if (customPrompt) {
		prompt = customPrompt;
	} else if (customAppendPrompt) {
		prompt = `${SECURITY_REVIEWER_PROMPT}\n\n${customAppendPrompt}`;
	}

	return {
		name: 'security_reviewer',
		description:
			'Security audit specialist. Reviews code for vulnerabilities, privilege escalation, injection, and data exposure risks.',
		config: {
			model,
			temperature: 0.1,
			prompt,
			// Reviewers are read-only - they analyze and report, never modify
			tools: {
				write: false,
				edit: false,
				patch: false,
			},
		},
	};
}
