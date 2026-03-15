# project-GeoInt

## Canonical App

`geoint/` is the canonical application folder for active development.

- ✅ Use `geoint/` for all new feature work, bug fixes, and validation.
- ⚠️ The root-level app scaffold is a legacy/duplicate structure and should **not** be used for new development.

## Legacy Archive Reference

- `docs/legacy/geopolitical-dashboard-v7-legacy.jsx` is an **archived legacy reference only**.
- It was moved from `geopolitical-dashboard.jsx` in the repository root.
- It is **not** part of the active `geoint/` application build or runtime.

## Project Structure

- `geoint/`  
  Active Vite + React app used for ongoing development and runtime validation.

- `docs/legacy/`  
  Archived legacy references kept for historical/context purposes only.

## Working Rule

Before making edits, change into `geoint/` and run commands there:

```bash
cd geoint
npm run lint
npm run build
```

Do not add new product changes to root-level app files unless explicitly performing migration/cleanup.
