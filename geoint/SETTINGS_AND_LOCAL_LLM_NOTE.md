# Settings + Local LLM Technical Note

## Implemented now
- Added a top-right **Settings** control (gear icon) that opens a compact settings panel.
- Moved timezone selection from header controls into Settings.
- Added theme selection:
  - AMOLED Dark
  - Tactical Dark
  - Dim Blue
  - High Contrast
- Added UI preferences:
  - density (compact/comfortable)
  - show/hide uncertainty rings
  - show/hide clustering
  - refresh interval
  - reset to defaults
- Added local history controls inside Settings:
  - history counts and approximate size
  - clear local history
- Added JSON session import/export actions.

## Local LLM support
- Added local LLM provider configuration in Settings.
- Supported local provider modes:
  - Ollama
  - OpenAI-compatible endpoint
  - generic custom endpoint (OpenAI-compatible path conventions)
- Configurable fields:
  - provider
  - base URL
  - model
  - timeout (ms)
  - temperature
- Added **Test Connection** with status outputs:
  - Connected
  - Unreachable
  - Invalid response
  - Misconfigured

## Summary provider selection
- Incident summary mode is selectable:
  - Remote proxy AI
  - Local LLM
  - Heuristic fallback
- Local failures degrade honestly to heuristic summary with explicit caveat.

## Help/manual near Local LLM settings
- Included concise in-panel guidance covering:
  - what local mode does
  - Ollama quick-start commands
  - example model names (`qwen2.5`, `llama3`, `mistral`)
  - base URL/model mapping
  - troubleshooting for connection refused/model missing/timeout

## Local-only scope and limitations
- Settings and local LLM config are persisted to browser local storage only.
- No secret manager is used; avoid entering sensitive API keys in this panel.
- Connection checks are heuristic endpoint probes and do not guarantee generation quality.
- Local custom endpoints are treated as OpenAI-compatible for request/response shape.

## Future backend improvements
- Encrypted settings profile sync per analyst account.
- Secure secret storage + token redaction.
- Multi-provider credential vault and policy controls.
- Better provider-specific adapters (LM Studio, vLLM, text-generation-inference).
