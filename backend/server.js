require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require("./config/logger");
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message'); // Подключаем модель Message
const Chat = require('./models/Chat'); // Подключаем модель Chat

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/messenger';

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    logger.info('✅ Подключение к MongoDB успешно');
}).catch((error) => {
    logger.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
});

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const usersRoutes = require('./routes/usersRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5174', 'http://localhost:5173', 'https://s-film-react-new.vercel.app'],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
        credentials: true,
    },
});

const PORT = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5174', 'http://localhost:5173', 'https://s-film-react-new.vercel.app'],
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
    exposedHeaders: ['x-refresh-token'],
    credentials: true,
}));

app.use(express.json());

io.on('connection', (socket) => {
    console.log(`✅ Пользователь подключен: ${socket.id}`);

    socket.on('sendMessage', async ({ chatId, sender, content }) => {
        try {
            console.log(`📨 Получено сообщение от ${sender}: ${content}`);
            
            if (!mongoose.Types.ObjectId.isValid(chatId)) {
                console.log("⚠️ Ошибка: Неверный chatId");
                return;
            }

            const chat = await Chat.findById(chatId);
            if (!chat) {
                console.log("⚠️ Ошибка: Чат не найден");
                return;
            }

            const newMessage = new Message({
                sender,
                chatId,
                content
            });

            await newMessage.save();
            console.log(`✅ Сообщение сохранено в БД: ${newMessage._id}`);

            await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });
            
            io.to(chatId).emit('receiveMessage', {
                sender,
                content,
                timestamp: newMessage.timestamp,
            });
            console.log(`📨 Сообщение отправлено в чат ${chatId}`);
        } catch (error) {
            console.error("❌ Ошибка при обработке сообщения:", error);
        }
    });

    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`🔵 Пользователь ${socket.id} присоединился к чату: ${chatId}`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Пользователь отключился: ${socket.id}`);
    });
});

app.get("/", (req, res) => {
    res.send("Сервер запущен");
});

app.use('/', authRoutes);
app.use('/', chatRoutes);
app.use('/', usersRoutes);

server.listen(PORT, () => {
    logger.info(`✅ Сервер работает на порту ${PORT}`);
});