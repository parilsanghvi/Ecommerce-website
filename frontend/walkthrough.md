# Frontend Migration Walkthrough

## Overview
We are migrating from Create React App (Webpack) to Vite to improve performance.

## Changes
- **Build Tool**: `react-scripts` -> `vite`
- **Configuration**: Added `vite.config.js`
- **Index File**: Moved `public/index.html` to `frontend/index.html`

## New Commands
The commands in `package.json` have been aliased to match the old ones, so you shouldn't need to change your workflow.

- **Start Dev Server**: `npm start` (runs `vite`)
- **Build**: `npm run build` (runs `vite build`)

## Troubleshooting
- If you see errors about "loader", it might be due to `.js` files containing JSX. We have configured Vite to handle this, but renaming to `.jsx` is recommended in the future.
- `process.env` is polyfilled or replaced with `import.meta.env`.
