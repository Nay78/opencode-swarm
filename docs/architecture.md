# OpenCode Swarm Architecture

OpenCode Swarm uses an **architect-centric control model** where a single orchestrating agent owns all decisions while specialized agents provide expertise, implementation, and validation.

## Design Goals

| Goal | How We Achieve It |
|------|-------------------|
| Deterministic execution | Serial agent invocation, no parallel races |
| Explainable reasoning | Clear delegation traces, structured handoffs |
| Minimal hallucination propagation | Explorer validates context before SME consultation |
| Clear ownership | Architect decides, others advise or execute |
| Fail-safe operation | Architect can fall back to direct action |

---

## Control Model

### The Architect

Only the Architect:
- Analyzes user intent and determines task type
- Delegates to Explorer for codebase discovery
- Selects which SMEs to consult based on Explorer findings
- Synthesizes specifications from gathered expertise
- Triages QA feedback (approve/revise/block)
- Delivers final output to the user

The Architect has **full tool access** so it can recover if any delegation fails.

### Subordinate Agents

All other agents operate under delegation with restricted permissions:

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARCHITECT                                │
│                    (full access, owns decisions)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   EXPLORER    │    │     SMEs      │    │      QA       │
│  (read-only)  │    │  (read-only)  │    │  (read-only)  │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
                     ┌───────────────┐    ┌───────────────┐
                     │    CODER      │    │     TEST      │
                     │ (read/write)  │    │ (read/write)  │
                     └───────────────┘    └───────────────┘
```

---

## Agent Categories

### Discovery Layer
| Agent | Access | Purpose |
|-------|--------|---------|
| Explorer | Read | Scan codebase, identify structure, detect domains, flag files |

### Advisory Layer (Read-Only)
| Agent | Access | Purpose |
|-------|--------|---------|
| SME_* (×11) | Read | Provide domain expertise, recommend approaches |
| Security Reviewer | Read | Identify vulnerabilities, assess risk |
| Auditor | Read | Verify correctness, check logic |

### Implementation Layer
| Agent | Access | Purpose |
|-------|--------|---------|
| Coder | Read/Write | Implement specifications |
| Test Engineer | Read/Write | Generate test cases |

---

## Execution Flow

### Phase 1: Discovery
```
User Request → Architect (parse) → Explorer (scan)
```
Explorer returns:
- Project summary (type, languages, frameworks)
- Directory structure
- Key files identified
- Relevant domains for SME consultation
- Files flagged for review

### Phase 2: Consultation
```
Explorer Output → Architect (select SMEs) → SME_* (serial)
```
- Only domains identified by Explorer are consulted
- Typically 1-3 SMEs, never all 11
- Each SME reviews flagged files and provides recommendations

### Phase 3: Synthesis
```
SME Outputs → Architect (collate) → Unified Specification
```
Architect synthesizes:
- For reviews: consolidated findings report
- For implementation: detailed specification for Coder

### Phase 4: Implementation (if applicable)
```
Specification → Coder → Code Output
```

### Phase 5: Validation
```
Code → Security Reviewer → Auditor → Architect (triage)
```
Triage outcomes:
- **APPROVED** → Test Engineer
- **REVISION_NEEDED** → Back to Coder with feedback
- **BLOCKED** → Explain why, end pipeline

### Phase 6: Testing (if approved)
```
Approved Code → Test Engineer → Test Cases
```

---

## Execution Guarantees

| Guarantee | Description |
|-----------|-------------|
| Serial execution | Agents run one at a time, never parallel |
| No SME broadcast | Only relevant domains consulted |
| QA before delivery | Security + Audit review required |
| No unreviewed code | All implementation passes through QA |
| Traceable delegation | Clear logs of which agent did what |

---

## Why Serial Execution?

Parallel agent execution introduces:
- Race conditions in file access
- Conflicting recommendations
- Difficult debugging
- Unpredictable resource usage

Serial execution provides:
- Deterministic behavior
- Clear cause-and-effect
- Easy debugging
- Predictable costs

The tradeoff is speed, but for complex tasks, **correctness beats velocity**.

---

## Failure Handling

If any agent fails or produces poor output:

1. Architect receives the failure/output
2. Architect can retry with different parameters
3. Architect can skip the agent and proceed
4. Architect can handle the task directly (has full access)
5. Architect can ask user for clarification

This ensures the pipeline never completely breaks due to a single agent failure.
