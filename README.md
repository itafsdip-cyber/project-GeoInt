# project-GeoInt

## Canonical App

`geoint/` is the canonical application folder for active development.

- ✅ Use `geoint/` for all new feature work, bug fixes, and validation.
- ⚠️ The root-level app scaffold is a legacy/duplicate structure and should **not** be used for new development.

## Project Structure

- `geoint/`  
  Active Vite + React app used for ongoing development and runtime validation.

- `/` (repository root app files such as `src/`, `index.html`, `vite.config.ts`, `package.json`)  
  Legacy duplicate scaffold retained temporarily for cleanup/migration safety.

## Working Rule

Before making edits, change into `geoint/` and run commands there:

```bash
cd geoint
npm run lint
npm run build
```

Do not add new product changes to root-level app files unless explicitly performing migration/cleanup.
