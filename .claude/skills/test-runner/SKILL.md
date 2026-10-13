---
name: test-runner
description: Runs the project's unit tests (Vitest) and reports the results. Use when asked to run tests, check that tests pass, or verify a change.
---

Run the unit tests for this project and report the results.

1. From the `stockyapp/` directory, run `npm test` (this runs `vitest run`, all tests once). If `$ARGUMENTS` names a file or test name pattern, run `npm test -- $ARGUMENTS` instead.
2. Report the outcome: number of test files and tests passed, failed, and skipped.
3. For each failure, give the test file, test name, and the assertion or error message, plus the likely cause if it is clear from the output.
4. Do not modify code or tests unless the user asks you to fix the failures.

Notes:
- Tests are Vitest + `@vue/test-utils` + jsdom, in `*.test.js` files next to the code they cover.
- Firebase is mocked, so no `.env.local` or network access is needed.
- Use `npm run test:watch` only if the user explicitly asks for watch mode.
