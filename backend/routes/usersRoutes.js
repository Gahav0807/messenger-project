const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const userControllers = require('../controllers/usersControllers');

// Получение пользователей по имени (частичное совпадение)
router.get('/users', authMiddleware, userControllers.getUserByUsername);

module.exports = router;
