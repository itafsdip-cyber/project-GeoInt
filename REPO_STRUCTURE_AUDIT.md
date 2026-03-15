# Repository Structure Audit (project-GeoInt)

## 1) Main app entry points

There are two runnable Vite React apps with their own entry points:

- Root app entry: `src/main.tsx`
- Nested app entry: `geoint/src/main.jsx`

Both entry files mount a React `<App />` component into `#root`.

## 2) Duplicate app structure status

Yes — this repository currently contains duplicate app structures:

- Root-level app scaffold (`src`, `public`, `index.html`, `vite.config.ts`, `package.json`)
- Nested `geoint/` app scaffold (`geoint/src`, `geoint/public`, `geoint/index.html`, `geoint/vite.config.js`, `geoint/package.json`)

There is also duplication of `proxy-server.cjs` at both root and `geoint/`.

## 3) Recommended “real app” to continue developing

`geoint/` appears to be the intended canonical app folder because:

1. It includes a dedicated serverless API route directory (`geoint/api/anthropic.js`) that has no root equivalent.
2. Its package name is project-specific (`"name": "geoint"`), while root is generic (`"name": "my-map-project"`).
3. It contains the same dashboard-style app code and its own proxy server.

Recommendation: treat `geoint/` as the source of truth and avoid making new feature edits in the root app tree.

## 4) Anthropic key loading check (`proxy-server.cjs`)

In both copies of `proxy-server.cjs`, Anthropic credentials are sourced from environment variables only:

- dotenv is loaded via `require('dotenv').config()`
- key is read from `process.env.ANTHROPIC_API_KEY`
- process exits if key is missing

No hard-coded API key appears in either proxy file.

## 5) Cleanup plan before further edits

1. Pick a single canonical app location (`geoint/`) and document it in `README.md`.
2. Freeze root app edits (or archive root app into `archive/` if needed).
3. Remove duplicated runtime files once validated:
   - Remove root `proxy-server.cjs` (keep `geoint/proxy-server.cjs`)
   - Remove one duplicate app tree after migration verification
4. Normalize stack choice in canonical app:
   - Decide JS vs TS and align extensions/config (`main.jsx` + `App.tsx` are mixed)
5. Keep one package lockfile per active app and remove stale lockfiles.
6. Add a short “dev workflow” section (how to run frontend + proxy securely with env vars).

## 6) Safe-edit workflow for next steps

Use this workflow for each requested code change:

1. **Scope lock**: change files only under `geoint/`.
2. **Create small patch**: one concern per commit.
3. **Static checks**: run `npm run lint` in `geoint/`.
4. **Build validation**: run `npm run build` in `geoint/`.
5. **Security pass**: verify no secrets in code (`process.env` only).
6. **Commit with clear message**: reference the exact subsystem touched.

Suggested first cleanup edit (low risk): update top-level README to explicitly state that `geoint/` is canonical and root app is legacy.
