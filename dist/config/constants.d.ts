export declare const SME_AGENT: "sme";
export declare const QA_AGENTS: readonly ["security_reviewer", "auditor"];
export declare const PIPELINE_AGENTS: readonly ["coder", "test_engineer"];
export declare const ORCHESTRATOR_NAME: "architect";
export declare const ALL_SUBAGENT_NAMES: readonly ["sme", "security_reviewer", "auditor", "coder", "test_engineer"];
export declare const ALL_AGENT_NAMES: readonly ["architect", "sme", "security_reviewer", "auditor", "coder", "test_engineer"];
export type QAAgentName = (typeof QA_AGENTS)[number];
export type PipelineAgentName = (typeof PIPELINE_AGENTS)[number];
export type AgentName = (typeof ALL_AGENT_NAMES)[number];
export type SMEAgentName = 'sme';
export declare const CATEGORY_PREFIXES: {
    readonly sme: "_sme";
    readonly qa: "_qa";
};
export declare const DEFAULT_MODELS: Record<string, string>;
export declare const DOMAIN_PATTERNS: Record<string, RegExp[]>;
export declare function domainToAgentName(_domain: string): 'sme';
export declare function isQAAgent(name: string): name is QAAgentName;
export declare function isSubagent(name: string): boolean;
