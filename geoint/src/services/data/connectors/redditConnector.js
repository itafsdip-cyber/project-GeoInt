export const REDDIT_CONNECTOR_KEY = "reddit";

export function readRedditStatus(sourceStatuses = {}) {
  return sourceStatuses["reddit"] || {
    provider: "reddit",
    state: "unavailable",
    reason: "No data returned by backend",
  };
}
