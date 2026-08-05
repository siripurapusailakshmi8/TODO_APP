# Code Review - 2026-08-05

Reviewed independently against:
- `.github/sdlc/TODO-SEARCH-001/requirements.md` (approved, commit `54f85fd`)
- `.github/sdlc/TODO-SEARCH-001/architecture.md` (approved, commits `213c0a2`, `88a6b8b`)
- `.github/sdlc/TODO-SEARCH-001/design-review.md` (all findings resolved/accepted)
- `.github/sdlc/TODO-SEARCH-001/impl-plan.md` (T-001–T-006, all Done)
- Implementation commit `76f7e2f`: src/controllers/todoController.js, src/routes/todoRoutes.js, test/todoSearch.test.js, package.json

## Baseline

- `npm test` (7/7 passed) before any review changes.
- `npm audit --audit-level=high` — 0 vulnerabilities.
- Empirically verified (via a live `app.listen(0)` probe, not assumption) that Express 5's real query parser turns a missing `name` and a repeated `?name=a&name=b` into the same shapes the mocked unit tests assumed (`undefined` and an array, respectively), both producing `400`.

## Summary

The implementation is small, correctly scoped to the approved architecture, and introduces no new dependencies. Route order (`/search` before `/:id`), the `{ count, todos }` envelope, the `{ error }` validation envelope, and the read-only guarantee all match `architecture.md` exactly. No Critical or High findings. One Medium testability gap was found and fixed: the `400` validation path (FR-002) was proven only via a mocked `req`/`res`, never via a real HTTP request, leaving an unverified assumption about Express's query-parsing behavior in the very area this story exists to de-risk (route/parameter resolution). This has been fixed by adding HTTP-level assertions for the missing-name and repeated-name cases, using empirically confirmed behavior rather than an assumption.

## Findings

| ID | File | Line | Severity | Area | Issue | Fix Applied |
|---|---|---|---|---|---|---|
| CR-001 | test/todoSearch.test.js | (HTTP test) | Medium | Test Coverage | FR-002's `400` outcomes (missing / repeated `name`) were asserted only against a hand-built mock `req.query`, never against Express's actual query-string parsing over a real HTTP request — the exact category of unverified framework-behavior assumption this story's design review (DR-001) was created to eliminate for FR-001/FR-006. | Yes — added `missing`/`repeated` HTTP assertions inside the existing `app.listen(0)` test, confirmed with a live probe that real Express produces `400` for both before adding the assertions. |
| CR-002 | src/controllers/todoController.js | `searchTodos` | Low | Robustness | No maximum length is enforced on `name` before `.toLowerCase()`/`.includes()`. | No — matches `architecture.md` DR-004 (accepted risk, out of scope per requirements A-005); `.includes()` is linear-time with no ReDoS exposure, and Node's HTTP layer already bounds URL length. |
| CR-003 | src/controllers/todoController.js | `searchTodos` | Low | Clarity (verified, no defect) | Validation combines "missing", "blank", and "repeated" into a single `typeof !== 'string' || trim() === ''` check with one shared error message, per design. | No — intentional per approved architecture; message text was explicitly left implementation-defined (A-004) and is not ambiguous in context. |

## Review Matrix

| Area | Status | Notes |
|---|---|---|
| Correctness | Pass | All 7 FR/2 NFR acceptance criteria met; verified against live HTTP behavior, not assumption. |
| Security | Pass | No injection surface (`.includes()`, no `RegExp` built from input); `typeof` check rejects object-shaped query values (prototype-pollution vector via query keys), confirmed in design-review DR-005; no auth change; no secrets involved. |
| Error Handling | Pass | `400` (validation), `200` (success/empty match), `500` (unchanged global handler) are distinctly and correctly produced; `404` from `/:id` is provably unreachable for `/search` (route-order test). |
| Test Coverage | Pass → Fixed | CR-001 resolved; now 7/7 tests cover validation (mock + live HTTP), matching, envelope shape, empty-match, read-only guarantee, and route precedence. |
| Code Clarity | Pass | Single-line comment matches existing file convention; handler mirrors `getAllTodos` structure. |
| DRY Principle | Pass | Reuses existing list envelope and error shape; no new abstraction introduced for a single new handler, consistent with file's existing one-function-per-route style. |
| Dependency Safety | Pass | `npm audit --audit-level=high` — 0 vulnerabilities; `package.json` diff confined to the `scripts.test` line — no `dependencies`/`devDependencies` changes. |

## Requirement Coverage Confirmation

| FR/NFR ID | Verified By | Result |
|---|---|---|
| FR-001 | `test/todoSearch.test.js` (HTTP 200 + envelope check) | Pass |
| FR-002 | `test/todoSearch.test.js` (mock: missing/blank/repeated → 400; HTTP: missing/repeated → 400, added in this review) | Pass |
| FR-003 | `test/todoSearch.test.js` (case-insensitive partial match) | Pass |
| FR-004 | `test/todoSearch.test.js` (`count === todos.length`) | Pass |
| FR-005 | `test/todoSearch.test.js` (`{ count: 0, todos: [] }`) | Pass |
| FR-006 | `test/todoSearch.test.js` (HTTP: not the `/:id` 404 shape) | Pass |
| FR-007 | `test/todoSearch.test.js` (deep-equal snapshot before/after) | Pass |
| NFR-001 | Code inspection — no auth middleware exists or was added | Pass |
| NFR-002 | `npm audit`, `package.json` diff | Pass |
| NFR-003 | `npm test` → `node --test`, 7/7 passing | Pass |

## Approval Status

No Critical or High findings. CR-001 (Medium) fixed and validated (`npm test`, 7/7 passing). CR-002–CR-003 (Low) reviewed and accepted with recorded rationale, consistent with prior design-review dispositions. Approved by user.