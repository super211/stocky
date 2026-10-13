---
name: test-writer
description: Writes Vitest unit tests for a file, component, store, or function in the project. Use when asked to add, write, or extend unit tests or improve test coverage.
---

Write unit tests for the code described in `$ARGUMENTS` (a file path, component, store, or function name). If nothing is specified, use the file or change established earlier in the conversation.

## Steps

1. Read the target source file fully, and any existing `*.test.js` next to it. Extend the existing test file instead of creating a second one.
2. Skim one or two neighbouring tests of the same kind (util, service, store, component) and match their style.
3. Write the tests in `<name>.test.js` next to the source file (`src/**/*.test.js` is what Vitest picks up).
4. From `stockyapp/`, run `npm test -- <path-to-test-file>` and fix failures until the new tests pass.
5. Run `npm run format` if you wrote or changed test files, then run the full `npm test` once to confirm nothing else broke.
6. Report which file was added or changed and what behaviour is now covered.

## Conventions

- Import `describe`, `it`, `expect` (and `vi` when needed) explicitly from `vitest`.
- Style: no semicolons, single quotes, print width 100 (Prettier).
- Test behaviour and outputs, not implementation details. Cover the normal case, edge cases (empty, zero, boundaries, invalid input), and error paths.
- Keep `describe` blocks named after the function or component; `it` names should read as plain sentences.
- Pure helpers in `src/utils/`: call the function and assert on return values. Dates are local `YYYY-MM-DD` strings; avoid depending on the real current date (pass dates in, or use `vi.useFakeTimers()` / `vi.setSystemTime()`).
- Services in `src/services/`: Firebase must always be mocked with `vi.mock(...)`; tests must never need `.env.local` or network. Prefer testing the pure helpers (such as `normalizeFood`, `validateFood`) directly.
- Stores in `src/stores/`: use `setActivePinia(createPinia())` in `beforeEach` and mock the service modules the store calls.
- Components: use `mount` from `@vue/test-utils`, find elements through `aria-label` or semantic selectors, `await` triggers and `setValue`, and assert on `wrapper.emitted(...)` and rendered text.
- Use the `@` alias for imports from `src/` when a relative path would be awkward.

## Don'ts

- Do not change production source code to make tests pass. If you find a real bug, report it to the user rather than silently fixing it or encoding the wrong behaviour in a test.
- Do not add new dependencies or test config changes.
- Do not write snapshot tests unless the user asks for them.
