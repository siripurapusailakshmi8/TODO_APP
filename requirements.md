# Requirements: Search Todos by Title

## 1. Story

Implement a search-by-name route API for the TODO_APP that allows clients to filter todos by title using a query parameter, consistent with existing filter patterns (`?completed`, `?priority`).

---

## 2. Functional Requirements

### FR-001: Search Endpoint via Query Parameter

The API shall extend the existing `GET /todos` endpoint to support an optional `?title=<string>` query parameter.

**Acceptance Criteria:**
- `GET /todos?title=buy` returns all todos whose title contains "buy" (case-insensitive)
- Request with no title parameter returns all todos (existing behavior unchanged)
- Request with empty title parameter (`?title=`) returns 400 Bad Request with error message
- Response format matches existing `GET /todos` response: `{ count: N, todos: [...] }`

**Traceability:** Test-001, Test-002, Test-003, Test-004

---

### FR-002: Case-Insensitive Partial Matching

The search shall perform case-insensitive partial (substring/contains) matching on todo titles.

**Acceptance Criteria:**
- `?title=groceries` matches todos with titles: "Buy groceries", "GROCERIES LIST", "groceries store"
- Matching is language-agnostic and uses JavaScript `String.toLowerCase().includes()`
- No regex or special character interpretation (e.g., `?title=buy*` searches for literal "buy*")

**Traceability:** Test-005, Test-006

---

### FR-003: Combined Filtering

The title search shall be combinable with existing `?completed` and `?priority` filters.

**Acceptance Criteria:**
- `GET /todos?title=review&completed=true&priority=high` returns high-priority completed todos with "review" in title
- Filters apply with AND logic (all conditions must match)
- Existing filter validation rules remain unchanged

**Traceability:** Test-007, Test-008

---

### FR-004: Error Handling for Invalid Search

The endpoint shall validate and reject malformed requests.

**Acceptance Criteria:**
- `GET /todos?title=` (empty string) returns HTTP 400 with error: `"title filter must be a non-empty string if provided"`
- `GET /todos?title=null` or `?title=undefined` (literal strings) are accepted and search for those strings (no special parsing)
- URL-encoded special characters (e.g., `?title=buy%20milk`) are decoded and searched correctly
- No limit on query string length (defer to web server defaults)

**Traceability:** Test-009, Test-010, Test-011

---

## 3. Non-Functional Requirements

### NFR-001: Response Performance

The search shall return results within 50ms for up to 1,000 todos in the in-memory store.

**Acceptance Criteria:**
- Measured on the deployment environment (Node.js v16+)
- Performance test confirms median response time ≤ 50ms
- No database indexing required (in-memory linear scan acceptable for MVP)

**Traceability:** Perf-Test-001

---

### NFR-002: Backward Compatibility

The new query parameter shall not break existing API behavior or clients.

**Acceptance Criteria:**
- Existing `GET /todos` (no params) works unchanged
- Existing `GET /todos?completed=true` works unchanged
- Existing `GET /todos?priority=high` works unchanged
- No changes to response schema, HTTP status codes, or error message formats for existing queries

**Traceability:** Regression-Test-001

---

### NFR-003: Code Quality and Maintainability

Implementation shall follow existing codebase patterns and standards.

**Acceptance Criteria:**
- Search logic resides in `todoController.js` alongside other filters
- Filter logic is declarative and testable (pure function pattern)
- Code review passes SOLID principles checklist
- No external dependencies added (use built-in JavaScript `String.includes()`)

**Traceability:** Code-Review-001

---

## 4. Assumptions

### A-001: Search Scope
Search applies to the `title` field only; description field is excluded from search to reduce complexity.

### A-002: Stateless API
The in-memory todos array is the single source of truth; no persistence layer query optimization is required.

### A-003: No Authentication
Existing endpoints have no authentication; search inherits this behavior (no new auth layer).

### A-004: Natural Sort Order
Results are returned in the order they appear in the todos array (creation order by default); no explicit sorting is required.

### A-005: No Pagination
MVP returns all matching results in a single response; pagination is deferred to a future enhancement.

### A-006: URL Encoding
Clients are responsible for URL-encoding search queries; the server decodes via Express built-in middleware.

---

## 5. Edge Cases

### E-001: Empty Search Query
**Scenario:** `GET /todos?title=`  
**Handling:** Reject with HTTP 400 and error message; empty title filter is invalid.

### E-002: Whitespace-Only Query
**Scenario:** `GET /todos?title=   ` (only spaces)  
**Handling:** Treat as literal spaces; search for todos with spaces in title. If intended for "no filter," request must omit `?title` parameter.

### E-003: Special Characters in Title
**Scenario:** Todo with title "Buy [milk & eggs]"; search `?title=&`  
**Handling:** Search for literal "&" character (no regex interpretation). Match succeeds if todo title contains "&".

### E-004: Very Long Search Query
**Scenario:** `GET /todos?title=<100KB string>`  
**Handling:** Accept and search; rely on web server request size limits (default Express ~100KB). No application-level truncation.

### E-005: Unicode and Emoji
**Scenario:** Todo with title "🛒 Shopping"; search `?title=🛒`  
**Handling:** Case-insensitive match works with Unicode/emoji via JavaScript `.includes()`; search succeeds.

### E-006: Zero Results
**Scenario:** `GET /todos?title=nonexistent`  
**Handling:** Return HTTP 200 with `{ count: 0, todos: [] }` (no error state for empty results).

---

## 6. Non-Goals

- **Full-text search:** No stemming, lemmatization, or linguistic analysis.
- **Regex support:** Query strings are treated as literal text only.
- **Relevance ranking:** Results are not ranked by match quality or frequency.
- **Faceted search:** No counts by status/priority/etc.
- **Autocomplete/suggestions:** No prefix completion or did-you-mean hints.
- **Pagination:** MVP does not paginate results; future enhancement.
- **Search indexing:** No pre-built index; linear scan is acceptable.

---

## 7. Requirement-to-Test Traceability

| Requirement | Test ID | Test Description |
|-------------|---------|------------------|
| FR-001 | Test-001 | `GET /todos?title=buy` returns matching todos |
| FR-001 | Test-002 | `GET /todos` with no title param returns all (unchanged) |
| FR-001 | Test-003 | Response includes count and todos array |
| FR-001 | Test-004 | Empty title param returns 400 error |
| FR-002 | Test-005 | Case-insensitive matching (uppercase vs. lowercase) |
| FR-002 | Test-006 | Partial substring match (contains) |
| FR-003 | Test-007 | Combined title + completed filter |
| FR-003 | Test-008 | Combined title + priority filter |
| FR-004 | Test-009 | Empty string title filter rejected with 400 |
| FR-004 | Test-010 | URL-encoded characters decoded correctly |
| FR-004 | Test-011 | Literal null/undefined strings searched |
| NFR-001 | Perf-Test-001 | Response time ≤ 50ms for 1K todos |
| NFR-002 | Regression-Test-001 | Existing queries work unchanged |
| NFR-003 | Code-Review-001 | SOLID principles and pattern compliance |

---

## 8. Approved Design Decisions

The following architectural decisions have been applied based on existing API patterns:

1. **Endpoint:** `GET /todos?title=<query>` (query parameter, consistent with `?completed` and `?priority`)
2. **Search Field:** Title only (focused scope, aligns with feature name "search by name")
3. **Match Type:** Case-insensitive partial (contains) — user-friendly substring matching
4. **Sort Order:** Maintained as-is (creation order, natural array order)
5. **Pagination:** None for MVP (return all results)
6. **Filter Composition:** Yes, combinable with existing filters via AND logic
7. **Query Length:** No artificial limit (respect web server defaults)
8. **Case Sensitivity:** Case-insensitive via `.toLowerCase().includes()`

---