export const GDELT_CONNECTOR_KEY = "gdelt";

export function readGdeltStatus(sourceStatuses = {}) {
  return sourceStatuses["gdelt"] || {
    provider: "gdelt",
    state: "unavailable",
    reason: "No data returned by backend",
  };
}
