const { v4: uuidv4 } = require('uuid');
const todos = require('../data/todos');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

// GET /todos  — list all, with optional ?completed=true/false and ?priority=low|medium|high
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

  if (typeof req.query.name === 'string') {
    const query = req.query.name.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (t) => typeof t.title === 'string' && t.title.toLowerCase().includes(query)
      );
    }
  }

  res.json({ count: result.length, todos: result });
};

// GET /todos/:id
const getTodoById = (req, res) => {
  const todo = todos.find((t) => t.id === req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
};

// POST /todos
const createTodo = (req, res) => {
  const { title, description = '', priority = 'medium' } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  const now = new Date().toISOString();
  const todo = {
    id: uuidv4(),
    title: title.trim(),
    description: String(description).trim(),
    completed: false,
    priority,
    createdAt: now,
    updatedAt: now,
  };

  todos.push(todo);
  res.status(201).json(todo);
};

// PUT /todos/:id  — full update
const updateTodo = (req, res) => {
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  const { title, description, completed, priority } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  const existing = todos[index];
  const updated = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    description: description !== undefined ? String(description).trim() : existing.description,
    completed: completed !== undefined ? completed : existing.completed,
    priority: priority !== undefined ? priority : existing.priority,
    updatedAt: new Date().toISOString(),
  };

  todos[index] = updated;
  res.json(updated);
};

// PATCH /todos/:id/toggle  — flip completed flag
const toggleTodo = (req, res) => {
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  todos[index] = {
    ...todos[index],
    completed: !todos[index].completed,
    updatedAt: new Date().toISOString(),
  };

  res.json(todos[index]);
};

// DELETE /todos/:id
const deleteTodo = (req, res) => {
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  const [deleted] = todos.splice(index, 1);
  res.json({ message: 'Todo deleted', todo: deleted });
};

// DELETE /todos  — delete all completed todos
const clearCompleted = (req, res) => {
  const before = todos.length;
  const removed = todos.filter((t) => t.completed);
  todos.splice(0, todos.length, ...todos.filter((t) => !t.completed));
  res.json({ message: `Deleted ${before - todos.length} completed todo(s)`, deleted: removed });
};

module.exports = { getAllTodos, getTodoById, createTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted };
