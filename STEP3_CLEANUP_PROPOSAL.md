# Step 3 — Root-Level Duplicate Cleanup Proposal (Docs Only)

## Scope and goal

This proposal defines the **smallest safe next cleanup step** after Step 2:

- Keep `geoint/` as the canonical app.
- Do **not** delete files in this step.
- Prepare an explicit, reviewable deletion list for a follow-up PR.

---

## Exact root files likely safe to remove (future deletion PR)

These files/folders appear to be legacy duplicates of canonical `geoint/` files and are likely safe to remove **after checks pass**:

### Root app/runtime duplicates
- `index.html`
- `src/` (entire folder)
- `public/` (entire folder)
- `proxy-server.cjs`

### Root toolchain duplicates
- `eslint.config.js`
- `vite.config.ts`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`

---

## Root files that still need migration/decision before deletion

These root files should be **kept for now** until migration/retention decisions are complete:

- `geopolitical-dashboard.jsx`
  - Root-only artifact; decide whether to:
    - migrate to `docs/archive/` as historical reference, or
    - port any still-needed logic into `geoint/src/` and then archive/remove.
- Root planning/audit docs:
  - `README.md`
  - `REPO_STRUCTURE_AUDIT.md`
  - `STEP2_DUPLICATE_APP_PLAN.md`
  - `STEP3_CLEANUP_PROPOSAL.md` (this file)

---

## Risks/checks before deletion

Run these checks before any file-removal PR:

1. **Canonical app health**
   - `cd geoint && npm install`
   - `cd geoint && npm run lint`
   - `cd geoint && npm run build`

2. **Runtime ownership check**
   - Confirm any local/dev scripts, docs, or deployment references use `geoint/` paths only.
   - Confirm proxy usage points to `geoint/proxy-server.cjs` only.

3. **Security pattern check**
   - Ensure Anthropic key handling still uses `process.env.ANTHROPIC_API_KEY` with no hard-coded secrets.

4. **Recovery safety**
   - Delete in a single, isolated PR to make rollback trivial if an unexpected root reference is discovered.

---

## Suggested next PR (after this docs step)

A single cleanup PR that removes only the files listed in “likely safe to remove,” while preserving docs and `geopolitical-dashboard.jsx` until migration/archival is explicitly approved.
