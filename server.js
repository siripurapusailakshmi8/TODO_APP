const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Todo API running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET    /health');
  console.log('  GET    /todos');
  console.log('  GET    /todos?completed=true|false');
  console.log('  GET    /todos?priority=low|medium|high');
  console.log('  GET    /todos?name=<search>');
  console.log('  GET    /todos/:id');
  console.log('  POST   /todos');
  console.log('  PUT    /todos/:id');
  console.log('  PATCH  /todos/:id/toggle');
  console.log('  DELETE /todos/:id');
  console.log('  DELETE /todos  (clears all completed)');
});
