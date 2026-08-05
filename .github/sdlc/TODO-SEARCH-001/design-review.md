# Design Review - 2026-08-05

Reviewed independently against:
- `.github/sdlc/TODO-SEARCH-001/requirements.md` (commit `54f85fd`, approved)
- `.github/sdlc/TODO-SEARCH-001/architecture.md` (commit `213c0a2`, approved)
- Current code: src/routes/todoRoutes.js, src/controllers/todoController.js, src/data/todos.js, src/app.js, package.json

## Summary

The architecture's core design is sound: registering `GET /search` before `GET /:id` correctly prevents route-capture (verified against Express's registration-order matching and the existing `DELETE /` vs `DELETE /:id` precedent already in `todoRoutes.js`), the `typeof !== 'string'` + `.trim()` validation correctly collapses "missing," "blank/whitespace," and "repeated" into one 400 branch, `.includes()` is confirmed safe against regex-metacharacter and ReDoS concerns since no regex is constructed from user input, and the `{ count, todos }` envelope is copied byte-for-byte from `getAllTodos`.

One **Critical** finding blocks approval: the architecture's planned test strategy (Section 12, `node:test` invoking `searchTodos` directly with mock `req`/`res`, "no HTTP layer") is structurally incapable of exercising FR-001 and FR-006, both Must-priority requirements whose acceptance criteria require proof that an actual HTTP request is dispatched through the real Express router and resolves to the search handler rather than `getTodoById`. A directly-invoked controller function never passes through `todoRoutes.js`, so it cannot prove route order matters at all — which is the central risk this story exists to eliminate. `architecture.md` must be amended before implementation planning proceeds. All other findings are Medium/Low and may be deferred or accepted as documented below.

## Requirement Coverage Confirmation

| FR/NFR ID | Architecture Component | Review Result |
|---|---|---|
| FR-001 | `todoRoutes.js` route registration + `searchTodos` | Component mapping correct; **test evidence path broken — see DR-001** |
| FR-002 | `searchTodos` validation branch | Mapping and logic verified correct (see Summary) |
| FR-003 | `searchTodos` case-insensitive `.includes()` filter | Mapping and logic verified correct; regex/ReDoS risk ruled out |
| FR-004 | `searchTodos` success response | Mapping verified; envelope matches `getAllTodos` exactly |
| FR-005 | `searchTodos` empty-match branch | Mapping verified; `[]`/`0` handled by plain `.filter()` result |
| FR-006 | Route order in `todoRoutes.js` | Design is correct; **test evidence path broken — see DR-001** |
| FR-007 | `searchTodos` read-only access to `todos` | Mapping verified; no mutation calls introduced; see DR-002 for test-isolation clarity |
| NFR-001 | No auth middleware added anywhere | Verified — no auth exists today, none added |
| NFR-002 | No new `require`s, `package.json` unchanged | Verified — plan introduces zero dependencies |
| NFR-003 | `test/todoSearch.test.js` | **Not satisfiable as currently architected for FR-001/FR-006 — see DR-001** |

No unmapped FR/NFR IDs found; every requirement has an owning component in `architecture.md`.

## Findings

| ID | Severity | Category | Evidence | Impact | Recommendation | Disposition | Owner |
|---|---|---|---|---|---|---|---|
| DR-001 | Critical | Testability / Correctness | `architecture.md` §12 Decision Record row for NFR-003: "invoking `searchTodos` directly with mock `req`/`res` objects (no HTTP layer, no `supertest`)". FR-001's acceptance criterion requires "the request reaches the todo search capability" and FR-006's requires "when routes are resolved, then the response is produced by the search endpoint... not a 404 ... from ID lookup." | Direct invocation of `searchTodos` never passes through `todoRoutes.js`, so it cannot prove Express actually resolves `/todos/search` before `/todos/:id`. Two Must-priority FRs (FR-001, FR-006) and NFR-003 ("every acceptance criterion... has automated test evidence") have no achievable executable proof under the current plan — including the exact regression this story is designed to prevent (a future edit reordering the routes would not be caught by any planned test). | Amend `architecture.md` §12 to add real HTTP-level test cases alongside the existing direct-invocation unit tests: start the exported `app` on an ephemeral port (`app.listen(0)`) inside `test/todoSearch.test.js` and issue requests with Node's built-in global `fetch` (stable since Node 18, ships with the runtime — no new dependency, satisfies NFR-002). At minimum assert: (a) `GET /todos/search?name=book` returns 200 with the search envelope (FR-001), and (b) the response body/status is not the `404 { error: 'Todo not found' }` shape produced by `getTodoById` (FR-006). Keep the planned direct-invocation tests for FR-002–FR-005 and FR-007, which do not require the router. | **Resolved** — `architecture.md` §12 amended in commit `88a6b8b` to require `app.listen(0)` + built-in `fetch` HTTP tests for FR-001/FR-006. | Architecture author |
| DR-002 | Medium | Testability | `architecture.md` §12 does not describe how `test/todoSearch.test.js` establishes a deterministic baseline for the shared, mutable `todos` array (`src/data/todos.js` exports the live array by reference, and every handler mutates it in place). | FR-007's acceptance criterion ("a subsequent todo listing contains the same todos in the same order and with unchanged field values") is only meaningfully falsifiable if the test snapshots `todos` before calling `searchTodos` and deep-compares after. Without this documented, an implementer could assert something weaker (e.g., only `count`/length) and still claim FR-007 coverage. | Add one sentence to `architecture.md` §12 (or §7) specifying the snapshot/deep-compare pattern for FR-007's read-only assertion, e.g. capturing `JSON.parse(JSON.stringify(todos))` before and after invoking `searchTodos`. | **Resolved** — `architecture.md` §12 amended in commit `88a6b8b` to specify the `JSON.parse(JSON.stringify(todos))`/`structuredClone` snapshot and deep-equality comparison. | Architecture author |
| DR-003 | Low | Operability / Process | `package.json` `scripts.test` is currently `"echo \"Error: no test specified\" && exit 1"`. `architecture.md` §12 already notes in prose that pointing `npm test` at `node --test` is "an implementation-phase task... called out here for the implementation plan." | NFR-003 requires tests to "pass in the repository's test workflow," but no such workflow exists until this script changes. Risk is low because it is already documented, but it is easy to lose track of since it is not a numbered action item. | No architecture.md change required. Carry forward as an explicit, numbered task in the implementation plan (`npm test` → `node --test`). | Accepted — already addressed by reference in architecture.md. | Dev (impl-plan stage) |
| DR-004 | Low | Security / Robustness | `searchTodos` (as designed) applies no maximum length to `req.query.name`; no request-size guard is specified. | Negligible at current scale: the in-memory dataset has 3 records, `.includes()` is linear and cheap, and Node's HTTP parser already caps header/URL size (~16KB default), which bounds worst-case query length before it reaches the handler. A-005 explicitly disclaims performance targets for this dummy API. | No architecture change required now. Revisit only if the datastore or traffic profile changes materially (would be a separate architecture change per §8). | Accepted risk (deferred, no action needed) — out of current scope per A-005 and the Out-of-Scope section. | N/A |
| DR-005 | Low | Correctness (verified, no defect) | Reviewed `title.toLowerCase().includes(name.toLowerCase())` against regex-special characters (`.`, `*`, `(`, `|`, etc.) and against prototype-pollution-shaped query keys (e.g., `?name[__proto__]=x`, which `qs` parses as a plain object, not a string). | None — matching is literal-substring only (no `RegExp` is constructed from user input, so no ReDoS or unintended wildcard matching), and the pre-existing `typeof req.query.name !== 'string'` check rejects object-shaped query values, closing off prototype-pollution-via-query-string as a vector for this endpoint. | No action needed. | Accepted (no defect found). | N/A |

## Architecture Decisions

| ID | Decision | Rationale | Alternatives Rejected |
|---|---|---|---|
| AD-001 | `test/todoSearch.test.js` must include HTTP-level test cases (via `app.listen(0)` + Node's built-in global `fetch`) for FR-001 and FR-006, in addition to the already-planned direct-invocation unit tests for FR-002–FR-005 and FR-007. | Only an actual HTTP round-trip through `todoRoutes.js` can prove route-registration order resolves `/todos/search` correctly; `fetch` is built into Node 18+ so this adds zero new dependencies, preserving NFR-002. | `supertest` — rejected, adds a new dependency and violates NFR-002. Direct-invocation-only testing — rejected, cannot exercise the router at all, leaving FR-001/FR-006 without executable evidence. |
| AD-002 | `architecture.md` must state the snapshot/deep-compare pattern used to assert FR-007 (todos unchanged after a search request). | Prevents an implementer from satisfying FR-007's test nominally (e.g., checking only array length) while missing order/value regressions. | Leaving the isolation/assertion strategy unstated — rejected, risks weak or flaky FR-007 evidence as the test suite grows. |

## Approval Status

All findings resolved or accepted: DR-001 (Critical) and DR-002 (Medium) are **Resolved** against `architecture.md` commit `88a6b8b`; DR-003–DR-004 are Deferred/Accepted with recorded rationale; DR-005 is a verified non-issue. Approved by user; proceeding to Stage 4 (Implementation Plan).