const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const app = require('../src/app');
const todos = require('../src/data/todos');

const initialTodos = structuredClone(todos);
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