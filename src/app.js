const path = require('path');
const express = require('express');
const todoRoutes = require('./routes/todoRoutes');

const app = express();

app.use(express.json());

// serve only the UI entry point — do not use express.static to avoid exposing source files
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/todos', todoRoutes);

// 404 for unknown routes
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
