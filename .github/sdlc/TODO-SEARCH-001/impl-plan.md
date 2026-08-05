# Implementation Plan - TODO-SEARCH-001

Source: `.github/sdlc/TODO-SEARCH-001/requirements.md` (commit `54f85fd`, approved), `.github/sdlc/TODO-SEARCH-001/architecture.md` (commits `213c0a2`, `88a6b8b`, approved), `.github/sdlc/TODO-SEARCH-001/design-review.md` (all findings resolved or accepted).

## Task List

| ID | Title | Req Links | Component / File | Completion Criteria | Validation Command | Depends On | Status |
|---|---|---|---|---|---|---|---|
| T-001 | Implement `searchTodos` controller handler | FR-002, FR-003, FR-004, FR-005, FR-007 | `src/controllers/todoController.js` | `searchTodos` is exported; rejects missing/blank/repeated `name` with `400 { error }`; matches `title` case-insensitively via substring; returns `200 { count, todos }`; never calls `.push`/`.splice`/index-assignment on `todos`. | `node -e "const c = require('./src/controllers/todoController'); if (typeof c.searchTodos !== 'function') throw new Error('searchTodos missing'); console.log('ok')"` | None | Done |
| T-002 | Register `GET /search` before `GET /:id` in the router | FR-001, FR-006, NFR-001 | `src/routes/todoRoutes.js` | `router.get('/search', searchTodos)` is registered before `router.get('/:id', getTodoById)`; no auth middleware added; module still loads cleanly. | `node -e "require('./src/app'); console.log('app loads')"` | T-001 | Done |
| T-003 | Author direct-invocation unit tests for validation, matching, envelope, and read-only behavior | FR-002, FR-003, FR-004, FR-005, FR-007 | `test/todoSearch.test.js` (new) | `node:test` cases exist and pass for: missing/blank/repeated `name` → 400; case-insensitive partial match; success envelope shape (`count === todos.length`); no-match → `200 { count: 0, todos: [] }`; `todos` array deep-equal (via `JSON.parse(JSON.stringify(todos))` snapshot) before vs. after a search call. | `node --test test/todoSearch.test.js` | T-001 | Done |
| T-004 | Extend test file with HTTP-level route-order tests | FR-001, FR-006 | `test/todoSearch.test.js` | Test starts the exported `app` via `app.listen(0)`, issues `fetch` requests to `/todos/search?name=...`, asserts `200` with the search envelope (not the `404 { error: 'Todo not found' }` shape from `getTodoById`), and closes the server after. | `node --test test/todoSearch.test.js` | T-002, T-003 | Done |
| T-005 | Point `npm test` at the Node test runner | NFR-003 | `package.json` (`scripts.test`) | `scripts.test` runs `node --test`; no `dependencies`/`devDependencies` entries change. | `npm test` | T-004 | Done |
| T-006 | Confirm zero new dependencies and full suite pass | NFR-002 | `package.json`, full repo | `git diff` for `package.json` shows only the `scripts.test` line changed; full test suite passes. | `npm test && git diff --stat package.json` | T-005 | Done |

## Blocked Tasks

| Task ID | Blocked By | Unblocked When |
|---|---|---|
| T-002 | T-001 | T-001 is complete and validated (`searchTodos` exported and importable) |
| T-003 | T-001 | T-001 is complete and validated |
| T-004 | T-002, T-003 | T-002 and T-003 are both complete and validated |
| T-005 | T-004 | T-004 is complete and validated (`node --test test/todoSearch.test.js` passes) |
| T-006 | T-005 | T-005 is complete and validated (`npm test` runs via the updated script) |

## Approval Status

Approved by user. No production code has been written for this plan; Stage 5 (Implementation) will execute T-001 through T-006 in order.