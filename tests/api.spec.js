// @ts-check
const { test, expect } = require('@playwright/test');

// Seed: "Buy groceries"(medium,active), "Read a book"(low,active), "Morning workout"(high,completed)

test.describe('GET /todos — name filter', () => {
  let request;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test('AC-001: substring match returns multiple titles', async () => {
    // "e" is in "Buy groceries" and "Read a book" but not "Morning workout"
    const res = await request.get('/todos?name=e');
    expect(res.status()).toBe(200);
    const { todos } = await res.json();
    const titles = todos.map((t) => t.title);
    expect(titles).toContain('Buy groceries');
    expect(titles).toContain('Read a book');
    expect(titles).not.toContain('Morning workout');
    expect(todos.length).toBe(2);
  });

  test('AC-002: case-insensitive matching', async () => {
    const lower = await (await request.get('/todos?name=book')).json();
    const upper = await (await request.get('/todos?name=BOOK')).json();
    const mixed = await (await request.get('/todos?name=Book')).json();
    expect(lower.todos.map((t) => t.title)).toEqual(['Read a book']);
    expect(upper.todos.map((t) => t.title)).toEqual(['Read a book']);
    expect(mixed.todos.map((t) => t.title)).toEqual(['Read a book']);
  });

  test('AC-003a: trimmed query matches', async () => {
    const res = await request.get('/todos?name=%20book%20');
    const { todos } = await res.json();
    expect(todos.map((t) => t.title)).toEqual(['Read a book']);
  });

  test('AC-003b: absent name returns all todos', async () => {
    const withName = await (await request.get('/todos')).json();
    const withoutName = await (await request.get('/todos?name=')).json();
    expect(withName.count).toBe(3);
    expect(withoutName.count).toBe(3);
  });

  test('AC-003c: whitespace-only name applies no title restriction', async () => {
    const res = await request.get('/todos?name=%20%20');
    const { count } = await res.json();
    expect(count).toBe(3);
  });

  test('AC-004: AND composition with completed filter', async () => {
    // completed=true → only "Morning workout"; name=workout confirms it
    const res = await request.get('/todos?name=workout&completed=true');
    const { todos } = await res.json();
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('Morning workout');
    expect(todos[0].completed).toBe(true);
  });

  test('AC-004: AND composition with priority filter', async () => {
    const res = await request.get('/todos?name=workout&priority=high');
    const { todos } = await res.json();
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('Morning workout');
    expect(todos[0].priority).toBe('high');
  });

  test('AC-004: name + completed + priority three-way AND', async () => {
    const res = await request.get('/todos?name=workout&completed=true&priority=high');
    const { todos } = await res.json();
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe('Morning workout');
  });

  test('no match returns empty list not 404', async () => {
    const res = await request.get('/todos?name=zzznomatch');
    expect(res.status()).toBe(200);
    const { count, todos } = await res.json();
    expect(count).toBe(0);
    expect(todos).toEqual([]);
  });

  test('existing completed filter still works without name', async () => {
    const res = await request.get('/todos?completed=true');
    const { todos } = await res.json();
    expect(todos.every((t) => t.completed)).toBe(true);
    expect(todos.length).toBe(1);
  });

  test('invalid priority still returns 400', async () => {
    const res = await request.get('/todos?priority=urgent');
    expect(res.status()).toBe(400);
  });
});
