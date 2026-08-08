# TODO-SEARCH-NAME Implementation Plan

| Field | Value |
| --- | --- |
| Story | `TODO-SEARCH-NAME` |
| Stage | Stage 4: Implementation Planning |
| Requirements baseline | Approved `requirements.md`, commit `9e71632cf939aab6e3aa650451f3fc86df090da1` |
| Architecture and design-review baseline | Approved `architecture.md` and `design-review.md`, commit `2deaa74367243010d28433294d6eaed72ef9d262` |
| Plan status | Stage 5 approved; IP-001 through IP-003 complete, IP-004 and IP-005 authorized in dependency order |
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
| IP-004 | Synchronize requirement-to-implementation traceability | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; NFR-001, NFR-002, NFR-003 | Planning traceability: `impl-plan.md` | The traceability matrix names the implemented controller/documentation surfaces and HTTP evidence for every FR/NFR; task statuses reflect executable evidence only; approved `requirements.md`, `architecture.md`, and `design-review.md` remain byte-for-byte unchanged from their committed baselines. | `node -e "const fs=require('node:fs');const text=fs.readFileSync('impl-plan.md','utf8');const ids=['FR-001','FR-002','FR-003','FR-004','FR-005','FR-006','FR-007','NFR-001','NFR-002','NFR-003'];if(ids.some(id=>!text.includes('| '+id+' |')))process.exit(1)"` | IP-002, IP-003 | Ready - IP-002 and IP-003 passed; Stage 5 approved |
| IP-005 | Audit production dependencies | NFR-001, NFR-003 | Dependency manifest and lockfile inspection: `package.json`; `package-lock.json` (no planned changes) | `npm audit --omit=dev` completes successfully; the result and timestamp are captured for verification; manifest and lockfile show no dependency addition or unrelated change. Any advisory is reported and assessed rather than silently changing dependencies. | `npm audit --omit=dev` | IP-002 | Blocked - IP-002 and Stage 4 approval |
| IP-006 | Produce full verification handoff | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; NFR-001, NFR-002, NFR-003 | Stage 7 evidence: new `verification.md`; all files changed by IP-001 through IP-005 | The handoff records environment, commands, exit results, acceptance-case mapping, full test results, production audit, diff hygiene, unchanged approved baselines, no dependency additions, and the Playwright non-applicability rationale. Every AC-001 through AC-008 and every FR/NFR has passing automated evidence or an explicit blocker; no task is marked complete without evidence. | `npm test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm audit --omit=dev; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git diff --check` | IP-001, IP-002, IP-003, IP-004, IP-005 | Blocked - IP-001 through IP-005 and Stage 7 authorization |
| IP-007 | Record the user-facing change in the changelog | FR-001, FR-002, FR-003, FR-005, FR-006, FR-007; NFR-001 | Release documentation: new `CHANGELOG.md` if no changelog exists at execution time, otherwise the repository's established changelog | An unreleased entry identifies optional title search, trim/case-insensitive substring behavior, combined-filter AND behavior, blank/repeated-input `400`, empty-match `200`, backward compatibility, and no dependency addition without claiming unverified outcomes. | `node -e "const fs=require('node:fs');const text=fs.readFileSync('CHANGELOG.md','utf8');if(!text.includes('TODO-SEARCH-NAME'))process.exit(1)"` | IP-006 | Blocked - IP-006 and Stage 4 approval |
| IP-008 | Prepare the Stage 8 pull-request handoff | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; NFR-001, NFR-002, NFR-003 | Git diff and history; `CHANGELOG.md`; `verification.md`; PR title/body and reviewer checklist (external metadata, not a required repository file) | The branch contains only approved story changes; diff is clean; PR draft content summarizes behavior and risk, links all requirements, cites test/audit evidence, states no dependencies or Playwright case, includes rollback and reviewer checks, and identifies any residual risk. No commit, push, or PR creation occurs without the separate explicit approval required by its stage. | `git diff --check; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git status --short --branch; git diff --stat` | IP-006, IP-007 | Blocked - IP-006, IP-007, Stage 8 authorization, and explicit approval before commit/push/PR publication |

## 3. Requirement and Acceptance Traceability

| Requirement | Implementation task(s) | Verification task/evidence | Planned status |
| --- | --- | --- | --- |
| FR-001 | IP-002, IP-003 | IP-002 HTTP valid-query and repeated-query cases; IP-006 | Planned |
| FR-002 | IP-002, IP-003 | IP-002 exact match plus trimmed, case-insensitive substring cases; IP-006 / AC-001, AC-002 | Planned |
| FR-003 | IP-002 | IP-002 combined `name`, `completed`, and `priority` case; IP-006 / AC-003 | Planned |
| FR-004 | IP-002 | IP-002 response envelope, count, todo field-set, and source-order assertions; IP-006 / AC-004 | Planned |
| FR-005 | IP-002 | IP-002 empty and whitespace-only `400` plus repeated non-scalar `400`; IP-006 / AC-005 | Planned |
| FR-006 | IP-002 | IP-002 no-match `200 { count: 0, todos: [] }`; IP-006 / AC-006 | Planned |
| FR-007 | IP-001, IP-002, IP-003 | IP-001 no-name baseline suite and IP-002 full regression; IP-006 / AC-007 | Planned |
| NFR-001 | IP-001, IP-002 | No-name baseline statuses, content, ordering, and existing filter validation; IP-006 / AC-007 | Planned |
| NFR-002 | IP-002 | Repeated identical HTTP requests assert identical status, count, and ordered todo content against unchanged data; IP-006 / AC-008 | Planned |
| NFR-003 | IP-002 | Every successful search asserts exact top-level members, count consistency, and unchanged todo fields; IP-006 / AC-004 | Planned |

All seven functional and three non-functional requirements map to implementation and executable verification. All eight acceptance criteria map to focused HTTP evidence. No task introduces persistence, sorting, pagination, description search, field changes, authentication, authorization, global error-handler changes, or other approved out-of-scope work.

## 4. Ordering Validation

1. IP-001 first creates a passing, dependency-free test command and captures the compatibility baseline required to detect regressions.
2. IP-002 then changes the owning controller and adds all search-specific HTTP evidence while retaining IP-001 coverage.
3. IP-003 documents only behavior made executable by IP-002.
4. IP-004 synchronizes traceability only after implementation, tests, and applicable route documentation exist.
5. IP-005 audits the resulting production dependency graph after implementation; it can follow IP-002 independently of documentation.
6. IP-006 is the convergence gate and cannot produce the verification handoff until implementation, documentation, traceability, tests, and audit are complete.
7. IP-007 records only verified behavior after IP-006.
8. IP-008 prepares the PR handoff only after verification and changelog completion.

No task precedes a prerequisite. The only parallel opportunity is IP-005 after IP-002 while IP-003 and IP-004 proceed; the listed table remains a valid dependency order.

## 5. Blocked Tasks and Unblockers

| Blocked task(s) | Blocker | Unblocker | Approval sensitivity |
| --- | --- | --- | --- |
| IP-001 through IP-005 | This Stage 4 plan is not yet explicitly approved. | User explicitly approves `impl-plan.md` for Stage 5 execution. | Required; approval authorizes implementation work but not dependencies or scope expansion. |
| IP-002 through IP-008 | Upstream task evidence is incomplete. | Complete each dependency with its exact validation command and update status/evidence before starting the dependent task. | No waiver by inference; failed evidence keeps downstream tasks blocked. |
| IP-006 | Stage 7 verification has not been authorized and IP-001 through IP-005 are incomplete. | Complete Stage 5/review prerequisites and explicitly enter Stage 7. | Required by SDLC stage boundary. |
| IP-008 commit, push, or PR publication | External/repository write action is not approved. | Obtain explicit user approval immediately before commit and again before any requested PR creation or update. | Required; preparing text and inspecting the diff do not authorize publication. |
| Any task requiring a new package, privileged access, destructive operation, architecture change, or scope expansion | No such change is approved or currently expected. | Stop, document the need and impact, and obtain explicit approval before proceeding; update approved design/plan first when material. | `Needs approval`. |

There are no unresolved technical blockers in the approved scope. The only current blocker is the Stage 4 approval gate. The expected dependency proposal is none.

## 6. Approval Gate

Does this implementation plan cover all approved scope? Any tasks to add, remove, or reorder before we begin coding?

After explicit approval, the Stage 4 artifact may be committed with:

```text
docs(impl-plan): task breakdown for TODO-SEARCH-NAME
```

No commit is authorized by creation of this plan alone.

## 7. Stage 5 Work Log

| Task | Falsifiable local hypothesis | Cheapest discriminating check | Result |
| --- | --- | --- | --- |
| IP-001 | The exported Express app supports an ephemeral native-HTTP harness that preserves current no-name listing and filter behavior without mutating the shared todo array. | `npm test -- --test-name-pattern="GET /todos baseline without name"` | Passed 2026-08-08: 5 tests passed, 0 failed; baseline status, content, order, teardown, and no-mutation assertions succeeded. |
| IP-002 | A presence-aware inline controller branch after existing filters will reject non-scalar or blank `name` values and produce stable, case-insensitive title substring results without changing no-name behavior or todo objects. | `npm test` | Passed 2026-08-08: 14 tests passed, 0 failed; all search acceptance and no-name compatibility cases succeeded. |
| IP-003 | One additional startup route-list line containing `GET    /todos?name=` will document the implemented query variant without altering listener startup or existing route entries. | `node -e "const fs=require('node:fs');const text=fs.readFileSync('server.js','utf8');if(!text.includes('GET    /todos?name='))process.exit(1)"` | Passed 2026-08-08 with exit code 0. |