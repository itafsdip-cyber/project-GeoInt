# Step 2 — Root vs `geoint/` Comparison and Safe Deletion/Migration Plan

## File-by-file comparison (app-relevant)

| Root file/folder | `geoint/` equivalent | Status | Notes |
|---|---|---|---|
| `index.html` | `geoint/index.html` | Duplicate | Same role (Vite HTML entry), maintain only canonical copy long-term. |
| `package.json` | `geoint/package.json` | Duplicate | Root package is generic (`my-map-project`), `geoint` package is project-specific. |
| `package-lock.json` | `geoint/package-lock.json` | Duplicate | Keep one lockfile for the active app. |
| `eslint.config.js` | `geoint/eslint.config.js` | Duplicate | Same role; keep linter config with active app. |
| `vite.config.ts` | `geoint/vite.config.js` | Duplicate (mixed TS/JS) | Canonical app currently uses JS config. |
| `src/main.tsx` | `geoint/src/main.jsx` | Duplicate entry point | Both mount `<App />` to `#root`. |
| `src/App.jsx` | `geoint/src/App.tsx` | Duplicate app shell | Mixed extension choice across copies. |
| `src/App.css` | `geoint/src/App.css` | Duplicate | App-level styles exist in both trees. |
| `src/index.css` | `geoint/src/index.css` | Duplicate | Global styles in both trees. |
| `public/vite.svg` | `geoint/public/vite.svg` | Duplicate | Template asset duplicate. |
| `proxy-server.cjs` | `geoint/proxy-server.cjs` | Duplicate runtime script | Same purpose; should keep one canonical proxy later. |

## Root files that look obsolete/duplicate

These are likely obsolete once migration cleanup is approved and validated:

- Root app scaffold: `src/`, `public/`, `index.html`, `vite.config.ts`, `eslint.config.js`, `package.json`, `package-lock.json`, `proxy-server.cjs`.

## Safe deletion/migration plan (no deletions yet)

1. **Stabilize canonical target (`geoint/`)**
   - Continue all edits/tests only under `geoint/`.
   - Keep root tree untouched except docs/planning.

2. **Preserve non-duplicate repo-level artifacts**
   - Keep root docs/plans (`README.md`, `REPO_STRUCTURE_AUDIT.md`, this Step 2 plan).
   - Evaluate `geopolitical-dashboard.jsx` (root-only) and either:
     - move to `docs/archive/` if historical reference, or
     - remove later if confirmed unused.

3. **Migration validation checklist before removal**
   - `cd geoint && npm run lint`
   - `cd geoint && npm run build`
   - Confirm frontend and proxy run from `geoint/` only.

4. **Phase deletion (future PR, explicit approval)**
   - Remove root duplicate runtime files first (`proxy-server.cjs`, root app scaffold).
   - Remove root toolchain duplicates (`vite.config.ts`, root lockfile/package if no longer needed).

## Keep / migrate / remove-later list

### Keep
- `geoint/**` (canonical app)
- Root repo docs/plans: `README.md`, `REPO_STRUCTURE_AUDIT.md`, `STEP2_DUPLICATE_APP_PLAN.md`

### Migrate (future)
- `geopolitical-dashboard.jsx` → either `docs/archive/` (reference) or `geoint/src/archive/` (if needed for code provenance)
- Any root-only useful documentation into a dedicated `docs/` folder

### Likely safe to remove later
- Root duplicate app/runtime/tooling files:
  - `src/**`
  - `public/**`
  - `index.html`
  - `vite.config.ts`
  - `eslint.config.js`
  - `package.json`
  - `package-lock.json`
  - `proxy-server.cjs`
