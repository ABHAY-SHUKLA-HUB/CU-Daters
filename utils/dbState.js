let reconnectInProgress = false;
let lastReconnectAttempt = 0;

export function getDbReconnectState() {
  return {
    reconnectInProgress,
    lastReconnectAttempt
  };
}

export function markDbReconnectStart() {
  reconnectInProgress = true;
  lastReconnectAttempt = Date.now();
}

export function markDbReconnectEnd() {
  reconnectInProgress = false;
}
