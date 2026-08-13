# Architecture: Search Todos by Title API

## 1. Overview

Extend the existing `GET /todos` endpoint to support case-insensitive partial title matching via the `?title=<query>` query parameter. The search integrates seamlessly with existing filters (`?completed`, `?priority`) using AND logic composition.

The approved source is `requirements.md`.

---

## 2. System Responsibilities

### 2.1 Handler: `getAllTodos` in `src/controllers/todoController.js`

**Current Behavior:**
- Accepts query parameters: `?completed`, `?priority`
- Returns all todos or filtered subset: `{ count: N, todos: [...] }`

**New Responsibility:**
- Accept and validate optional `?title` query parameter
- Apply title filter (case-insensitive substring match) to results
- Compose title filter with existing completed/priority filters using AND logic

### 2.2 Validation Layer

**Responsibility:** Validate query parameters before processing.

**Rules:**
- `title` parameter (if provided) must be a non-empty string after trimming
- `title=` (empty after decoding) → reject with HTTP 400
- `title=   ` (whitespace only) → accept and search for literal spaces
- Other parameters (`completed`, `priority`) retain existing validation

### 2.3 Filter Composition

**Responsibility:** Apply all active filters sequentially.

**Flow:**
```
todos → filter by completed (if provided) → filter by priority (if provided) → filter by title (if provided) → return result
```

**Logic:** AND composition (all conditions must match)

---

## 3. Data Flow Diagram

```mermaid
graph LR
    A["GET /todos<br/>?title=buy<br/>&completed=true"] -->|Express middleware<br/>URL decode| B["req.query object<br/>{title: 'buy', completed: 'true'}"]
    B -->|getAllTodos handler| C["Validate<br/>title parameter"]
    C -->|Valid| D["Clone todos array"]
    D -->|Filter: completed| E["Filter: priority"]
    E -->|Filter: title<br/>toLowerCase().includes| F["Filtered result"]
    F -->|Format response| G["{count: N, todos: []}"]
    G -->|HTTP 200| H["Client receives<br/>matching todos"]
    
    C -->|Invalid<br/>empty title| I["HTTP 400<br/>Error response"]
```

---

## 4. API Contract

### 4.1 GET /todos with Title Filter

#### Request

```http
GET /todos?title=buy&completed=false&priority=high HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**Query Parameters:**
- `title` (optional): Case-insensitive substring to search in todo titles
  - Must be non-empty if provided
  - URL-encoded special characters decoded automatically
  - Example: `title=Buy%20groceries` → searches for "Buy groceries"
  
- `completed` (optional, existing): `true` or `false`
- `priority` (optional, existing): `low`, `medium`, or `high`

#### Response

**Success (HTTP 200):**
```json
{
  "count": 2,
  "todos": [
    {
      "id": "uuid-1",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "priority": "high",
      "createdAt": "2026-08-13T10:00:00.000Z",
      "updatedAt": "2026-08-13T10:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "title": "Buy kitchen supplies",
      "description": "",
      "completed": false,
      "priority": "high",
      "createdAt": "2026-08-13T10:05:00.000Z",
      "updatedAt": "2026-08-13T10:05:00.000Z"
    }
  ]
}
```

**Empty Results (HTTP 200):**
```json
{
  "count": 0,
  "todos": []
}
```

**Validation Error (HTTP 400):**
```json
{
  "error": "title filter must be a non-empty string if provided"
}
```

**Existing Errors (HTTP 400, unchanged):**
```json
{
  "error": "priority must be one of: low, medium, high"
}
```

---

## 5. Handler Implementation Pattern

### Current Pattern (Existing Code)

```javascript
const getAllTodos = (req, res) => {
  let result = [...todos];

  if (req.query.completed !== undefined) {
    const flag = req.query.completed === 'true';
    result = result.filter((t) => t.completed === flag);
  }

  if (req.query.priority) {
    if (!VALID_PRIORITIES.includes(req.query.priority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    result = result.filter((t) => t.priority === req.query.priority);
  }

  res.json({ count: result.length, todos: result });
};
```

### New Responsibility Integration

Insert title filter after priority filter:

```javascript
const getAllTodos = (req, res) => {
  let result = [...todos];

  // Existing completed filter
  if (req.query.completed !== undefined) {
    const flag = req.query.completed === 'true';
    result = result.filter((t) => t.completed === flag);
  }

  // Existing priority filter
  if (req.query.priority) {
    if (!VALID_PRIORITIES.includes(req.query.priority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    result = result.filter((t) => t.priority === req.query.priority);
  }

  // NEW: Title filter
  if (req.query.title !== undefined) {
    const titleQuery = String(req.query.title).trim();
    if (titleQuery === '') {
      return res.status(400).json({ error: 'title filter must be a non-empty string if provided' });
    }
    const titleLower = titleQuery.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(titleLower));
  }

  res.json({ count: result.length, todos: result });
};
```

**Rationale:**
- Follows existing filter pattern (linear composition, no external dependencies)
- Uses built-in JavaScript `String.toLowerCase()` and `.includes()`
- Trim applied to handle trailing spaces (user intent: no filter if empty)
- Type coercion via `String()` handles edge cases (e.g., `?title=123`)

---

## 6. Validation Rules

### 6.1 Title Parameter Validation

| Input | Validation | Action | Response |
|-------|-----------|--------|----------|
| Omitted | ✓ Valid | No title filter applied | HTTP 200, all todos |
| `?title=` | ✗ Invalid | Reject | HTTP 400, "title filter must be a non-empty string if provided" |
| `?title=   ` | ✓ Valid (after trim: empty) | ✗ Reject | HTTP 400 |
| `?title=buy` | ✓ Valid | Search for "buy" (case-insensitive) | HTTP 200, filtered todos |
| `?title=Buy%20Milk` | ✓ Valid (decoded to "Buy Milk") | Search for "Buy Milk" | HTTP 200, filtered todos |
| `?title=buy&title=milk` | ✓ Valid (last value wins per Express behavior) | Search for "milk" only | HTTP 200, filtered by "milk" |

### 6.2 Composition with Existing Validators

**No changes to existing validation:**
- `?completed` accepts `'true'` or `'false'` only
- `?priority` must be one of `['low', 'medium', 'high']`

**New rule:** If title provided, it must be non-empty after trim.

**AND Logic:** All provided filters must match (if completed=false AND priority=high, only return items matching both conditions).

---

## 7. Error Handling

### 7.1 HTTP Status Codes

| Scenario | Status | Body |
|----------|--------|------|
| Search successful (results or empty) | 200 OK | `{ count: N, todos: [...] }` |
| Invalid title (empty string) | 400 Bad Request | `{ error: "title filter must be a non-empty string if provided" }` |
| Invalid priority (existing check) | 400 Bad Request | `{ error: "priority must be one of: ..." }` |
| Invalid completed (existing check, if added) | 400 Bad Request | `{ error: "..." }` |

### 7.2 Error Message Strategy

**New error for title filter:**
- Message: `"title filter must be a non-empty string if provided"`
- Reason: Signals that title parameter is invalid only when explicitly provided and empty
- Consistency: Matches existing error message style (parameter name + constraint)

---

## 8. Performance Considerations

### 8.1 Time Complexity

- **Current:** O(n) per filter applied (linear scan through todos array)
- **With title filter:** O(n) (additional linear scan, no degradation model)
- **Combined filters:** O(n) (filters are composed sequentially; each applied once)

### 8.2 Performance Target

**Requirement:** NFR-001 specifies ≤50ms response time for 1,000 todos

**Justification:**
- JavaScript `String.toLowerCase().includes()` is highly optimized (V8 engine)
- In-memory array scan (no I/O, no network latency)
- Linear algorithm acceptable for 1,000–10,000 todos in Node.js

**Measurement:** Performance test to confirm ≤50ms median response time with 1,000 test todos

### 8.3 Scalability Notes

- **If todos exceed 10,000:** Consider database indexing or full-text search (future enhancement)
- **If search becomes bottleneck:** Implement single-pass multi-filter composition (future optimization)
- **Current MVP scope:** In-memory linear scan is adequate

---

## 9. Deployment and Rollback

### 9.1 Deployment Strategy

1. **Code Change:** Modify `src/controllers/todoController.js` handler only
2. **No Database Migration:** In-memory store requires no schema changes
3. **No Config Changes:** No new environment variables or settings
4. **No Route Changes:** Existing `GET /todos` route; new behavior via optional query parameter
5. **Backward Compatible:** Clients not using `?title` see no change in behavior

### 9.2 Rollback Strategy

**If title filter introduces regression:**
1. Revert `src/controllers/todoController.js` to previous version
2. Restart Node.js server (no data loss, in-memory store persists during restart)
3. All requests immediately skip title filter validation and processing
4. No cleanup required; no persistent state to undo

**Rollback Impact:** Requests with `?title` will be ignored (title parameter discarded), returning all matching todos (if other filters present) or all todos (if only title provided). Existing clients using `?title` will see different results but no errors.

---

## 10. Architectural Decision Records (ADRs)

### ADR-001: Query Parameter vs. Separate Endpoint

**Decision:** Use query parameter (`?title=`) rather than separate endpoint (e.g., `GET /todos/search`).

**Rationale:**
- **Consistency:** Existing filters (`?completed`, `?priority`) use query parameters
- **Composability:** Easier to combine with other filters (e.g., `?title=buy&priority=high`)
- **Simplicity:** No need for additional route definition or handler routing

**Alternatives Considered:**
- Separate endpoint `GET /todos/search?query=` → adds complexity, breaks composition pattern
- Path-based `GET /todos/search/buy` → poor for combined filters, special character handling

**Consequences:**
- Single handler entry point; filter composition is linear
- Query parameter name `title` matches feature name ("search by name")
- No additional route documentation needed; follows existing pattern

**Traceability:** FR-001

---

### ADR-002: Case-Insensitive Partial Matching

**Decision:** Use case-insensitive substring (partial) matching via `String.toLowerCase().includes()`.

**Rationale:**
- **User-Friendly:** Users expect `?title=buy` to match "Buy groceries" (different casing)
- **Flexible:** Partial match allows discovering items without knowing exact title
- **Simple:** No regex parsing, special character handling, or linguistic analysis required

**Alternatives Considered:**
- Exact match only → users must know exact title (poor UX)
- Case-sensitive partial → breaks when casing differs (poor UX)
- Full-text search with stemming → adds complexity, external dependencies

**Consequences:**
- `?title=buy` matches: "Buy groceries", "BUY NOW", "i buy things"
- No ranking by relevance; results in creation order
- Special characters (e.g., `&`, `*`, `^`) treated as literals, not operators

**Traceability:** FR-002

---

### ADR-003: AND Logic for Filter Composition

**Decision:** Combine title, completed, and priority filters with AND logic.

**Rationale:**
- **Consistency:** Existing filters (`completed`, `priority`) already compose with AND
- **Intuitiveness:** Users expect `?title=buy&completed=true` to mean "buy AND completed"
- **Implementation:** Sequential filtering maintains clarity and testability

**Alternatives Considered:**
- OR logic → results would include todos matching any filter (unintuitive)
- Complex boolean query syntax → adds frontend complexity

**Consequences:**
- `?title=review&completed=false&priority=high` returns todos where title contains "review" AND completed=false AND priority=high
- Empty result set is valid (HTTP 200, count=0)

**Traceability:** FR-003

---

### ADR-004: No Pagination in MVP

**Decision:** Return all matching results in a single response; defer pagination to future enhancement.

**Rationale:**
- **Scope:** Reduces complexity for MVP; acceptable for <1,000 todos
- **Simplicity:** No cursor/offset state management
- **Compliance:** Existing API has no pagination; consistent approach

**Alternatives Considered:**
- Limit + offset pagination → adds parameter parsing, state tracking
- Cursor-based pagination → more complex, requires sorting guarantees

**Consequences:**
- Large result sets (1,000+ matches) returned in single response
- Client responsible for handling large payloads
- If todos exceed 10,000 in production, pagination becomes necessary (tracked as future work)

**Traceability:** A-005 (assumption: no pagination in MVP)

---

### ADR-005: No External Dependencies

**Decision:** Use built-in JavaScript `String.toLowerCase()` and `.includes()` for matching.

**Rationale:**
- **Zero Dependency Cost:** No npm packages, no supply chain risk
- **Performance:** V8 engine optimizes built-in string methods
- **Maintainability:** No version compatibility issues or updates to monitor

**Alternatives Considered:**
- Lodash or other utility libraries → adds overhead for simple operation
- Regex library → unnecessary for literal substring matching

**Consequences:**
- Special characters in query are treated literally (no regex interpretation)
- Unicode/emoji handling relies on JavaScript runtime (works well in modern Node.js)
- No stemming, fuzzy matching, or linguistic features

**Traceability:** NFR-003 (no external dependencies)

---

## 11. Requirement Traceability

### Functional Requirements (FR)

| ID | Requirement | Architecture Coverage | Status |
|----|-------------|----------------------|--------|
| FR-001 | Search endpoint via query parameter | Query param integration in handler; Section 4.1 | ✅ Covered |
| FR-002 | Case-insensitive partial matching | ADR-002; Section 5 implementation | ✅ Covered |
| FR-003 | Combined filtering with existing params | AND composition; Section 6.2 | ✅ Covered |
| FR-004 | Error handling for invalid search | Section 7; validation rules | ✅ Covered |

### Non-Functional Requirements (NFR)

| ID | Requirement | Architecture Coverage | Status |
|----|-------------|----------------------|--------|
| NFR-001 | Response performance ≤50ms for 1K todos | Section 8.2 (O(n) complexity, in-memory scan) | ✅ Covered |
| NFR-002 | Backward compatibility | Section 9.1 (no breaking changes); optional param | ✅ Covered |
| NFR-003 | Code quality & maintainability | Section 5 (follows existing pattern, SOLID); ADR-005 | ✅ Covered |

### Assumptions (A)

| ID | Assumption | Architecture Reflection | Status |
|----|-----------|----------------------|--------|
| A-001 | Search scope: title only | Handler logic in Section 5 applies to title field only | ✅ Covered |
| A-002 | Stateless API (in-memory source of truth) | No persistence layer discussed; direct array manipulation | ✅ Covered |
| A-003 | No authentication | Inherited from existing handler; no auth layer added | ✅ Covered |
| A-004 | Natural sort order (creation order) | Results in original array order; no explicit sort | ✅ Covered |
| A-005 | No pagination in MVP | ADR-004; return all results | ✅ Covered |
| A-006 | URL encoding handled by Express | Assumed middleware decodes; validation happens post-decode | ✅ Covered |

### Edge Cases (E)

| ID | Scenario | Architecture Handling | Status |
|----|----------|----------------------|--------|
| E-001 | Empty search query (`?title=`) | Validation rejects; HTTP 400 (Section 7) | ✅ Covered |
| E-002 | Whitespace-only query (`?title=   `) | Trim applied; empty after trim → reject (Section 6.1) | ✅ Covered |
| E-003 | Special characters in title | Treated as literals; `.includes()` finds exact substring | ✅ Covered |
| E-004 | Very long query | Accepted; rely on web server limits (Section 6.1) | ✅ Covered |
| E-005 | Unicode/emoji | JavaScript runtime handles; `.includes()` works with Unicode | ✅ Covered |
| E-006 | Zero results | HTTP 200 with `{ count: 0, todos: [] }` (Section 4.1) | ✅ Covered |

---

## 12. Integration Points

### 12.1 Modified Files

- **`src/controllers/todoController.js`** (single file change)
  - Handler: `getAllTodos` function
  - Add title parameter validation and filter logic
  - No changes to other handlers (getTodoById, createTodo, etc.)

### 12.2 No Changes Required

- Route definition (`src/routes/todoRoutes.js`) — existing `GET /` route unchanged
- Data model (`src/data/todos.js`) — todos array structure unchanged
- Server setup (`server.js`) — middleware and port unchanged
- Frontend (`index.html`, `app.js`) — optional; clients can use search when ready

### 12.3 Entry Point

**Express Route:** `router.get('/', getAllTodos);` in `src/routes/todoRoutes.js`

**Handler:** `getAllTodos` in `src/controllers/todoController.js`

**Request Flow:**
```
GET /todos?title=buy → Express router → getAllTodos handler → validate + filter → response
```

---

## 13. Testing Strategy (Input for Stage 5)

### Unit Tests (Handler Logic)

- Validate title parameter acceptance and rejection
- Verify case-insensitive matching
- Verify AND composition with other filters
- Edge case validation (empty, whitespace, special characters)

### Integration Tests

- Full HTTP GET request with title parameter
- Combine title with completed and priority filters
- Verify response format and status codes

### Performance Tests

- Measure response time with 1,000 test todos
- Confirm ≤50ms median (NFR-001)

### Regression Tests

- Verify existing queries work unchanged
- Confirm backward compatibility

---

## 14. Approval Status

**This document is complete and ready for Stage 3 (Design Review).**

**Review Checklist:**
- ✅ All FR/NFR/A/E mapped to architecture sections
- ✅ Data flow and component responsibilities defined
- ✅ API contract with examples provided
- ✅ Implementation pattern consistent with existing code
- ✅ Error handling and validation rules documented
- ✅ Performance analysis and rollback strategy included
- ✅ Material ADRs recorded with rationale and alternatives
- ✅ Traceability matrix links requirements to architecture
- ✅ No production code written; design only