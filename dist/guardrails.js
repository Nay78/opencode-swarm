// src/state.ts
var swarmState = {
  activeToolCalls: new Map,
  toolAggregates: new Map,
  activeAgent: new Map,
  delegationChains: new Map,
  pendingEvents: 0,
  agentSessions: new Map
};
function startAgentSession(sessionId, agentName, staleDurationMs = 3600000) {
  const now = Date.now();
  for (const [id, session] of swarmState.agentSessions) {
    if (now - session.startTime > staleDurationMs) {
      swarmState.agentSessions.delete(id);
    }
  }
  const sessionState = {
    agentName,
    startTime: now,
    toolCallCount: 0,
    consecutiveErrors: 0,
    recentToolCalls: [],
    warningIssued: false,
    hardLimitHit: false
  };
  swarmState.agentSessions.set(sessionId, sessionState);
}
function getAgentSession(sessionId) {
  return swarmState.agentSessions.get(sessionId);
}
// src/utils/logger.ts
var DEBUG = process.env.OPENCODE_SWARM_DEBUG === "1";
function warn(message, data) {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.warn(`[opencode-swarm ${timestamp}] WARN: ${message}`, data);
  } else {
    console.warn(`[opencode-swarm ${timestamp}] WARN: ${message}`);
  }
}
// src/hooks/guardrails.ts
function createGuardrailsHooks(config) {
  if (config.enabled === false) {
    return {
      toolBefore: async () => {},
      toolAfter: async () => {},
      messagesTransform: async () => {}
    };
  }
  return {
    toolBefore: async (input, output) => {
      let session = getAgentSession(input.sessionID);
      if (!session) {
        startAgentSession(input.sessionID, "unknown");
        session = getAgentSession(input.sessionID);
        if (!session) {
          warn(`Failed to create session for ${input.sessionID}`);
          return;
        }
      }
      if (session.hardLimitHit) {
        throw new Error("\uD83D\uDED1 CIRCUIT BREAKER: Agent blocked. Hard limit was previously triggered. Stop making tool calls and return your progress summary.");
      }
      session.toolCallCount++;
      const hash = hashArgs(output.args);
      session.recentToolCalls.push({
        tool: input.tool,
        argsHash: hash,
        timestamp: Date.now()
      });
      if (session.recentToolCalls.length > 20) {
        session.recentToolCalls.shift();
      }
      let repetitionCount = 0;
      if (session.recentToolCalls.length > 0) {
        const lastEntry = session.recentToolCalls[session.recentToolCalls.length - 1];
        for (let i = session.recentToolCalls.length - 1;i >= 0; i--) {
          const entry = session.recentToolCalls[i];
          if (entry.tool === lastEntry.tool && entry.argsHash === lastEntry.argsHash) {
            repetitionCount++;
          } else {
            break;
          }
        }
      }
      const elapsedMinutes = (Date.now() - session.startTime) / 60000;
      if (session.toolCallCount >= config.max_tool_calls) {
        session.hardLimitHit = true;
        throw new Error(`\uD83D\uDED1 CIRCUIT BREAKER: Tool call limit reached (${session.toolCallCount}/${config.max_tool_calls}). Stop making tool calls and return your progress summary.`);
      }
      if (elapsedMinutes >= config.max_duration_minutes) {
        session.hardLimitHit = true;
        throw new Error(`\uD83D\uDED1 CIRCUIT BREAKER: Duration limit reached (${Math.floor(elapsedMinutes)} min). Stop making tool calls and return your progress summary.`);
      }
      if (repetitionCount >= config.max_repetitions) {
        session.hardLimitHit = true;
        throw new Error(`\uD83D\uDED1 CIRCUIT BREAKER: Repetition detected (same call ${repetitionCount} times). Stop making tool calls and return your progress summary.`);
      }
      if (session.consecutiveErrors >= config.max_consecutive_errors) {
        session.hardLimitHit = true;
        throw new Error(`\uD83D\uDED1 CIRCUIT BREAKER: Too many consecutive errors (${session.consecutiveErrors}). Stop making tool calls and return your progress summary.`);
      }
      if (!session.warningIssued) {
        const toolWarning = session.toolCallCount >= config.max_tool_calls * config.warning_threshold;
        const durationWarning = elapsedMinutes >= config.max_duration_minutes * config.warning_threshold;
        const repetitionWarning = repetitionCount >= config.max_repetitions * config.warning_threshold;
        const errorWarning = session.consecutiveErrors >= config.max_consecutive_errors * config.warning_threshold;
        if (toolWarning || durationWarning || repetitionWarning || errorWarning) {
          session.warningIssued = true;
        }
      }
    },
    toolAfter: async (input, output) => {
      const session = getAgentSession(input.sessionID);
      if (!session) {
        return;
      }
      const outputStr = String(output.output ?? "");
      const hasError = output.output === null || output.output === undefined || outputStr === "" || outputStr.toLowerCase().includes("error");
      if (hasError) {
        session.consecutiveErrors++;
      } else {
        session.consecutiveErrors = 0;
      }
    },
    messagesTransform: async (input, output) => {
      const messages = output.messages;
      if (!messages || messages.length === 0) {
        return;
      }
      const lastMessage = messages[messages.length - 1];
      let sessionId = lastMessage.info?.sessionID;
      if (!sessionId) {
        for (const [id, session2] of swarmState.agentSessions) {
          if (session2.warningIssued || session2.hardLimitHit) {
            sessionId = id;
            break;
          }
        }
      }
      if (!sessionId) {
        return;
      }
      const session = getAgentSession(sessionId);
      if (!session || !session.warningIssued && !session.hardLimitHit) {
        return;
      }
      const textPart = lastMessage.parts.find((part) => part.type === "text" && typeof part.text === "string");
      if (!textPart) {
        return;
      }
      if (session.hardLimitHit) {
        textPart.text = `[\uD83D\uDED1 CIRCUIT BREAKER ACTIVE: You have exceeded your resource limits. Do NOT make any more tool calls. Immediately return a summary of your progress so far. Any further tool calls will be blocked.]

` + textPart.text;
      } else if (session.warningIssued) {
        textPart.text = `[⚠️ GUARDRAIL WARNING: You are approaching resource limits. Please wrap up your current task efficiently. Avoid unnecessary tool calls and prepare to return your results soon.]

` + textPart.text;
      }
    }
  };
}
function hashArgs(args) {
  try {
    if (typeof args !== "object" || args === null) {
      return 0;
    }
    const sortedKeys = Object.keys(args).sort();
    return Number(Bun.hash(JSON.stringify(args, sortedKeys)));
  } catch {
    return 0;
  }
}
export {
  hashArgs,
  createGuardrailsHooks
};
