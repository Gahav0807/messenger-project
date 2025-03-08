const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const WEBSOCKET_TOKEN_SECRET = process.env.NEXT_PUBLIC_WEBSOCKET_TOKEN_SECRET;
const app = express();

// Настройка CORS
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Создание HTTP-сервера
const server = http.createServer(app);

// Настройка Socket.IO
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

io.on('connection', (socket) => {
    const token = socket.handshake.query.token;

    if (!token) {
        socket.disconnect();
        return;
    }

    jwt.verify(token, WEBSOCKET_TOKEN_SECRET, async (err, user) => {
        if (err) {
            socket.disconnect();
            return;
        }

        console.log(`🔗 Пользователь ${user._id} подключен`);
        socket.user = user;

        socket.on('send_message', async ({ chatId, content }) => {
            try {
                const chat = await Chat.findOne({ _id: chatId, participants: user._id });
                if (!chat) {
                    console.error('Пользователь не является участником чата');
                    return;
                }

                const newMessage = new Message({ sender: user._id, content, chatId });
                await newMessage.save();
                await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

                io.to(chatId).emit('new_message', newMessage);
            } catch (error) {
                console.error('Ошибка при обработке сообщения:', error);
            }
        });

        socket.on('join_chat', (chatId) => {
            socket.join(chatId);
            console.log(`🟢 Пользователь ${user._id} зашел в чат ${chatId}`);
        });

        socket.on('disconnect', () => {
            console.log(`❌ Пользователь ${user._id} отключился`);
        });
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`✅ Socket.IO сервер работает на http://localhost:${PORT}`);
});