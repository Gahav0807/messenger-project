const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/User');
const userControllers = require('../controllers/usersControllers')

// Получение списка пользователей
router.get('/users', authMiddleware, userControllers.getUsers);

module.exports = router;