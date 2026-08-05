const { v4: uuidv4 } = require('uuid');

// In-memory store (resets on server restart)
const todos = [
  {
    id: uuidv4(),
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, butter',
    completed: false,
    priority: 'medium',
    createdAt: new Date('2026-08-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-01T10:00:00Z').toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Read a book',
    description: 'Finish reading "Clean Code"',
    completed: false,
    priority: 'low',
    createdAt: new Date('2026-08-02T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-02T09:00:00Z').toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Morning workout',
    description: '30 minutes cardio + stretching',
    completed: true,
    priority: 'high',
    createdAt: new Date('2026-08-03T07:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-03T08:00:00Z').toISOString(),
  },
];

module.exports = todos;
