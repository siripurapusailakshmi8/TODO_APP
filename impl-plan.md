# Implementation Plan: Search Todos by Title API

## 1. Plan Status

**Overall Status: ✅ READY FOR STAGE 5 IMPLEMENTATION**

Stage 4 planning is complete. All prerequisite approvals are obtained. One finding (FINDING-001) from design review requires clarification during Stage 5, but does not block implementation start. No architecture changes, migrations, or scope changes are required.

## 2. Approved Inputs

**Stage 1 Artifacts (Requirements):**
- `requirements.md`: FR-001 through FR-004, NFR-001 through NFR-003
- Assumptions A-001 through A-006
- Edge Cases E-001 through E-006
- Test traceability: 14 test cases mapped

**Stage 2 Artifacts (Architecture):**
- `architecture.md`: 5 ADRs, API contract, implementation pattern, validation rules

**Stage 3 Artifacts (Design Review):**
- `design-review.md`: Approved with one medium-severity finding (FINDING-001: E-002 clarification)
- Coverage: 13/13 requirements (95% edge cases)

## 3. Dependency Order & Critical Path

```
T0: Clarify E-002
  ↓
T1: Modify getAllTodos handler
  ↓
T2: Add unit tests
  ↓
T3: Add integration tests
  ↓
T4: Add performance tests (≤50ms)
  ↓
T5: Add regression tests
  ↓
T6: Code review & SOLID audit
  ↓
T7: Update docs & changelog
  ↓
T8: Final validation & PR prep
```

## 4. Tasks

### T0: Clarify E-002 Whitespace-Only Query Behavior [PREREQUISITE]

**Status:** ⚠️ Needs Clarification  
**Owner:** Product Owner  
**Effort:** 0.25 hours  
**Files:** requirements.md (documentation only)

**Work:**  
Confirm with product owner the intended behavior for whitespace-only queries (`?title=   `):
- **Option A:** Search for literal spaces (requires removing .trim())
- **Option B:** Reject with HTTP 400 (current architecture, RECOMMENDED)

**Completion Criteria:**
- ✅ Product owner explicitly approves Option A or B
- ✅ Decision is documented in requirements.md E-002
- ✅ FINDING-001 is marked resolved

**Validation:**
```powershell
$req = Get-Content .\requirements.md -Raw
if ($req -match "Whitespace-only.*reject|Whitespace-only.*HTTP 400") {
    Write-Host "✅ E-002 behavior documented"
}
```

**Blocking:** YES (must complete before T1)

---

### T1: Modify getAllTodos Handler to Add Title Filter

**Status:** 🔵 Not Started  
**Owner:** Developer  
**Effort:** 1.5 hours  
**Files:** `src/controllers/todoController.js`

**Requirements:** FR-001, FR-002, FR-003, FR-004, A-001

**Work:**  
Modify `getAllTodos` function to:
1. Accept optional `?title` query parameter
2. Validate non-empty after trim
3. Apply case-insensitive `.toLowerCase().includes()` filter
4. Compose with existing filters (AND logic)
5. Return HTTP 400 for invalid input

**Code Block:**
```javascript
if (req.query.title !== undefined) {
  const titleQuery = String(req.query.title).trim();
  if (titleQuery === '') {
    return res.status(400).json({ error: 'title filter must be a non-empty string if provided' });
  }
  const titleLower = titleQuery.toLowerCase();
  result = result.filter((t) => t.title.toLowerCase().includes(titleLower));
}
```

**Completion Criteria:**
- ✅ Title filter added after priority filter
- ✅ No route changes
- ✅ No external dependencies
- ✅ Follows existing pattern

**Validation:**
```powershell
$code = Get-Content .\src\controllers\todoController.js -Raw
if ($code -match "req\\.query\\.title" -and $code -match "toLowerCase.*includes") {
    Write-Host "✅ Title filter present"
}
```

**Dependencies:** T0

---

### T2: Add Unit Tests for Title Parameter Validation

**Status:** 🔵 Not Started  
**Owner:** QA Engineer  
**Effort:** 2 hours  
**Files:** New: `test/unit/todoController.test.js`

**Requirements:** FR-001, FR-004, Test-001,004,005,006,009,010,011

**Test Cases:**
- Test-001: ?title=buy matches "buy" in title
- Test-004: ?title= (empty) → HTTP 400
- Test-005: Case-insensitive matching
- Test-006: Partial substring matching
- Test-009: Empty after trim → HTTP 400
- Test-010: URL-encoded characters decoded
- Test-011: Literal strings like "null", "undefined" searched

**Completion Criteria:**
- ✅ 7 unit tests implemented
- ✅ All tests pass
- ✅ Validation errors verified
- ✅ Success cases verified

**Validation:**
```powershell
npm test -- --testNamePattern="title|search"
```

**Dependencies:** T1

---

### T3: Add Integration Tests for Combined Filtering

**Status:** 🔵 Not Started  
**Owner:** QA Engineer  
**Effort:** 1.5 hours  
**Files:** New: `test/integration/todos.integration.test.js`

**Requirements:** FR-003, Test-002,003,007,008

**Test Cases:**
- Test-002: GET /todos returns all (no params)
- Test-003: Response has count & todos array
- Test-007: ?title=X&completed=Y → AND logic
- Test-008: ?title=X&priority=Y → AND logic

**Completion Criteria:**
- ✅ Combined filters work
- ✅ Backward compatibility verified
- ✅ Response schema consistent
- ✅ All tests pass

**Validation:**
```powershell
npm test -- test/integration
```

**Dependencies:** T2

---

### T4: Add Performance Tests (NFR-001)

**Status:** 🔵 Not Started  
**Owner:** Performance Engineer  
**Effort:** 2 hours  
**Files:** New: `test/performance/search.perf.test.js`

**Requirements:** NFR-001, Perf-Test-001

**Work:**  
Create performance test with 1,000 representative todos:
- Simple search: ?title=test
- Combined filters: ?title=test&completed=true&priority=high
- No results: ?title=nonexistent
- Many results: ?title=a (common letter)

**Completion Criteria:**
- ✅ Test setup with 1K todos
- ✅ Median response time ≤50ms for all cases
- ✅ Results logged and consistent
- ✅ Perf-Test-001 passes

**Validation:**
```powershell
npm run test:perf
# Output: Median response time: XYZms (Target: ≤50ms)
```

**Dependencies:** T3

---

### T5: Add Regression Tests for Existing Queries

**Status:** 🔵 Not Started  
**Owner:** QA Engineer  
**Effort:** 1.5 hours  
**Files:** New: `test/regression/todos.regression.test.js`

**Requirements:** NFR-002, Regression-Test-001, E-001..E-006

**Test Cases:**
- Backward compat: GET /todos, ?completed=true, ?priority=high
- E-001: ?title= → HTTP 400
- E-002: Whitespace-only (per T0 decision)
- E-003: Special characters (?title=&milk)
- E-004: Very long query
- E-005: Unicode/emoji
- E-006: Zero results → HTTP 200 with empty array

**Completion Criteria:**
- ✅ All existing behavior unchanged
- ✅ All edge cases tested
- ✅ Errors consistent
- ✅ HTTP status codes correct
- ✅ Regression-Test-001 passes

**Validation:**
```powershell
npm test -- test/regression
```

**Dependencies:** T4

---

### T6: Code Review & SOLID Audit

**Status:** 🔵 Not Started  
**Owner:** Code Reviewer  
**Effort:** 1 hour  
**Files:** All modified/created files

**Requirements:** NFR-003, Code-Review-001

**Checklist:**
- ✅ SOLID principles: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- ✅ No console.log() or debug statements
- ✅ Error messages clear
- ✅ No dead code
- ✅ Style consistent
- ✅ Performance acceptable
- ✅ Test coverage ≥80%
- ✅ No security vulnerabilities

**Completion Criteria:**
- ✅ Peer review completed
- ✅ All SOLID principles met
- ✅ No security issues
- ✅ No performance regressions
- ✅ Coverage ≥80%

**Validation:**
```powershell
npm run lint -- src/controllers/todoController.js
npm run coverage -- --thresholdStatementCoverage=80
```

**Dependencies:** T5

---

### T7: Update Documentation & Changelog

**Status:** 🔵 Not Started  
**Owner:** Tech Writer  
**Effort:** 1 hour  
**Files:** `CHANGELOG.md`, code comments, API docs

**Work:**
- Add changelog entry: "Add search todos by title via ?title query parameter"
- Update API documentation with examples
- Add code comments explaining T0 decision for E-002
- Document decision to use no external dependencies

**Completion Criteria:**
- ✅ CHANGELOG.md updated
- ✅ API documentation reflects new param
- ✅ Code comments clear
- ✅ No TBDs remaining

**Validation:**
```powershell
Test-Path .\CHANGELOG.md
(Get-Content .\CHANGELOG.md | Measure-Object -Line).Lines -gt 10
```

**Dependencies:** T6

---

### T8: Final Validation & PR Preparation

**Status:** 🔵 Not Started  
**Owner:** Implementation Lead  
**Effort:** 1 hour  
**Files:** All modified files, PR template

**Final Checklist:**
- ✅ All 14 tests pass
- ✅ No lint errors
- ✅ All edge cases tested
- ✅ Performance ≤50ms (NFR-001)
- ✅ Backward compatible (NFR-002)
- ✅ Code quality meets standards (NFR-003)
- ✅ All FR/NFR/A implemented
- ✅ Rollback documented & tested

**PR Preparation:**
- Branch: feature/search-todos-by-title
- Title: "Add search todos by title via ?title query parameter"
- Description: Feature summary, test results, metrics, breaking changes (none), related artifacts
- Link to: requirements.md, architecture.md, design-review.md

**Completion Criteria:**
- ✅ All validation passes
- ✅ PR ready for review
- ✅ PR description complete
- ✅ Tests pass in CI/CD
- ✅ No merge conflicts

**Validation:**
```powershell
npm test -- --coverage
npm run lint
npm run test:perf
# All exit with 0 (success)
```

**Dependencies:** T7

---

## 5. Task Summary Table

| Task | Title | Status | Owner | Hours | Blocker |
|------|-------|--------|-------|-------|---------|
| T0 | Clarify E-002 | ⚠️ Needs Approval | Product | 0.25 | YES |
| T1 | Modify handler | 🔵 Not Started | Dev | 1.5 | No |
| T2 | Unit tests | 🔵 Not Started | QA | 2 | No |
| T3 | Integration tests | 🔵 Not Started | QA | 1.5 | No |
| T4 | Performance tests | 🔵 Not Started | Perf Eng | 2 | No |
| T5 | Regression tests | 🔵 Not Started | QA | 1.5 | No |
| T6 | Code review | 🔵 Not Started | Reviewer | 1 | No |
| T7 | Documentation | 🔵 Not Started | Tech Writer | 1 | No |
| T8 | Final validation | 🔵 Not Started | Lead | 1 | No |

**Total Effort:** ~12 hours  
**Critical Path:** T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8

---

## 6. Files Modified

| File | Status | Changes |
|------|--------|---------|
| src/controllers/todoController.js | ✏️ Modify | Add title filter to getAllTodos |
| test/unit/todoController.test.js | ✨ Create | Unit tests for validation |
| test/integration/todos.integration.test.js | ✨ Create | Integration tests |
| test/performance/search.perf.test.js | ✨ Create | Performance tests |
| test/regression/todos.regression.test.js | ✨ Create | Regression tests |
| CHANGELOG.md | ✏️ Modify | Release notes |

**No changes to:**
- src/routes/todoRoutes.js
- src/data/todos.js
- server.js
- package.json
- package-lock.json

---

## 7. Approval Status

**✅ READY FOR STAGE 5**

**Conditions:**
1. ⚠️ T0: Product owner clarifies E-002 whitespace behavior
2. ✅ No architecture changes needed
3. ✅ No scope expansion
4. ✅ All dependencies met

**Ready to Proceed:** YES (after T0 clarification)

---

## 8. Rollback Procedure

If critical issues discovered:
1. `git revert <commit>`
2. Restart Node.js server
3. Verify rollback: Test existing queries without ?title
4. Impact: Requests with ?title ignored; returns all todos

---

**IMPLEMENTATION PLAN COMPLETE. AWAITING T0 APPROVAL TO BEGIN STAGE 5.**