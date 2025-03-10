const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const logger = require("../config/logger");

// Получение списка чатов
const getChats = async (req, res) => {
    try {
        const username = req.user.username; // Имя пользователя из authMiddleware
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const userId = user._id;

        // Находим все чаты, где пользователь является участником
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'username')
            .populate('lastMessage');

        res.status(200).json({ chats });
    } catch (error) {
        console.error("Ошибка при получении списка чатов:", error);
        res.status(500).json({ error: 'Ошибка при получении списка чатов' });
    }
};

// Создание чата между двумя пользователями
const createPrivateChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        const username = req.user.username;

        // Логирование данных
        console.log("Запрос на создание чата. Пользователь:", username, "ParticipantId:", participantId);

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const userId = user._id;

        if(participantId === userId) {
            return res.status(400).json({ error: "Нельзя создать чат с самим собой" });
        }

        const participant = await User.findById(participantId);
        if (!participant) {
            return res.status(404).json({ error: "Участник не найден" });
        }

        // Проверяем наличие уже существующего чата между пользователями
        const existingChat = await Chat.findOne({
            participants: { $all: [userId, participantId] },
            isGroup: false
        }).populate("participants", "username");

        if (existingChat) {
            console.log("Чат уже существует:", existingChat);
            return res.status(200).json({ chat: existingChat });
        }

        const newChat = new Chat({
            participants: [userId, participantId],
            isGroup: false
        });

        await newChat.save();

        const populatedChat = await Chat.findById(newChat._id).populate("participants", "username");
        res.status(201).json({ chat: populatedChat });
    } catch (error) {
        console.error("Ошибка при создании приватного чата:", error);
        res.status(500).json({ error: "Ошибка при создании приватного чата" });
    }
};

// Получение чата по ID
const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const username = req.user.username;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const userId = user._id;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        })
            .populate('participants', 'username')
            .populate('lastMessage');

        if (!chat) {
            return res.status(404).json({ error: 'Чат не найден или у вас нет доступа' });
        }

        const messages = await Message.find({ chatId })
            .populate('sender', 'username')
            .sort({ timestamp: 1 });

        res.status(200).json({ chat, messages });
    } catch (error) {
        console.error("Ошибка при получении чата:", error);
        res.status(500).json({ error: 'Ошибка при получении чата' });
    }
};

module.exports = {
    getChats,
    createPrivateChat,
    getChatById
};