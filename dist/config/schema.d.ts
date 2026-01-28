import { z } from 'zod';
export declare const AgentOverrideConfigSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodNumber>;
    disabled: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>;
export declare const PluginConfigSchema: z.ZodObject<{
    agents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        temperature: z.ZodOptional<z.ZodNumber>;
        disabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
    max_iterations: z.ZodDefault<z.ZodNumber>;
    multi_domain_sme: z.ZodDefault<z.ZodBoolean>;
    auto_detect_domains: z.ZodDefault<z.ZodBoolean>;
    inject_phase_reminders: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
export type { AgentName, SMEAgentName, QAAgentName, PipelineAgentName, } from './constants';
