const withTimeout = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const buildPrompt = (incident) => JSON.stringify({
  task: "Generate concise incident summary JSON only.",
  required_keys: ["shortSummary", "keyActors", "likelyCategories", "crossSourceSignal", "caveat"],
  constraints: [
    "Do not claim verification.",
    "Keep each field under 220 chars.",
    "Mention corroboration strength.",
  ],
  incident,
});

const normalizeBaseUrl = (baseUrl) => String(baseUrl || "").trim().replace(/\/$/, "");

const extractText = (payload = {}) => {
  if (typeof payload?.response === "string") return payload.response;
  if (typeof payload?.output === "string") return payload.output;
  if (Array.isArray(payload?.choices) && payload.choices[0]?.message?.content) return payload.choices[0].message.content;
  if (Array.isArray(payload?.content)) return payload.content.map((entry) => entry.text || "").join(" ");
  return "";
};

const parseSummaryJson = (rawText) => {
  const cleaned = String(rawText || "").replace(/```json|```/g, "").trim();
  const parsed = cleaned ? JSON.parse(cleaned) : null;
  if (!parsed?.shortSummary) throw new Error("Invalid response structure");
  return parsed;
};

export const testLocalLlmConnection = async (config = {}) => {
  const provider = config.provider || "ollama";
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const model = String(config.model || "").trim();

  if (!baseUrl || !model) return { status: "Misconfigured", detail: "Base URL and model are required." };

  try {
    if (provider === "ollama") {
      const response = await withTimeout(`${baseUrl}/api/tags`, { method: "GET" }, config.timeoutMs || 5000);
      if (!response.ok) return { status: "Unreachable", detail: `HTTP ${response.status}` };
      const data = await response.json();
      const models = (data.models || []).map((item) => item.name);
      if (!models.some((item) => item.startsWith(model))) {
        return { status: "Invalid response", detail: `Model not found in Ollama list (${model}).` };
      }
      return { status: "Connected", detail: `Model available: ${model}` };
    }

    const response = await withTimeout(`${baseUrl}/v1/models`, { method: "GET" }, config.timeoutMs || 5000);
    if (!response.ok) return { status: "Unreachable", detail: `HTTP ${response.status}` };
    const data = await response.json();
    const ids = (data.data || []).map((item) => item.id);
    if (ids.length === 0) return { status: "Invalid response", detail: "No models returned." };
    if (!ids.includes(model)) return { status: "Invalid response", detail: `Model ${model} not listed by endpoint.` };
    return { status: "Connected", detail: `Model available: ${model}` };
  } catch (error) {
    if (error?.name === "AbortError") return { status: "Unreachable", detail: "Connection timed out." };
    return { status: "Unreachable", detail: "Connection refused or endpoint unavailable." };
  }
};

export const generateLocalIncidentSummary = async (incident, config = {}) => {
  const provider = config.provider || "ollama";
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const model = String(config.model || "").trim();
  const timeoutMs = Number(config.timeoutMs || 10000);
  const temperature = Number.isFinite(Number(config.temperature)) ? Number(config.temperature) : 0.2;

  if (!baseUrl || !model) throw new Error("Local LLM is misconfigured");

  const prompt = buildPrompt(incident);

  if (provider === "ollama") {
    const response = await withTimeout(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature } }),
    }, timeoutMs);
    if (!response.ok) throw new Error(`Local LLM unreachable (${response.status})`);
    const payload = await response.json();
    return parseSummaryJson(extractText(payload));
  }

  const response = await withTimeout(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: "Return STRICT JSON only: shortSummary,keyActors,likelyCategories,crossSourceSignal,caveat. Keep caveat explicit that info is unverified." },
        { role: "user", content: prompt },
      ],
    }),
  }, timeoutMs);
  if (!response.ok) throw new Error(`Local LLM unreachable (${response.status})`);
  const payload = await response.json();
  return parseSummaryJson(extractText(payload));
};
