# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

The repo root only contains `stockyapp/`, a Vue 3 + Vite single-page app (plain JavaScript, no TypeScript, no router/store). It is still the unmodified `create-vue` scaffold (`HelloWorld`, `TheWelcome`, `WelcomeItem`, and `icons/` are template demo components). The app is mounted from `src/main.js` into `App.vue`. All commands below run from `stockyapp/`.

## Commands

```sh
npm install
npm run dev       # Vite dev server with HMR (vue-devtools plugin enabled)
npm run build     # production build
npm run preview   # serve the production build
npm run format    # prettier --write --experimental-cli src/
```

There is no test runner or linter configured.

## Notes

- Node `^22.18.0 || >=24.12.0` is required (`engines`).
- `vue` and all `@vue/*` packages are pinned to the `rc` tag through `overrides` in `package.json`. Keep the overrides in sync when adding Vue-related packages.
- `@` aliases `src/` (in `vite.config.js`, and `jsconfig.json` for the editor).
- Prettier style: no semicolons, single quotes, print width 100.
