# Requirements - TODO-001: Search Todos by Name

## Context
The TODO REST API currently supports filtering by `completed` status and `priority` level.
Users need the ability to find todos by a name/title keyword so they can quickly locate specific items without scrolling through all results.

## Assumptions
| ID | Assumption | Risk if Wrong |
|---|---|---|
| A-001 | "Name" refers to the `title` field on a todo item. | Search returns wrong/no results if description should also be searched. |
| A-002 | The search is implemented as a query param `?name=` on the existing `GET /todos` endpoint rather than a new dedicated endpoint. | If a new route is required, the route file needs additional changes. |
| A-003 | Matching is case-insensitive substring match (e.g., `"buy"` matches `"Buy groceries"`). | If exact or prefix match is required, filter logic must change. |
| A-004 | An empty or whitespace-only `?name=` value is rejected with HTTP 400. | If silent-ignore is preferred, validation block is removed. |
| A-005 | The filter composes with existing `?completed=` and `?priority=` filters. | Interaction between filters would need explicit precedence rules otherwise. |

## Functional Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-001 | `GET /todos?name=<term>` shall return only todos whose `title` contains `<term>` (case-insensitive substring). | Must | Story |
| FR-002 | The `?name=` filter shall compose with `?completed=` and `?priority=` (all active filters are AND-combined). | Must | Story |
| FR-003 | If no todos match the search term, the endpoint shall return HTTP 200 with `{ "count": 0, "todos": [] }`. | Must | Story |
| FR-004 | If `?name=` is provided with an empty or whitespace-only value, the API shall return HTTP 400 with a descriptive error message. | Should | A-004 |
| FR-005 | The startup log printed by `server.js` shall advertise the new `?name=` query parameter. | Should | Story |

## Non-Functional Requirements
| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | Search response time shall not regress from the existing list endpoint. | p99 < 50 ms on ≤ 1 000 in-memory items. | Should |
| NFR-002 | Search input shall not be evaluated as a regex or executed as code (no ReDoS vulnerability). | Static string `.includes()` or equivalent safe method. | Must |

## Acceptance Criteria
- **FR-001**: `GET /todos?name=buy` returns only todos whose `title` contains "buy" (case-insensitive); other todos are excluded.
- **FR-002**: `GET /todos?name=work&priority=high` returns only todos matching both conditions.
- **FR-003**: `GET /todos?name=nonexistent` returns `{ "count": 0, "todos": [] }` with HTTP 200.
- **FR-004**: `GET /todos?name=` (empty string) returns HTTP 400 with `{ "error": "..." }`.
- **FR-005**: Server startup console output includes a line for `GET /todos?name=<string>`.

## Error and Edge-Case Behaviour
| Scenario | Expected Behaviour |
|---|---|
| `?name=` with empty string | HTTP 400 — `name query parameter must not be empty` |
| `?name=` with whitespace only | HTTP 400 — same as empty string |
| `?name=` with special characters (e.g., `&`, `%`) | URL-decoded by Express; treated as plain substring — no error |
| No todos match | HTTP 200 with `{ "count": 0, "todos": [] }` |
| `?name=` omitted entirely | Existing behaviour preserved — all todos returned (unfiltered by name) |
| `?name=` combined with invalid `?priority=` | HTTP 400 from the existing priority validator (priority checked first) |

## Out of Scope
- Full-text search across multiple fields (description, notes, tags).
- Fuzzy / phonetic matching.
- Persistent storage or database integration.
- Authentication or per-user search results.
- A dedicated `GET /todos/search` endpoint.

## Traceability Seed
| FR/NFR ID | Architecture Component | Test File | Status |
|---|---|---|---|
| FR-001 | `src/controllers/todoController.js` — `getAllTodos` | TBD | Open |
| FR-002 | `src/controllers/todoController.js` — `getAllTodos` | TBD | Open |
| FR-003 | `src/controllers/todoController.js` — `getAllTodos` | TBD | Open |
| FR-004 | `src/controllers/todoController.js` — `getAllTodos` | TBD | Open |
| FR-005 | `server.js` | TBD | Open |
| NFR-001 | In-memory filter | TBD | Open |
| NFR-002 | `src/controllers/todoController.js` | TBD | Open |
