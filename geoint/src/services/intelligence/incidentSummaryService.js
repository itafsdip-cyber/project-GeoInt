import { generateLocalIncidentSummary } from "./localLlmService";

const shortList = (items = [], fallback = "Unknown") => {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items.slice(0, 3).join(", ");
};

const heuristicSummary = (incident, reason = "Fallback") => ({
  mode: "HEURISTIC SUMMARY",
  title: `GENERATED WITH AVAILABLE DATA (${reason})`,
  shortSummary: `${incident.title} in ${incident.region} with ${incident.eventCount} linked events and ${incident.sourceCount} contributing sources.`,
  keyActors: shortList(incident.involvedActors, "Actors not clearly resolved"),
  likelyCategories: shortList(incident.categories, "Unclear category"),
  crossSourceSignal: incident.sourceCount > 1
    ? `Cross-source corroboration present (${incident.sourceCount} sources); signal still requires analyst verification.`
    : "Single-source dominant signal; treat as low corroboration until independently confirmed.",
  caveat: "AI/heuristic output is advisory and not confirmed intelligence. Validate against primary-source reporting.",
});

const generateRemoteSummary = async (incident) => {
  const response = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 420,
      system: "You are an intelligence analyst assistant. Return STRICT JSON only with keys: shortSummary,keyActors,likelyCategories,crossSourceSignal,caveat. Keep caveat explicit that info is unverified.",
      messages: [{
        role: "user",
        content: JSON.stringify({
          task: "Generate concise incident summary.",
          incident,
          constraints: [
            "Do not claim verification.",
            "Keep each field under 220 chars.",
            "Mention corroboration strength.",
          ],
        }),
      }],
    }),
  });

  if (!response.ok) throw new Error("AI backend unavailable");
  const data = await response.json();
  const raw = data.content?.map((entry) => entry.text || "").join("").replace(/```json|```/g, "").trim();
  const parsed = raw ? JSON.parse(raw) : null;
  if (!parsed?.shortSummary) throw new Error("Invalid AI response");
  return parsed;
};

export const generateIncidentSummary = async (incident, aiConfig = {}) => {
  const summaryMode = aiConfig.summaryMode || "remote";

  try {
    if (summaryMode === "heuristic") {
      return heuristicSummary(incident, "Heuristic-only mode");
    }

    if (summaryMode === "local") {
      const parsed = await generateLocalIncidentSummary(incident, aiConfig.localLlm || {});
      return {
        mode: "LOCAL LLM SUMMARY",
        title: "GENERATED WITH AVAILABLE DATA",
        ...parsed,
      };
    }

    const parsed = await generateRemoteSummary(incident);
    return {
      mode: "REMOTE AI SUMMARY",
      title: "GENERATED WITH AVAILABLE DATA",
      ...parsed,
    };
  } catch {
    return heuristicSummary(incident, summaryMode === "local" ? "Local model unavailable" : "Remote model unavailable");
  }
};
