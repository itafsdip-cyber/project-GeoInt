export const X_CONNECTOR_KEY = "x";

export function readXStatus(sourceStatuses = {}) {
  return sourceStatuses["x"] || {
    provider: "x",
    state: "unavailable",
    reason: "No data returned by backend",
  };
}
