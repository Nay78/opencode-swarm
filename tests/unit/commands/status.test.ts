import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AgentDefinition } from '../../../src/agents';
import { handleStatusCommand } from '../../../src/commands/status';

describe('handleStatusCommand', () => {
    const mockAgents: Record<string, AgentDefinition> = {
        architect: { name: 'architect', description: 'Architect', config: { model: 'gpt-4', temperature: 0.1 } },
        coder: { name: 'coder', description: 'Coder', config: { model: 'claude-3', temperature: 0.2 } },
    };

    let tempDir: string;

    beforeEach(async () => {
        // Create a temporary directory for each test
        tempDir = await mkdtemp(join(tmpdir(), 'swarm-test-'));
    });

    afterEach(async () => {
        // Clean up the temporary directory after each test
        await rm(tempDir, { recursive: true, force: true });
    });

    async function writePlan(dir: string, content: string) {
        // Create .swarm directory and write plan.md
        const swarmDir = join(dir, '.swarm');
        await mkdir(swarmDir, { recursive: true });
        await writeFile(join(swarmDir, 'plan.md'), content);
    }

    test('returns "No active swarm plan found." when plan.md is missing', async () => {
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toBe('No active swarm plan found.');
    });

    test('shows correct phase when plan has IN PROGRESS phase', async () => {
        await writePlan(tempDir, '## Phase 2: Context Pruning [IN PROGRESS]\n- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3');
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toContain('Phase 2');
        expect(result).toContain('1/3 complete');
        expect(result).toContain('2 registered');
    });

    test('shows "Unknown" phase when no phase markers found', async () => {
        await writePlan(tempDir, 'Just some text\n- [x] Done\n- [ ] Todo');
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toContain('**Current Phase**: Unknown');
        expect(result).toContain('1/2 complete');
    });

    test('counts completed and incomplete tasks correctly', async () => {
        await writePlan(tempDir, '## Phase 1 [COMPLETE]\n- [x] A\n- [x] B\n- [x] C\n---\n## Phase 2 [IN PROGRESS]\n- [ ] D\n- [ ] E');
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toContain('3/5 complete');
    });

    test('shows correct agent count', async () => {
        const singleAgent: Record<string, AgentDefinition> = {
            architect: { name: 'architect', config: { model: 'gpt-4' } },
        };
        await writePlan(tempDir, '## Phase 1 [IN PROGRESS]\n- [ ] Task');
        const result = await handleStatusCommand(tempDir, singleAgent);
        expect(result).toContain('1 registered');
    });

    test('returns proper markdown format', async () => {
        await writePlan(tempDir, '## Phase 1 [IN PROGRESS]\n- [x] A\n- [ ] B');
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toStartWith('## Swarm Status');
        expect(result).toContain('**Current Phase**');
        expect(result).toContain('**Tasks**');
        expect(result).toContain('**Agents**');
    });

    test('handles empty plan.md file', async () => {
        await writePlan(tempDir, '');
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toBe('No active swarm plan found.');
    });

    test('shows all tasks complete when only - [x] markers exist', async () => {
        await writePlan(tempDir, '## Phase 1 [COMPLETE]\n- [x] Task 1\n- [x] Task 2\n- [x] Task 3');
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toContain('3/3 complete');
    });

    test('shows 0/0 complete for plan without task markers', async () => {
        await writePlan(tempDir, '## Phase 1: Planning\nJust some planning text without task markers');
        const result = await handleStatusCommand(tempDir, mockAgents);
        expect(result).toContain('0/0 complete');
    });

    test('shows 0 registered for empty agents record', async () => {
        await writePlan(tempDir, '## Phase 1 [IN PROGRESS]\n- [ ] Task');
        const emptyAgents: Record<string, AgentDefinition> = {};
        const result = await handleStatusCommand(tempDir, emptyAgents);
        expect(result).toContain('0 registered');
    });
});