export const RSS_CONNECTOR_KEY = "rss";

export function readRssStatus(sourceStatuses = {}) {
  return sourceStatuses["rss"] || {
    provider: "rss",
    state: "unavailable",
    reason: "No data returned by backend",
  };
}
