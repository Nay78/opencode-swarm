# Design Rationale: Heterogeneous Models & Structured Orchestration

## The Problem with Homogeneous Agent Systems

Most multi-agent frameworks use the same model for all roles:

```
Planner    → GPT-4
Researcher → GPT-4
Coder      → GPT-4
Reviewer   → GPT-4
```

This creates **correlated failure modes**:
- If GPT-4 hallucinates an API, it hallucinates it everywhere
- If GPT-4 has a blind spot, no agent catches it
- Errors compound rather than get caught

---

## OpenCode Swarm Approach

### Heterogeneous Model Assignment

Each role uses the model best suited to its cognitive function:

| Role | Cognitive Need | Model Choice |
|------|---------------|--------------|
| Architect | Deep reasoning, synthesis | Large reasoning model |
| Explorer | Fast scanning, pattern recognition | Fast/cheap model |
| SMEs | Domain recall, quick advice | Fast/cheap model |
| Coder | Implementation accuracy | Strong coding model |
| QA | Adversarial analysis | Different model family |
| Test | Coverage generation | Fast/cheap model |

### Example Configuration

```json
{
  "agents": {
    "architect": { "model": "anthropic/claude-sonnet-4-5" },
    "explorer": { "model": "google/gemini-2.0-flash" },
    "_sme": { "model": "google/gemini-2.0-flash" },
    "coder": { "model": "anthropic/claude-sonnet-4-5" },
    "_qa": { "model": "openai/gpt-4o" },
    "test_engineer": { "model": "google/gemini-2.0-flash" }
  }
}
```

---

## Benefits

### 1. Independent Perspectives

Different model families have different:
- Training data distributions
- Reasoning patterns
- Blind spots and biases

When Claude writes code and GPT-4o reviews it, genuine issues get caught.

### 2. Early Disagreement Detection

If the Architect (Claude) and Security Reviewer (GPT) disagree, that's a signal to investigate—not a bug.

### 3. Reduced Hallucination Reinforcement

Homogeneous systems:
```
Model A hallucinates → Model A doesn't catch it → Error propagates
```

Heterogeneous systems:
```
Model A hallucinates → Model B catches it → Error stopped
```

### 4. Cost Optimization

Not every task needs the most expensive model:

| Task | Complexity | Model Choice |
|------|------------|--------------|
| Scan directory | Low | Gemini Flash (cheap) |
| Provide domain advice | Medium | Gemini Flash |
| Architect decisions | High | Claude Sonnet (expensive) |
| Write production code | High | Claude Sonnet |
| Generate tests | Medium | Gemini Flash |

### 5. Latency Optimization

Fast models for discovery and consultation, slow/thorough models for critical decisions:

```
Explorer (fast) → SMEs (fast) → Architect (thorough) → Coder (thorough) → QA (thorough)
```

---

## Real-World Engineering Analogy

This mirrors how real engineering teams work:

| Role | Human Equivalent |
|------|------------------|
| Architect | Tech Lead / Principal Engineer |
| Explorer | Junior dev doing initial research |
| SMEs | Domain specialists consulted as needed |
| Coder | Senior developer implementing |
| Security Reviewer | Security team audit |
| Auditor | Code review from peer |
| Test Engineer | QA engineer |

You wouldn't have the same person do all these roles—diversity of perspective improves outcomes.

---

## Why Not Parallel Execution?

Some frameworks parallelize everything for speed. We chose serial execution because:

### Parallel Problems
- **Context races**: Multiple agents read same files, get different snapshots
- **Conflicting advice**: SMEs disagree, no clear resolution
- **Debugging nightmare**: "Which agent caused this?"
- **Resource spikes**: All agents hitting APIs simultaneously

### Serial Benefits
- **Deterministic**: Same input → same execution path
- **Traceable**: Clear chain of custody for decisions
- **Debuggable**: Step through agent-by-agent
- **Cost-predictable**: Know exactly what you're paying for

The speed tradeoff is worth it for complex tasks where correctness matters.

---

## Tool Permission Rationale

### Why Explorer is Read-Only

Explorer's job is discovery, not action:
- Scans directory structure
- Reads key files
- Identifies patterns
- **Never modifies anything**

If Explorer could write, it might "helpfully" fix things it finds—corrupting the analysis.

### Why SMEs are Read-Only

SMEs provide expertise, not implementation:
- Analyze code for domain-specific issues
- Recommend approaches
- Flag concerns
- **Never implement their own recommendations**

Keeping SMEs read-only ensures clear separation between advice and action.

### Why Architect Has Full Access

The Architect needs fallback capability:
- If Explorer fails, Architect can scan directly
- If Coder produces bad output, Architect can fix it
- If the pipeline breaks, Architect can recover

This ensures the system degrades gracefully rather than failing completely.

---

## Summary

OpenCode Swarm's design prioritizes:

1. **Correctness over speed** - Serial execution, mandatory QA
2. **Diversity over uniformity** - Heterogeneous models catch more errors
3. **Clarity over cleverness** - Single point of control, clear permissions
4. **Resilience over rigidity** - Architect fallback ensures graceful degradation

This design is optimized for **complex, high-stakes tasks** where getting it right matters more than getting it fast.
