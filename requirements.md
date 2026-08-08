# TODO-SEARCH-NAME Requirements

## Context

The `GET /todos` endpoint currently returns todos from the current in-memory dataset and supports optional `completed` and `priority` filters. Story `TODO-SEARCH-NAME` adds an optional `name` query parameter so API consumers can find todos by their existing `title`. The feature must preserve the endpoint's current response shape and behavior when `name` is not supplied.

In the source story, "nwp" is interpreted as "for now" and does not introduce a separate product term or behavior.

## Assumptions

| ID | Assumption | Risk |
| --- | --- | --- |
| A-001 | The story shorthand "nwp" means "for now." | If the shorthand was intended to carry another meaning, the scope may be incomplete. |
| A-002 | The requested todo "name" maps to the existing todo `title`; no new data field is introduced. | Consumers expecting a distinct `name` field would not receive one. |
| A-003 | Search applies only to the current in-memory todo dataset available to `GET /todos` at request time. | Results reset or change with the existing in-memory lifecycle. |
| A-004 | Existing `completed` and `priority` query behavior is the compatibility baseline and is not changed by this story. | Any pre-existing filter behavior or limitation remains. |
| A-005 | Repository Markdown files are the documentation system of record for this story. | Requirements may not be visible in external tracking systems unless linked later. |
| A-006 | No special legal, regulatory, accessibility, or compliance requirement applies to this API-only change. | A later compliance requirement could add validation, logging, or evidence obligations. |

## Functional Requirements

| ID | Requirement | Priority | Source |
| --- | --- | --- | --- |
| FR-001 | `GET /todos` shall accept an optional `name` query parameter. | Must | Confirmed D3 |
| FR-002 | When `name` is supplied with a non-blank value, the endpoint shall trim leading and trailing whitespace and return only todos whose existing `title` contains the trimmed value, using case-insensitive substring matching. | Must | Confirmed D2, D4 |
| FR-003 | When `name` is combined with `completed` and/or `priority`, a todo shall be returned only when it satisfies every supplied filter. | Must | Confirmed D5 |
| FR-004 | Search shall evaluate the current in-memory dataset and preserve the response shape `{ count, todos }`, where `count` equals the number of todos in `todos`. | Must | Confirmed D6 |
| FR-005 | When `name` is present but becomes empty after trimming, the endpoint shall return HTTP `400` and shall not return a successful todo list. | Must | Confirmed D7 |
| FR-006 | When no todo title matches a valid `name`, the endpoint shall return HTTP `200` with `{ count: 0, todos: [] }`. | Must | Confirmed D7 |
| FR-007 | When `name` is omitted, `GET /todos` shall preserve its current behavior, including existing `completed` and `priority` filtering and validation behavior. | Must | Confirmed D7, D9 |

## Non-Functional Requirements

| ID | Requirement | Metric | Priority |
| --- | --- | --- | --- |
| NFR-001 | The change shall remain backward compatible for requests that omit `name`. | All acceptance tests representing existing `GET /todos` behavior without `name` pass with unchanged HTTP status and response content. | Must |
| NFR-002 | Search results shall be deterministic for an unchanged in-memory dataset and identical query inputs. | 100% of repeated requests in automated acceptance tests return the same status, `count`, and ordered `todos` content while the dataset is unchanged. | Must |
| NFR-003 | The endpoint shall maintain response consistency when search is used. | 100% of successful search responses satisfy `count === todos.length` and retain each returned todo's existing field set. | Must |

## Acceptance Criteria

| ID | Requirement IDs | Observable acceptance criterion |
| --- | --- | --- |
| AC-001 | FR-001, FR-002 | Given todos with titles `Buy groceries`, `Read a book`, and `Morning workout`, when `GET /todos?name=book` is requested, the response is HTTP `200` and contains only the todo titled `Read a book`. |
| AC-002 | FR-002 | Given a todo titled `Buy groceries`, when `GET /todos?name=%20GROCER%20` is requested, the response is HTTP `200` and includes `Buy groceries`, demonstrating trimming, case insensitivity, and substring matching. |
| AC-003 | FR-003 | Given matching and non-matching combinations in the dataset, when `name`, `completed`, and `priority` are supplied together, every returned todo satisfies the title search and both existing filters, and no todo failing any supplied filter is returned. |
| AC-004 | FR-004, NFR-003 | For every successful request using `name`, the response body has exactly the established top-level members `count` and `todos`, `count` equals `todos.length`, and returned todo objects retain their existing fields. |
| AC-005 | FR-005 | When `GET /todos?name=%20%20%20` is requested, the response is HTTP `400` and is not a successful `{ count, todos }` list response. |
| AC-006 | FR-006 | When a valid `name` matches no title, the response is HTTP `200` with `{ count: 0, todos: [] }`. |
| AC-007 | FR-007, NFR-001 | Existing acceptance cases for `GET /todos` without `name`, including no filters and supported or invalid existing filters, produce unchanged statuses and response content. |
| AC-008 | NFR-002 | Repeating the same valid search request against an unchanged dataset produces the same status, `count`, and ordered `todos` content on every run. |

## Error And Edge-Case Behavior

| Condition | Expected behavior | Requirement IDs |
| --- | --- | --- |
| `name` is omitted | Preserve current `GET /todos` behavior. | FR-007, NFR-001 |
| `name` is present but empty or whitespace-only after trimming | Return HTTP `400`; do not treat it as an omitted filter. | FR-005 |
| `name` differs from a title only by letter case | Treat it as a match when the title contains the search value. | FR-002 |
| `name` has leading or trailing whitespace | Trim the search value before matching. | FR-002 |
| A valid `name` matches no title | Return HTTP `200` with `{ count: 0, todos: [] }`. | FR-006 |
| `name` is combined with `completed` and/or `priority` | Apply AND semantics across all supplied filters. Existing validation behavior for those filters remains unchanged. | FR-003, FR-007 |
| Multiple todos match `name` | Return every matching todo from the current dataset and report the matching total in `count`. | FR-002, FR-004 |

## Out Of Scope

- Authentication or authorization changes.
- Persistence, database, or in-memory lifecycle changes.
- Pagination or sorting.
- Searching todo descriptions or fields other than the existing `title`.
- Todo deletion behavior changes.
- Adding or renaming todo data fields.
- Changes to existing `completed` or `priority` filter semantics.
- Special compliance behavior or evidence.
- Architecture, implementation design, and test framework selection.

## Traceability Seed

| Requirement ID | Architecture component | Test file | Status |
| --- | --- | --- | --- |
| FR-001 | TBD | TBD | Specified |
| FR-002 | TBD | TBD | Specified |
| FR-003 | TBD | TBD | Specified |
| FR-004 | TBD | TBD | Specified |
| FR-005 | TBD | TBD | Specified |
| FR-006 | TBD | TBD | Specified |
| FR-007 | TBD | TBD | Specified |
| NFR-001 | TBD | TBD | Specified |
| NFR-002 | TBD | TBD | Specified |
| NFR-003 | TBD | TBD | Specified |