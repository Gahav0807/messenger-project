const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const chatController = require('../controllers/chatControllers');

// Получение списка чатов
router.get('/chats', authMiddleware, chatController.getChats);

// Создание нового группового чата
router.post('/chats', authMiddleware, chatController.createChat);

// Создание приватного чата между двумя пользователями
router.post('/chats/private', authMiddleware, chatController.createPrivateChat);

// Получение одного чата по ID
router.get('/chats/:chatId', authMiddleware, chatController.getChatById);

module.exports = router;