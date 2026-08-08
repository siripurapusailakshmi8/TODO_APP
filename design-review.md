# TODO-SEARCH-NAME Design Review

| Field | Value |
| --- | --- |
| Story | `TODO-SEARCH-NAME` |
| Review stage | Stage 3: independent design review |
| Review date | 2026-08-08 |
| Requirements baseline | Approved `requirements.md`, commit `9e71632cf939aab6e3aa650451f3fc86df090da1` |
| Architecture baseline reviewed | `architecture.md`, commit `b2b35597fc9ab8ab90d6e0fd5b9fefac122c5dd3` |
| Review status | Complete; material findings resolved; awaiting explicit approval |
| Implementation status | Not reviewed or changed in this stage |

## 1. Review Scope and Evidence

This review was performed independently and skeptically against the two approved baselines. It covers requirement and acceptance-criterion traceability, correctness, security and trust boundaries, reliability, scalability and cost, operability, testability, maintainability, dependency risk, and API accessibility applicability.

Repository evidence inspected:

- `src/app.js`: Express JSON middleware, `/todos` mounting, explicit unknown-route `404`, and catch-all non-sensitive `500` response.
- `src/routes/todoRoutes.js`: `GET /todos` dispatch to `getAllTodos`.
- `src/controllers/todoController.js`: current `completed` and `priority` semantics, response envelope, and title validation on writes.
- `src/data/todos.js`: ordered process-local array and string title invariant in seed data.
- `server.js`: process startup and route surface.
- `package.json` and `package-lock.json`: Express 5.2.1, existing dependencies, and non-working test script.

Executable evidence:

- Installed Express is 5.2.1 and the app's query parser is `simple`.
- A runtime parser probe showed `?name=one&name=two` becomes `{ name: ["one", "two"] }`; empty and whitespace-only values remain strings.
- `npm audit --omit=dev --json` reported zero known production vulnerabilities across 69 production dependencies.
- The approved baseline commits exist and the pre-review worktree contained no file changes.

## 2. Review Summary

| Severity | Raised | Resolved | Accepted or deferred risk | Unresolved |
| --- | ---: | ---: | ---: | ---: |
| Critical | 0 | 0 | 0 | 0 |
| High | 0 | 0 | 0 | 0 |
| Medium | 3 | 3 | 0 | 0 |
| Low | 2 | 0 | 2 | 0 |
| **Total** | **5** | **3** | **2** | **0** |

No Critical or High findings remain. The architecture is suitable for approval after the documented Medium corrections. The Low items are bounded risks already represented by architecture decisions and do not block approval.

## 3. Findings

### Critical

None.

### High

None.

### Medium

#### DR-001: Free-text privacy classification was too strong

| Field | Detail |
| --- | --- |
| Category | Security, privacy, trust boundary |
| Evidence | Architecture section 6 originally stated that the feature requires no PII. The public `name` query and persisted todo titles are user-controlled free text, so callers can place personal or sensitive content in either value even though PII is not required by the feature. |
| Impact | Treating the values as categorically non-PII could justify unsafe request, query, or result logging and expose user-provided content through operational telemetry. |
| Recommendation | Distinguish "PII is not required" from "PII cannot occur" and prohibit logging raw `name` values and matching titles. |
| Disposition | Accepted and resolved in architecture sections 6 and 13. |
| Owner | Architecture owner |
| Resulting architecture decision | Query values and titles are potentially sensitive untrusted text and remain outside logs; no new logging dependency is introduced. |

#### DR-002: Parser-error status preservation was unsupported

| Field | Detail |
| --- | --- |
| Category | Correctness, reliability, error handling |
| Evidence | Architecture section 7 originally said query or transport parsing failures preserve framework status. The actual final middleware in `src/app.js` unconditionally returns `500` for every propagated error, including an error carrying a framework `4xx` status. The explicit unknown-route `404` and non-sensitive global `500` behavior otherwise exist as assumed. |
| Impact | The document promised error behavior the repository does not provide, which could create invalid tests or expand implementation scope into global middleware changes. |
| Recommendation | Record the current catch-all `500` behavior accurately and keep any global error-handler redesign outside this story. |
| Disposition | Accepted and resolved in architecture sections 7 and 13. |
| Owner | Architecture owner |
| Resulting architecture decision | Errors propagated to the existing global middleware receive its current non-sensitive `500`; the search design does not claim preservation of framework parser statuses. |

#### DR-003: Repeated query keys lacked a final public contract

| Field | Detail |
| --- | --- |
| Category | Correctness, API contract, input validation |
| Evidence | Requirements specify one optional `name` but do not define repetition. Express 5.2.1 with the app's default `simple` parser produces an array for repeated keys. The baseline architecture proposed rejecting non-scalars but left the point as requiring later clarification. |
| Impact | Without a final decision, implementations could throw on string operations, coerce arrays into comma-joined text, or choose first/last values inconsistently, violating determinism and interoperability. |
| Recommendation | Require `name` to be a string when present and return `400` for arrays or any other non-string parsed value. Record rejected coercion and value-selection alternatives. |
| Disposition | Accepted and resolved in architecture sections 11, 12, and 13. |
| Owner | Architecture owner |
| Resulting architecture decision | Repeated `name` keys are malformed input and return `400`; approval of the architecture approves this clarification of the otherwise unspecified edge case. |

### Low

#### DR-004: Linear search has a bounded-scope scalability risk

| Field | Detail |
| --- | --- |
| Category | Scalability, cost, reliability |
| Evidence | Search lowercases titles and scans the process-local array. The API can add todos, while the approved scope excludes pagination, persistence, indexes, and lifecycle changes. Existing list behavior already allocates response-sized data. |
| Impact | A substantially enlarged process-local dataset or unusually long titles would increase per-request CPU, allocation, response size, and latency. This is not material for the current three-item seed and approved in-memory scope. |
| Recommendation | Accept the linear scan for this story; require a future architecture review if the dataset becomes persistent, externally scaled, or operationally unbounded. |
| Disposition | Risk accepted; no architecture change beyond the existing section 12 risk statement. |
| Owner | Product/API owner |
| Resulting architecture decision | Keep the synchronous `O(n)` native scan and add no index, cache, pagination, or dependency in this story. |

#### DR-005: Automated acceptance evidence is not currently executable

| Field | Detail |
| --- | --- |
| Category | Testability, operability |
| Evidence | `package.json` defines `npm test` as an intentional failure and the repository has no working automated test command. NFR-001 through NFR-003 require repeatable acceptance evidence. |
| Impact | The design is testable, but the repository cannot currently demonstrate backward compatibility, determinism, or response consistency automatically. |
| Recommendation | Treat an executable focused acceptance check as a verification prerequisite; avoid a third-party framework unless repository-native facilities prove insufficient. |
| Disposition | Deferred to implementation verification and explicitly recorded in architecture sections 9 and 12; it does not block design approval. |
| Owner | Implementation and verification owner |
| Resulting architecture decision | Prefer the built-in `node:test` runner and add no design-stage dependency. |

## 4. Requirement Coverage

| Requirement | Architecture evidence | Review result |
| --- | --- | --- |
| FR-001 | Sections 3, 4, 11, and 12: existing route accepts optional parsed `name`; controller owns validation. | Covered |
| FR-002 | Sections 4, 7, 11, and 12: trim once, normalize case, use substring inclusion, preserve all matches. | Covered |
| FR-003 | Sections 4, 7, and 12: sequential stable filters implement AND semantics. | Covered |
| FR-004 | Sections 3, 4, 11, and 12: current store, final array, retained object fields, derived count. | Covered |
| FR-005 | Sections 4, 7, and 11: presence-aware string validation and blank-input `400` outside the list envelope. | Covered |
| FR-006 | Sections 4, 7, and 11: no match is `200` with `{ count: 0, todos: [] }`. | Covered |
| FR-007 | Sections 1, 4, 7, and 12: omitted `name` bypasses new logic and preserves existing filters. | Covered |
| NFR-001 | Sections 1, 7, 11, and 12: no-name route, status, validation, and content remain unchanged. | Covered |
| NFR-002 | Sections 1, 4, 7, and 12: synchronous pure filtering and stable source order for unchanged data. | Covered |
| NFR-003 | Sections 4, 11, and 12: one final array supplies `todos` and `count`; objects are not projected. | Covered |

All 10 FR/NFR items are mapped. No requirement is omitted or contradicted after the review corrections.

## 5. Acceptance-Criterion Coverage

| Criterion | Architecture evidence and verification target | Review result |
| --- | --- | --- |
| AC-001 | Sections 4 and 11 define trimmed case-normalized substring filtering and a `200` list response. | Covered |
| AC-002 | Sections 4, 7, and 11 explicitly trim before case-insensitive inclusion. | Covered |
| AC-003 | Sections 4 and 7 preserve completed/priority behavior and apply name to the filtered result. | Covered |
| AC-004 | Sections 4 and 11 derive `count` from the final array and retain todo objects and exact envelope members. | Covered |
| AC-005 | Sections 4, 7, and 11 reject whitespace-only input with `400` and an error envelope. | Covered |
| AC-006 | Sections 4, 7, and 11 classify no-match as successful empty collection. | Covered |
| AC-007 | Sections 1, 4, and 7 skip all name behavior when omitted and preserve existing validation order. | Covered |
| AC-008 | Sections 1 and 7 preserve source order and use deterministic synchronous operations for unchanged data. | Covered |

All eight acceptance criteria have architecture evidence and observable verification targets.

## 6. Quality Attribute Assessment

| Area | Assessment | Result |
| --- | --- | --- |
| Correctness | The controller remains the owning boundary; validation distinguishes omission, blank strings, and repeated keys; no-match semantics and filter composition match requirements. | Pass after DR-002 and DR-003 |
| Security and trust boundaries | Public query input is untrusted, type-checked, never evaluated or interpolated into another language, and treated as potentially sensitive. Authentication remains explicitly out of scope. | Pass after DR-001 |
| Reliability | The operation is synchronous, read-only, has no downstream partial failure, preserves order, and uses the existing hard-error boundary. Existing catch-all `500` behavior is now documented accurately. | Pass |
| Scalability and cost | Native linear scanning and result allocation are proportionate to the current in-memory scope; no new infrastructure or dependency cost is introduced. | Pass with accepted DR-004 risk |
| Operability | Existing `/health`, status classes, rollback, and non-sensitive `500` response remain available. High-cardinality query values are excluded from logs and metrics. | Pass |
| Testability | Every FR/NFR and acceptance criterion is observable; repeated-key and error cases are explicit. The missing executable test command remains a verification prerequisite. | Pass with deferred DR-005 risk |
| Maintainability | The design extends the existing controller with native operations and avoids a premature service, repository, schema library, or regex. | Pass |
| Dependency risk | No dependency is added. The existing production audit reported zero known vulnerabilities at review time; audit results are time-sensitive and not a permanent guarantee. | Pass |
| API accessibility applicability | No visual, keyboard, assistive-technology, or WCAG surface is introduced by this API-only story. Machine-readable JSON, stable HTTP statuses, and unchanged response members preserve consumer accessibility. | Not otherwise applicable |

## 7. Rejected Suggestions

| Suggestion | Disposition and rationale |
| --- | --- |
| Add schema-validation or search libraries. | Rejected. Native string type checks, `trim`, case conversion, `includes`, and stable array filtering satisfy the contract without dependency or semantic drift. |
| Add rate limiting, pagination, caching, persistence, or a search index. | Rejected for this story. These alter approved API, data, or deployment boundaries and are not justified by the current process-local dataset. |
| Change the application-wide error middleware to preserve framework `4xx` statuses. | Rejected from this story's scope. The discrepancy is now documented; changing unrelated global behavior would violate backward-compatibility constraints. |
| Coerce repeated values or select the first/last `name`. | Rejected. Silent coercion or selection creates undocumented behavior and weakens deterministic validation. |

## 8. Residual Risks and Approval Gate

- JavaScript default case conversion is deterministic but not full locale-aware collation; accepted because no locale-specific requirement exists.
- Search remains linear over a mutable in-memory collection; accepted for the approved scope.
- Existing global middleware converts propagated parser errors to `500`; unchanged because global error redesign is outside this story.
- Automated acceptance evidence cannot run until the repository has an executable focused test command; deferred to implementation verification.
- Dependency audit results reflect 2026-08-08 only and can change as advisories evolve.

No Critical or High finding remains. Approval authorizes the corrected architecture, including the `400` contract for repeated `name` keys. No commit may be created until explicit approval is received.

## 9. Approval

| Role | Decision | Date | Notes |
| --- | --- | --- | --- |
| Design reviewer | Recommend approval | 2026-08-08 | Three Medium findings resolved; two Low risks accepted or deferred. |
| Approver | Pending explicit approval | TBD | Approval is required before Stage 3 documents may be committed. |