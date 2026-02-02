import type { AgentDefinition } from '../architect';

/**
 * SME domain configuration
 */
export interface SMEDomainConfig {
	domain: string;
	description: string;
	guidance: string;
}

/**
 * Base template for all SME agents.
 * SMEs provide domain-specific technical context to enrich the Architect's specification.
 */
function createSMEPrompt(config: SMEDomainConfig): string {
	const { domain, description, guidance } = config;

	return `You are SME for ${description}.

EXPERTISE:
${guidance}

INPUT FORMAT:
TASK: [what to advise on]
INPUT: [files/context to review]

RULES:
- Be specific: exact names, paths, parameters
- Be concise: under 1500 chars
- Be actionable: information Coder can use directly
- No code writing
- No delegation

OUTPUT FORMAT:
CRITICAL: [must-know for implementation]
APPROACH: [recommended pattern]
API: [exact names, signatures]
GOTCHAS: [mistakes to avoid]
DEPS: [required modules/permissions]`;
}

/**
 * Create an SME agent definition
 */
export function createSMEAgent(
	agentName: string,
	domainConfig: SMEDomainConfig,
	model: string,
	customPrompt?: string,
	customAppendPrompt?: string
): AgentDefinition {
	let prompt = createSMEPrompt(domainConfig);

	if (customPrompt) {
		prompt = customPrompt;
	} else if (customAppendPrompt) {
		prompt = `${prompt}\n\n${customAppendPrompt}`;
	}

	return {
		name: agentName,
		description: `SME for ${domainConfig.description}`,
		config: {
			model,
			temperature: 0.2,
			prompt,
			// SMEs are advisory only - can read to analyze, but never write
			tools: {
				write: false,
				edit: false,
				patch: false,
			},
		},
	};
}
