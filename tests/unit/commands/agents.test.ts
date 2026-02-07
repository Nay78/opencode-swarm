import { describe, test, expect } from 'bun:test';
import { handleAgentsCommand } from '../../../src/commands/agents';
import type { AgentDefinition } from '../../../src/agents';

describe('handleAgentsCommand', () => {
    test('Returns "No agents registered." for empty agents', () => {
        const emptyAgents: Record<string, AgentDefinition> = {};
        
        const result = handleAgentsCommand(emptyAgents);
        
        expect(result).toBe('No agents registered.');
    });

    test('Lists agents with model and temperature', () => {
        const agentsWithModelAndTemp: Record<string, AgentDefinition> = {
            architect: {
                name: 'architect',
                description: 'The swarm architect',
                config: {
                    model: 'gpt-4',
                    temperature: 0.1
                }
            },
            coder: {
                name: 'coder',
                description: 'The coder agent',
                config: {
                    model: 'claude-3',
                    temperature: 0.2,
                    tools: {
                        write: true,
                        edit: true
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(agentsWithModelAndTemp);
        
        expect(result).toBe(`## Registered Agents

- **architect** | model: \`gpt-4\` | temp: 0.1 | ✏️ read-write
  The swarm architect
- **coder** | model: \`claude-3\` | temp: 0.2 | ✏️ read-write
  The coder agent`);
    });

    test('Shows read-only for agents with tools.write === false', () => {
        const readWriteAgent: Record<string, AgentDefinition> = {
            tester: {
                name: 'tester',
                description: 'The test agent',
                config: {
                    model: 'gpt-4',
                    temperature: 0.1,
                    tools: {
                        write: false,
                        edit: true
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(readWriteAgent);
        
        expect(result).toBe(`## Registered Agents

- **tester** | model: \`gpt-4\` | temp: 0.1 | 🔒 read-only
  The test agent`);
    });

    test('Shows read-only for agents with tools.edit === false', () => {
        const readWriteAgent: Record<string, AgentDefinition> = {
            reviewer: {
                name: 'reviewer',
                description: 'The review agent',
                config: {
                    model: 'gpt-4',
                    temperature: 0.1,
                    tools: {
                        write: true,
                        edit: false
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(readWriteAgent);
        
        expect(result).toBe(`## Registered Agents

- **reviewer** | model: \`gpt-4\` | temp: 0.1 | 🔒 read-only
  The review agent`);
    });

    test('Shows read-write for agents without tool restrictions', () => {
        const readWriteAgent: Record<string, AgentDefinition> = {
            developer: {
                name: 'developer',
                description: 'The developer agent',
                config: {
                    model: 'gpt-4',
                    temperature: 0.2,
                    tools: {
                        write: true,
                        edit: true
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(readWriteAgent);
        
        expect(result).toBe(`## Registered Agents

- **developer** | model: \`gpt-4\` | temp: 0.2 | ✏️ read-write
  The developer agent`);
    });

    test('Shows read-write for agents with tools undefined', () => {
        const noToolsAgent: Record<string, AgentDefinition> = {
            designer: {
                name: 'designer',
                description: 'The designer agent',
                config: {
                    model: 'gpt-4',
                    temperature: 0.15
                }
            }
        };
        
        const result = handleAgentsCommand(noToolsAgent);
        
        expect(result).toBe(`## Registered Agents

- **designer** | model: \`gpt-4\` | temp: 0.15 | ✏️ read-write
  The designer agent`);
    });

    test('Shows default for missing model', () => {
        const noModelAgent: Record<string, AgentDefinition> = {
            helper: {
                name: 'helper',
                description: 'The helper agent',
                config: {
                    temperature: 0.3,
                    tools: {
                        write: true,
                        edit: true
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(noModelAgent);
        
        expect(result).toBe(`## Registered Agents

- **helper** | model: \`default\` | temp: 0.3 | ✏️ read-write
  The helper agent`);
    });

    test('Shows default for missing temperature', () => {
        const noTempAgent: Record<string, AgentDefinition> = {
            analyst: {
                name: 'analyst',
                description: 'The analyst agent',
                config: {
                    model: 'claude-3',
                    tools: {
                        write: false,
                        edit: false
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(noTempAgent);
        
        expect(result).toBe(`## Registered Agents

- **analyst** | model: \`claude-3\` | temp: default | 🔒 read-only
  The analyst agent`);
    });

    test('Shows default for missing temperature even when tools are read-write', () => {
        const noTempReadWriteAgent: Record<string, AgentDefinition> = {
            executor: {
                name: 'executor',
                description: 'The executor agent',
                config: {
                    model: 'gpt-3.5',
                    tools: {
                        write: true,
                        edit: true
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(noTempReadWriteAgent);
        
        expect(result).toBe(`## Registered Agents

- **executor** | model: \`gpt-3.5\` | temp: default | ✏️ read-write
  The executor agent`);
    });

    test('Includes description when available', () => {
        const agentsWithDesc: Record<string, AgentDefinition> = {
            architect: {
                name: 'architect',
                description: 'Responsible for project planning and architecture decisions',
                config: {
                    model: 'gpt-4',
                    temperature: 0.1,
                    tools: {
                        write: false,
                        edit: false
                    }
                }
            },
            coder: {
                name: 'coder',
                config: {
                    model: 'claude-3',
                    temperature: 0.2,
                    tools: {
                        write: true,
                        edit: true
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(agentsWithDesc);
        
        expect(result).toBe(`## Registered Agents

- **architect** | model: \`gpt-4\` | temp: 0.1 | 🔒 read-only
  Responsible for project planning and architecture decisions
- **coder** | model: \`claude-3\` | temp: 0.2 | ✏️ read-write`);
    });

    test('Handles multiple agents with mixed configurations', () => {
        const mixedAgents: Record<string, AgentDefinition> = {
            arch: {
                name: 'arch',
                description: 'The architect agent',
                config: {
                    model: 'gpt-4',
                    temperature: 0.1,
                    tools: {
                        write: false,
                        edit: false
                    }
                }
            },
            dev: {
                name: 'dev',
                description: 'The developer agent',
                config: {
                    model: 'gpt-3.5',
                    temperature: 0.3,
                    tools: {
                        write: true,
                        edit: true
                    }
                }
            },
            tester: {
                name: 'tester',
                config: {
                    model: 'claude-2',
                    temperature: 0.2,
                    tools: {
                        write: false,
                        edit: true
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(mixedAgents);
        
        expect(result).toBe(`## Registered Agents

- **arch** | model: \`gpt-4\` | temp: 0.1 | 🔒 read-only
  The architect agent
- **dev** | model: \`gpt-3.5\` | temp: 0.3 | ✏️ read-write
  The developer agent
- **tester** | model: \`claude-2\` | temp: 0.2 | 🔒 read-only`);
    });

    test('Handles agent with description in config rather than agent level', () => {
        const agentWithConfigDesc: Record<string, AgentDefinition> = {
            reviewer: {
                name: 'reviewer',
                config: {
                    model: 'gpt-4',
                    temperature: 0.1,
                    description: 'Reviews code and provides feedback',
                    tools: {
                        write: false,
                        edit: false
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(agentWithConfigDesc);
        
        expect(result).toBe(`## Registered Agents

- **reviewer** | model: \`gpt-4\` | temp: 0.1 | 🔒 read-only
  Reviews code and provides feedback`);
    });

    test('Prioritizes agent-level description over config description', () => {
        const agentWithBothDesc: Record<string, AgentDefinition> = {
            reviewer: {
                name: 'reviewer',
                description: 'Agent-level description',
                config: {
                    model: 'gpt-4',
                    temperature: 0.1,
                    description: 'Config-level description',
                    tools: {
                        write: false,
                        edit: false
                    }
                }
            }
        };
        
        const result = handleAgentsCommand(agentWithBothDesc);
        
        expect(result).toBe(`## Registered Agents

- **reviewer** | model: \`gpt-4\` | temp: 0.1 | 🔒 read-only
  Agent-level description`);
    });
});