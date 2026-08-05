const { Router } = require('express');
const {
  getAllTodos,
  getTodoById,
  searchTodos,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
} = require('../controllers/todoController');

const router = Router();

router.get('/', getAllTodos);
router.get('/search', searchTodos);   // must come before /:id
router.get('/:id', getTodoById);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.patch('/:id/toggle', toggleTodo);
router.delete('/', clearCompleted);   // must come before /:id
router.delete('/:id', deleteTodo);

module.exports = router;
