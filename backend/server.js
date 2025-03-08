require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require("./config/logger");
const mongoose = require('mongoose');
const http = require('http'); // Импортируем http
const { Server } = require('socket.io'); // Импортируем Server из socket.io

const mongoUri = 'mongodb://localhost:27017/messenger'; // Местное подключение или URL из env

// Подключаемся к MongoDB
try {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  logger.info('✅ Подключение к MongoDB успешно');
} catch (error) {
  logger.error('❌ Ошибка подключения к MongoDB:', error);
  process.exit(1); // Завершаем процесс, если не удалось подключиться
}

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const usersRoutes = require('./routes/usersRoutes');

const app = express();
const server = http.createServer(app); // Создаем HTTP сервер из Express
const io = new Server(server, { // Создаем WebSocket сервер
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5174', 'http://localhost:5173', 'https://s-film-react-new.vercel.app'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
    credentials: true,
  },
});

const PORT = 3000;

// Настройка CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5174', 'http://localhost:5173', 'https://s-film-react-new.vercel.app'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  exposedHeaders: ['x-refresh-token'],
  credentials: true
}));

app.use(express.json());

// WebSocket логика
io.on('connection', (socket) => {
  console.log(`✅ Пользователь подключен: ${socket.id}`);

  // Обработчик события отправки сообщения
  socket.on('sendMessage', (data) => {
    console.log(`📨 Получено сообщение от ${data.sender}: ${data.content}`);
    // Здесь можно добавить логику для сохранения сообщения в базе данных

    // Отправляем сообщение всем клиентам в чат (или только участникам конкретного чата)
    socket.to(data.chatId).emit('receiveMessage', {
      sender: data.sender,
      content: data.content,
      timestamp: Date.now(),
    });
  });

  // Подключение к чату (создание канала для чата)
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`🔵 Пользователь с id ${socket.id} присоединился к чату: ${chatId}`);
  });

  // Отключение пользователя
  socket.on('disconnect', () => {
    console.log(`❌ Пользователь отключился: ${socket.id}`);
  });
});

// Главная страница
app.get("/", (req, res) => {
  res.send("Сервер запущен");
});

// Подключение маршрутов
app.use('/', authRoutes);
app.use('/', chatRoutes);
app.use('/', usersRoutes);

// Запуск сервера
server.listen(PORT, () => {
  logger.debug(`🟢 Debug: Сервер запускается на порту ${PORT}`);
  logger.info(`✅ Основной сервер работает на порту ${PORT}`);
});
