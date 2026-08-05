# Requirements - TODO-SEARCH-001: Search Todos by Name

## Context
Consumers need a read-only API that finds existing todos by a supplied name fragment. The repository currently exposes todo APIs under `/todos`, stores the searchable text in each todo's `title`, and returns todo collections in a `{ count, todos }` envelope.

## Assumptions
| ID | Assumption | Risk if Wrong |
|---|---|---|
| A-001 | The requested `name` search applies only to the todo `title`; descriptions and other fields are not searched. | Results may omit todos that users expected to find through other fields. |
| A-002 | Leading and trailing whitespace is ignored before validating and matching the `name` value. | Clients may observe different matching behavior than expected for whitespace-padded input. |
| A-003 | Search results preserve the current order of todos in the repository's in-memory collection. | Consumers may expect a different or explicitly sorted result order. |
| A-004 | The existing JSON error envelope (`{ error: <message> }`) is retained; the exact validation message is TBD. | Clients that depend on exact error text cannot finalize their contract yet. |
| A-005 | No explicit latency, throughput, or result-size target is required for this dummy in-memory API. | A future production data source may require pagination or measurable performance targets. |

## Functional Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-001 | The service shall expose `GET /todos/search?name=<text>`. | Must | User request |
| FR-002 | The search endpoint shall treat `name` as one required query value and return HTTP 400 when it is missing, blank after trimming, or represented by multiple/repeated query values rather than a single string value. | Must | User request |
| FR-003 | The search endpoint shall perform a case-insensitive partial match between the validated `name` value and each todo's `title`. | Must | User request |
| FR-004 | A successful search shall return HTTP 200 with the existing list envelope `{ count, todos }`, where `count` equals the number of returned todos. | Must | User request and repository behavior |
| FR-005 | A valid search with no matches shall return HTTP 200 with `{ count: 0, todos: [] }`. | Must | User request |
| FR-006 | The literal `/todos/search` path shall be resolved as the search endpoint and shall not be handled as the `GET /todos/:id` endpoint. | Must | User request and repository behavior |
| FR-007 | Searching shall not create, update, delete, reorder, or otherwise mutate stored todos. | Must | User request |

## Non-Functional Requirements
| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | The change shall preserve the existing API's authentication posture. | No authentication mechanism is added or changed. | Must |
| NFR-002 | The change shall not introduce runtime or development dependencies. | Dependency declarations remain unchanged. | Must |
| NFR-003 | Focused automated tests shall cover the search endpoint's success, validation, no-match, case-insensitive partial-match, response-envelope, route-resolution, and read-only behavior. | Every acceptance criterion for FR-001 through FR-007 has automated test evidence; test framework and test file are TBD. | Must |

## Acceptance Criteria
- FR-001: Given the application is running, when a client sends `GET /todos/search?name=book`, then the request reaches the todo search capability.
- FR-002: Given `name` is omitted, empty, whitespace-only, or repeated (for example, `?name=book&name=work`), when the client calls the endpoint, then the response is HTTP 400 with the existing JSON error envelope.
- FR-003: Given todos titled `Read a book` and `Morning workout`, when the client searches for `BOOK` or `read`, then `Read a book` is returned; matching does not depend on letter case and does not require the full title.
- FR-004: Given one or more matching todos, when the search succeeds, then the response is HTTP 200 and its JSON body has `count` equal to `todos.length`, with only matching todos in `todos`.
- FR-005: Given no title contains the validated search text, when the search succeeds, then the response is HTTP 200 with exactly the empty collection values `count: 0` and `todos: []`.
- FR-006: Given a request to `/todos/search` with a valid `name`, when routes are resolved, then the response is produced by the search endpoint and is not a 404 `Todo not found` response from ID lookup.
- FR-007: Given any valid or invalid search request, when the request completes, then a subsequent todo listing contains the same todos in the same order and with unchanged field values.
- NFR-001: The endpoint is usable under the same unauthenticated conditions as the existing todo endpoints, with no new authentication behavior.
- NFR-002: The repository's runtime and development dependency declarations are unchanged by the feature.
- NFR-003: Focused automated tests exercise every acceptance criterion above and pass in the repository's test workflow; the workflow is TBD because no test runner is currently configured.

## Error and Edge-Case Behaviour
| Scenario | Expected Behaviour |
|---|---|
| `name` is missing | Return HTTP 400 with `{ error: <message> }`; exact message is TBD. |
| `name` is empty or whitespace-only | Return HTTP 400 with `{ error: <message> }`; exact message is TBD. |
| `name` is repeated or otherwise not represented as one string query value | Return HTTP 400 with `{ error: <message> }`; exact message is TBD. |
| Search text differs only by case | Match as though both the search value and title used the same letter case. |
| Search text is only part of a title | Return the todo as a match. |
| No todos match | Return HTTP 200 with `{ count: 0, todos: [] }`. |
| Todo repository is empty | Return HTTP 200 with `{ count: 0, todos: [] }`. |
| Unexpected internal failure | Preserve the repository's existing HTTP 500 JSON error behavior. |

## Out of Scope
- Searching todo descriptions, priorities, completion state, IDs, or timestamps.
- Fuzzy matching, relevance ranking, sorting, pagination, or highlighting.
- Changes to existing create, update, toggle, delete, list, or ID lookup contracts.
- Authentication, authorization, persistence, external services, or new dependencies.
- Architecture, implementation, deployment, or production-readiness work.

## Traceability Seed
| FR/NFR ID | Architecture Component | Test File | Status |
|---|---|---|---|
| FR-001 | src/routes/todoRoutes.js, src/controllers/todoController.js | test/todoSearch.test.js | Verified |
| FR-002 | src/controllers/todoController.js | test/todoSearch.test.js | Verified |
| FR-003 | src/controllers/todoController.js | test/todoSearch.test.js | Verified |
| FR-004 | src/controllers/todoController.js | test/todoSearch.test.js | Verified |
| FR-005 | src/controllers/todoController.js | test/todoSearch.test.js | Verified |
| FR-006 | src/routes/todoRoutes.js | test/todoSearch.test.js | Verified |
| FR-007 | src/controllers/todoController.js | test/todoSearch.test.js | Verified |
| NFR-001 | src/app.js, src/routes/todoRoutes.js | test/todoSearch.test.js | Verified |
| NFR-002 | package.json | N/A (structural review) | Verified |
| NFR-003 | package.json (scripts.test) | test/todoSearch.test.js | Verified |

## Approval Status
Approved by user (commit `54f85fd`). Implementation complete and verified (Stage 5).