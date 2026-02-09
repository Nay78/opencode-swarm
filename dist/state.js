// src/state.ts
var swarmState = {
  activeToolCalls: new Map,
  toolAggregates: new Map,
  activeAgent: new Map,
  delegationChains: new Map,
  pendingEvents: 0,
  agentSessions: new Map
};
function resetSwarmState() {
  swarmState.activeToolCalls.clear();
  swarmState.toolAggregates.clear();
  swarmState.activeAgent.clear();
  swarmState.delegationChains.clear();
  swarmState.pendingEvents = 0;
  swarmState.agentSessions.clear();
}
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
function endAgentSession(sessionId) {
  swarmState.agentSessions.delete(sessionId);
}
function getAgentSession(sessionId) {
  return swarmState.agentSessions.get(sessionId);
}
export {
  swarmState,
  startAgentSession,
  resetSwarmState,
  getAgentSession,
  endAgentSession
};
