const test = require('node:test');
const assert = require('node:assert/strict');
const { searchTodos } = require('../src/controllers/todoController');
const todos = require('../src/data/todos');
const app = require('../src/app');

// Minimal Express-like res mock capturing status + json payload
function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('searchTodos returns 400 when name is missing', () => {
  const res = mockRes();
  searchTodos({ query: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(typeof res.body.error, 'string');
});

test('searchTodos returns 400 when name is blank/whitespace', () => {
  const res = mockRes();
  searchTodos({ query: { name: '   ' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(typeof res.body.error, 'string');
});

test('searchTodos returns 400 when name is repeated (array value)', () => {
  const res = mockRes();
  searchTodos({ query: { name: ['book', 'work'] } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(typeof res.body.error, 'string');
});

test('searchTodos matches title case-insensitively and partially', () => {
  const res = mockRes();
  searchTodos({ query: { name: 'BOOK' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.count, res.body.todos.length);
  assert.ok(res.body.todos.some((t) => t.title === 'Read a book'));
});

test('searchTodos returns empty envelope when nothing matches', () => {
  const res = mockRes();
  searchTodos({ query: { name: 'no-such-todo-xyz' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { count: 0, todos: [] });
});

test('searchTodos does not mutate the todos store', () => {
  const before = JSON.parse(JSON.stringify(todos));
  searchTodos({ query: { name: 'book' } }, mockRes());
  const after = JSON.parse(JSON.stringify(todos));
  assert.deepEqual(after, before);
});

test('GET /todos/search resolves to the search handler, not /:id (route order)', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    const ok = await fetch(`${base}/todos/search?name=book`);
    const okBody = await ok.json();
    assert.equal(ok.status, 200);
    assert.ok('count' in okBody && 'todos' in okBody, 'expected search envelope, not the /:id 404 shape');
    assert.notDeepEqual(okBody, { error: 'Todo not found' });

    // FR-002 over real HTTP: confirms Express's actual query parser (not an assumption)
    // turns a missing/repeated `name` into a validation failure, not just the mocked req/res above.
    const missing = await fetch(`${base}/todos/search`);
    assert.equal(missing.status, 400);

    const repeated = await fetch(`${base}/todos/search?name=book&name=work`);
    assert.equal(repeated.status, 400);
  } finally {
    server.close();
  }
});
