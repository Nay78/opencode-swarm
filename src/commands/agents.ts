import type { AgentDefinition } from '../agents';

export function handleAgentsCommand(
    agents: Record<string, AgentDefinition>,
): string {
    const entries = Object.entries(agents);
    
    if (entries.length === 0) {
        return 'No agents registered.';
    }
    
    const lines = ['## Registered Agents', ''];
    
    for (const [key, agent] of entries) {
        const model = agent.config.model || 'default';
        const temp = agent.config.temperature !== undefined
            ? agent.config.temperature.toString()
            : 'default';
        
        // Detect read-only: if tools has write/edit/patch set to false
        const tools = agent.config.tools || {};
        const isReadOnly = tools.write === false || tools.edit === false;
        const access = isReadOnly ? '🔒 read-only' : '✏️ read-write';
        
        const desc = agent.description || agent.config.description || '';
        
        lines.push(`- **${key}** | model: \`${model}\` | temp: ${temp} | ${access}`);
        if (desc) {
            lines.push(`  ${desc}`);
        }
    }
    
    return lines.join('\n');
}
