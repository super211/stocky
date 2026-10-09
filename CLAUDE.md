# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

The repo root only contains `stockyapp/`, a Vue 3 + Vite single-page app (plain JavaScript, no TypeScript) for mobile-first calorie tracking. See `spec.md` for the product spec. Stack: Tailwind CSS v4 (`@tailwindcss/vite`), `vue-router`, `pinia`, Firebase Auth + Firestore.

- `src/services/` talks to Firebase (`firebase.js` init, `users.js`, `foods.js`, `entries.js`). Views never call Firestore directly.
- `src/stores/` holds Pinia stores (`auth`, `diary`, `foods`). `router/index.js` has the auth guard, which sends users who haven't finished onboarding (`profile.onboarded`) to `/setup`.
- `src/utils/` has pure helpers (`date.js` uses local `YYYY-MM-DD` strings, `calories.js` has meals and serving math, `nutrition.js` has the calorie-goal formula).
- Firestore data lives under `users/{uid}`; rules are in `stockyapp/firestore.rules` and must be published manually in the Firebase console.
- Firebase config comes from `stockyapp/.env.local` (`VITE_FIREBASE_*`, see `.env.example`). Without it the app shows a setup notice.

All commands below run from `stockyapp/`.

## Commands

```sh
npm install
npm run dev       # Vite dev server with HMR (vue-devtools plugin enabled)
npm run build     # production build
npm run preview   # serve the production build
npm run format    # prettier --write --experimental-cli src/
npm test          # vitest run (all tests once)
npm run test:watch
```

Tests are Vitest + `@vue/test-utils` + jsdom, in `*.test.js` files next to the code they cover (`vitest.config.js`, separate from `vite.config.js`). Firebase is always mocked, so tests never need `.env.local` or network. No linter is configured.

## Notes

- Node `^22.18.0 || >=24.12.0` is required (`engines`).
- `vue` and all `@vue/*` packages are pinned to the `rc` tag through `overrides` in `package.json`. Keep the overrides in sync when adding Vue-related packages.
- `@` aliases `src/` (in `vite.config.js`, and `jsconfig.json` for the editor).
- Prettier style: no semicolons, single quotes, print width 100.
