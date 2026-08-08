const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const app = require('../src/app');
const todos = require('../src/data/todos');

const initialTodos = structuredClone(todos);
const todoFields = Object.keys(initialTodos[0]).sort();
let baseUrl;
let server;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  assert.deepEqual(todos, initialTodos);
});

async function getTodos(query = '') {
  const response = await fetch(`${baseUrl}/todos${query}`);
  return { body: await response.json(), status: response.status };
}

function assertSuccessfulList(body, expectedTodos) {
  assert.deepEqual(Object.keys(body).sort(), ['count', 'todos']);
  assert.equal(body.count, body.todos.length);
  assert.deepEqual(body, { count: expectedTodos.length, todos: expectedTodos });
  body.todos.forEach((todo) => assert.deepEqual(Object.keys(todo).sort(), todoFields));
}

test('GET /todos baseline without name', async (t) => {
  await t.test('lists every todo in source order', async () => {
    const { body, status } = await getTodos();

    assert.equal(status, 200);
    assert.deepEqual(body, { count: initialTodos.length, todos: initialTodos });
  });

  await t.test('preserves the completed filter', async () => {
    const { body, status } = await getTodos('?completed=false');
    const expectedTodos = initialTodos.filter((todo) => !todo.completed);

    assert.equal(status, 200);
    assert.deepEqual(body, { count: expectedTodos.length, todos: expectedTodos });
  });

  await t.test('preserves the priority filter', async () => {
    const { body, status } = await getTodos('?priority=high');
    const expectedTodos = initialTodos.filter((todo) => todo.priority === 'high');

    assert.equal(status, 200);
    assert.deepEqual(body, { count: expectedTodos.length, todos: expectedTodos });
  });

  await t.test('rejects an invalid truthy priority', async () => {
    const { body, status } = await getTodos('?priority=urgent');

    assert.equal(status, 400);
    assert.deepEqual(body, { error: 'priority must be one of: low, medium, high' });
  });
});

test('GET /todos name filtering', async (t) => {
  await t.test('maps name to title for an exact valid match', async () => {
    const { body, status } = await getTodos('?name=Read%20a%20book');
    const expectedTodos = initialTodos.filter((todo) => todo.title === 'Read a book');

    assert.equal(status, 200);
    assertSuccessfulList(body, expectedTodos);
  });

  await t.test('trims and performs a case-insensitive substring match', async () => {
    const { body, status } = await getTodos('?name=%20GROCER%20');
    const expectedTodos = initialTodos.filter((todo) => todo.title === 'Buy groceries');

    assert.equal(status, 200);
    assertSuccessfulList(body, expectedTodos);
  });

  await t.test('combines name, completed, and priority with AND semantics', async () => {
    const { body, status } = await getTodos('?name=o&completed=true&priority=high');
    const expectedTodos = initialTodos.filter(
      (todo) => todo.title.toLowerCase().includes('o') && todo.completed && todo.priority === 'high',
    );

    assert.equal(status, 200);
    assertSuccessfulList(body, expectedTodos);
    body.todos.forEach((todo) => {
      assert.ok(todo.title.toLowerCase().includes('o'));
      assert.equal(todo.completed, true);
      assert.equal(todo.priority, 'high');
    });
  });

  await t.test('rejects an empty name', async () => {
    const { body, status } = await getTodos('?name=');

    assert.equal(status, 400);
    assert.deepEqual(body, { error: 'name must be a non-empty string' });
  });

  await t.test('rejects a whitespace-only name', async () => {
    const { body, status } = await getTodos('?name=%20%20%20');

    assert.equal(status, 400);
    assert.deepEqual(body, { error: 'name must be a non-empty string' });
  });

  await t.test('rejects repeated name keys parsed as a non-string', async () => {
    const { body, status } = await getTodos('?name=book&name=grocer');

    assert.equal(status, 400);
    assert.deepEqual(body, { error: 'name must be a non-empty string' });
  });

  await t.test('returns an empty success envelope when no title matches', async () => {
    const { body, status } = await getTodos('?name=does-not-exist');

    assert.equal(status, 200);
    assertSuccessfulList(body, []);
  });

  await t.test('returns deterministic ordered results for repeated requests', async () => {
    const expectedTodos = initialTodos.filter((todo) => todo.title.toLowerCase().includes('o'));
    const responses = await Promise.all([
      getTodos('?name=o'),
      getTodos('?name=o'),
      getTodos('?name=o'),
    ]);

    responses.forEach(({ body, status }) => {
      assert.equal(status, 200);
      assertSuccessfulList(body, expectedTodos);
    });
    assert.deepEqual(responses[0], responses[1]);
    assert.deepEqual(responses[1], responses[2]);
  });
});