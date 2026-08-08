# TODO-SEARCH-NAME Implementation Plan

| Field | Value |
| --- | --- |
| Story | `TODO-SEARCH-NAME` |
| Stage | Stage 4: Implementation Planning |
| Requirements baseline | Approved `requirements.md`, commit `9e71632cf939aab6e3aa650451f3fc86df090da1` |
| Architecture and design-review baseline | Approved `architecture.md` and `design-review.md`, commit `2deaa74367243010d28433294d6eaed72ef9d262` |
| Plan status | Stage 8 reversible preparation in progress; IP-001 through IP-007 complete, while IP-008 publication actions remain blocked pending explicit confirmation |
| Dependency proposal | Add no production or development dependencies; use built-in `node:test`, native HTTP/fetch support, and native JavaScript string/array operations |

## 1. Scope and Planning Decisions

This plan implements optional `name` search on the existing `GET /todos` endpoint. The implementation remains in the Todo List Controller, searches only the current ordered in-memory dataset, preserves the established `{ count, todos }` response and todo object shape, and leaves omitted-`name`, `completed`, and `priority` behavior unchanged.

The test boundary is the exported Express application in `src/app.js`. Focused tests will bind it to an ephemeral local port and issue HTTP requests, exercising Express query parsing and the complete route/controller response without starting `server.js` or adding a test framework. Test setup and teardown must close the listener and must not mutate the shared todo array.

The repository's startup output already lists supported `GET /todos` query variants, so `server.js` is an applicable documentation surface and will gain a `name` example. The approved requirements and architecture artifacts are immutable during implementation; implementation traceability and task status will be maintained in this plan and later verification evidence.

This is an API-only change with no browser UI, DOM, visual state, keyboard interaction, or browser-specific behavior. A Playwright browser case is therefore not applicable. Real HTTP tests against the Express app provide the relevant end-to-end boundary with less unrelated tooling and no browser dependency.

## 2. Dependency-Ordered Tasks

| ID | Title | Requirement links | Affected component/files | Observable completion criteria | Exact runnable validation command | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IP-001 | Establish native HTTP test foundation and no-name compatibility baseline | FR-007; NFR-001 | Test tooling and Express application boundary: `package.json`; new `test/todos.http.test.js`; read-only use of `src/app.js` and `src/data/todos.js` | `npm test` invokes built-in `node:test` with no new package; the HTTP harness listens on an ephemeral port, always closes the listener, and does not mutate todos; passing baseline cases lock current no-name behavior for unfiltered listing, supported `completed` and `priority` filters, and invalid truthy priority, including status and response content/order. | `npm test -- --test-name-pattern="GET /todos baseline without name"` | None, after explicit plan approval | Complete - 2026-08-08; exact validation passed 5/5 |
| IP-002 | Implement native name filtering with focused HTTP acceptance coverage | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; NFR-001, NFR-002, NFR-003 | Todo List Controller and HTTP tests: `src/controllers/todoController.js`; `test/todos.http.test.js` | The controller detects `name` presence independently of truthiness, requires one scalar string, trims once, rejects blank and repeated values with `400 { error: "name must be a non-empty string" }`, and applies case-insensitive `title.includes` filtering with native operations after existing filters. HTTP cases pass for exact valid matching; trim/case/substring matching; `name` + `completed` + `priority` AND semantics; blank input `400`; repeated `name` `400`; valid no-match empty `200`; deterministic repeated status/count/ordered todos; exact top-level response members, `count === todos.length`, and unchanged todo field sets. All IP-001 baseline cases still pass. | `npm test` | IP-001 | Complete - 2026-08-08; exact validation passed 14/14 |
| IP-003 | Document the name-search route variant | FR-001, FR-002, FR-007; NFR-001 | Startup route-list documentation: `server.js` | Startup output includes a concise `GET /todos?name=<search>` route example while all existing route entries and runtime startup behavior remain unchanged. | `node -e "const fs=require('node:fs');const text=fs.readFileSync('server.js','utf8');if(!text.includes('GET    /todos?name='))process.exit(1)"` | IP-002 | Complete - 2026-08-08; exact validation passed |
| IP-004 | Synchronize requirement-to-implementation traceability | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; NFR-001, NFR-002, NFR-003 | Planning traceability: `impl-plan.md` | The traceability matrix names the implemented controller/documentation surfaces and HTTP evidence for every FR/NFR; task statuses reflect executable evidence only; approved `requirements.md`, `architecture.md`, and `design-review.md` remain byte-for-byte unchanged from their committed baselines. | `node -e "const fs=require('node:fs');const text=fs.readFileSync('impl-plan.md','utf8');const ids=['FR-001','FR-002','FR-003','FR-004','FR-005','FR-006','FR-007','NFR-001','NFR-002','NFR-003'];if(ids.some(id=>!text.includes('| '+id+' |')))process.exit(1)"` | IP-002, IP-003 | Complete - 2026-08-08; exact validation and baseline hash checks passed |
| IP-005 | Audit production dependencies | NFR-001, NFR-003 | Dependency manifest and lockfile inspection: `package.json`; `package-lock.json` (no planned changes) | `npm audit --omit=dev` completes successfully; the result and timestamp are captured for verification; manifest and lockfile show no dependency addition or unrelated change. Any advisory is reported and assessed rather than silently changing dependencies. | `npm audit --omit=dev` | IP-002 | Complete - 2026-08-08; 0 vulnerabilities; no dependency or lockfile changes |
| IP-006 | Produce full verification handoff | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; NFR-001, NFR-002, NFR-003 | Stage 7 evidence: new `verification.md`; all files changed by IP-001 through IP-005 | The handoff records environment, commands, exit results, acceptance-case mapping, full test results, production audit, diff hygiene, unchanged approved baselines, no dependency additions, and the Playwright non-applicability rationale. Every AC-001 through AC-008 and every FR/NFR has passing automated evidence or an explicit blocker; no task is marked complete without evidence. | `npm test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm audit --omit=dev; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git diff --check` | IP-001, IP-002, IP-003, IP-004, IP-005 | Complete - 2026-08-08; all available required checks passed and skips/residual risks are recorded in [verification.md](verification.md) |
| IP-007 | Record the user-facing change in the changelog | FR-001, FR-002, FR-003, FR-005, FR-006, FR-007; NFR-001 | Release documentation: new `CHANGELOG.md` if no changelog exists at execution time, otherwise the repository's established changelog | An unreleased entry identifies optional title search, trim/case-insensitive substring behavior, combined-filter AND behavior, blank/repeated-input `400`, empty-match `200`, backward compatibility, and no dependency addition without claiming unverified outcomes. | `node -e "const fs=require('node:fs');const text=fs.readFileSync('CHANGELOG.md','utf8');if(!text.includes('TODO-SEARCH-NAME'))process.exit(1)"` | IP-006 | Complete - 2026-08-08; changelog created because no repository convention existed and required content validation passed |
| IP-008 | Prepare the Stage 8 pull-request handoff | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; NFR-001, NFR-002, NFR-003 | Git diff and history; `CHANGELOG.md`; `verification.md`; PR title/body and reviewer checklist (external metadata, not a required repository file) | The branch contains only approved story changes; diff is clean; PR draft content summarizes behavior and risk, links all requirements, cites test/audit evidence, states no dependencies or Playwright case, includes rollback and reviewer checks, and identifies any residual risk. No commit, push, or PR creation occurs without the separate explicit approval required by its stage. | `git diff --check; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git status --short --branch; git diff --stat` | IP-006, IP-007 | Blocked - explicit confirmation required before branch creation, commit, push, or PR publication |

## 3. Requirement and Acceptance Traceability

| Requirement | Implementation task(s) | Verification task/evidence | Verification status |
| --- | --- | --- | --- |
| FR-001 | IP-002 controller; IP-003 startup documentation | IP-006 verified exact valid-name HTTP behavior, repeated-key validation, and unchanged route handling | PASS - [verification.md](verification.md) sections 4 and 5 |
| FR-002 | IP-002 controller; IP-003 startup documentation | IP-006 verified exact-title and trimmed, case-insensitive substring behavior (AC-001, AC-002) | PASS - [verification.md](verification.md) sections 4 and 5 |
| FR-003 | IP-002 controller | IP-006 verified combined `name`, `completed`, and `priority` AND behavior (AC-003) | PASS - [verification.md](verification.md) sections 4 and 5 |
| FR-004 | IP-002 controller and HTTP tests | IP-006 verified the exact envelope, count, todo field set, values, and source order (AC-004) | PASS - [verification.md](verification.md) sections 4 and 5 |
| FR-005 | IP-002 controller | IP-006 verified empty, whitespace-only, and repeated non-scalar `400` behavior (AC-005) | PASS - [verification.md](verification.md) sections 4 and 5 |
| FR-006 | IP-002 controller | IP-006 verified no-match `200 { count: 0, todos: [] }` behavior (AC-006) | PASS - [verification.md](verification.md) sections 4 and 5 |
| FR-007 | IP-001 baseline; IP-002 controller/tests; IP-003 startup documentation | IP-006 verified the no-name baseline and complete regression suite (AC-007) | PASS - [verification.md](verification.md) sections 4 and 5 |
| NFR-001 | IP-001 baseline; IP-002 controller/tests; IP-005 audit | IP-006 verified no-name compatibility and a production audit reporting 0 vulnerabilities | PASS - [verification.md](verification.md) sections 2 and 5 |
| NFR-002 | IP-002 controller/tests | IP-006 verified deterministic status, count, and ordered todos across repeated requests and suite runs (AC-008) | PASS - [verification.md](verification.md) sections 4 and 5 |
| NFR-003 | IP-002 controller/tests; IP-005 audit | IP-006 verified exact response contracts, no dependency or lockfile additions, and 0 audit vulnerabilities | PASS - [verification.md](verification.md) sections 2, 5, and 7 |

All seven functional and three non-functional requirements map to implementation and executable verification. All eight acceptance criteria map to focused HTTP evidence. No task introduces persistence, sorting, pagination, description search, field changes, authentication, authorization, global error-handler changes, or other approved out-of-scope work.

## 4. Ordering Validation

1. IP-001 first creates a passing, dependency-free test command and captures the compatibility baseline required to detect regressions.
2. IP-002 then changes the owning controller and adds all search-specific HTTP evidence while retaining IP-001 coverage.
3. IP-003 documents only behavior made executable by IP-002.
4. IP-004 synchronizes traceability only after implementation, tests, and applicable route documentation exist.
5. IP-005 audits the resulting production dependency graph after implementation; it can follow IP-002 independently of documentation.
6. IP-006 completed the convergence gate after implementation, documentation, traceability, tests, and audit were complete.
7. IP-007 records only verified behavior after IP-006.
8. IP-008 prepares the PR handoff only after verification and changelog completion.

No task precedes a prerequisite. The only parallel opportunity is IP-005 after IP-002 while IP-003 and IP-004 proceed; the listed table remains a valid dependency order.

## 5. Blocked Tasks and Unblockers

| Blocked task(s) | Blocker | Unblocker | Approval sensitivity |
| --- | --- | --- | --- |
| IP-008 branch creation, commit, push, or PR publication | External/repository publication action is not approved. | Obtain explicit user confirmation immediately before creating or switching branches, committing, pushing, or creating or updating a PR. | Required; preparing text, updating the changelog, and inspecting the diff do not authorize publication. |
| Any task requiring a new package, privileged access, destructive operation, architecture change, or scope expansion | No such change is approved or currently expected. | Stop, document the need and impact, and obtain explicit approval before proceeding; update approved design/plan first when material. | `Needs approval`. |

There are no unresolved technical blockers in the approved Stage 8 preparation scope. IP-007 is complete. IP-008 publication actions remain gated by explicit confirmation, and the dependency proposal remains none.

## 6. Approval Record

Stage 5 execution of IP-001 through IP-005 and focused passing commits was explicitly approved on 2026-08-08. Stage 7 execution was subsequently authorized, and the user explicitly authorized restoration of `impl-plan.md`, `server.js`, and `src/controllers/todoController.js` to approved HEAD to resolve the editor/worktree conflict before IP-006 synchronization. Reversible Stage 8 preparation and IP-007 were authorized on 2026-08-08; branch creation or switching, commit, push, and pull-request creation or update remain explicitly unauthorized pending final confirmation.

## 7. Stage 5 Work Log

| Task | Falsifiable local hypothesis | Cheapest discriminating check | Result |
| --- | --- | --- | --- |
| IP-001 | The exported Express app supports an ephemeral native-HTTP harness that preserves current no-name listing and filter behavior without mutating the shared todo array. | `npm test -- --test-name-pattern="GET /todos baseline without name"` | Passed 2026-08-08: 5 tests passed, 0 failed; baseline status, content, order, teardown, and no-mutation assertions succeeded. |
| IP-002 | A presence-aware inline controller branch after existing filters will reject non-scalar or blank `name` values and produce stable, case-insensitive title substring results without changing no-name behavior or todo objects. | `npm test` | Passed 2026-08-08: 14 tests passed, 0 failed; all search acceptance and no-name compatibility cases succeeded. |
| IP-003 | One additional startup route-list line containing `GET    /todos?name=` will document the implemented query variant without altering listener startup or existing route entries. | `node -e "const fs=require('node:fs');const text=fs.readFileSync('server.js','utf8');if(!text.includes('GET    /todos?name='))process.exit(1)"` | Passed 2026-08-08 with exit code 0. |
| IP-004 | Concrete controller, HTTP-test, and startup-documentation evidence can replace planned trace rows for every FR/NFR without changing any approved requirements or design artifact. | Exact traceability matrix command, then approved-baseline blob-hash comparison | Passed 2026-08-08: all 10 FR/NFR rows present; `requirements.md`, `architecture.md`, and `design-review.md` hashes matched their approved commits. |
| IP-005 | The unchanged production dependency graph has no reported production advisories, and Stage 5 introduced no dependency or lockfile changes. | `npm audit --omit=dev`, then manifest/lockfile diff from `60adb5a29b6c7118bffd484e8b56b194ab684db2` | Passed 2026-08-08: 0 vulnerabilities; lockfile unchanged; manifest changed only to invoke `node --test`. |