// db.js
const mongoose = require('mongoose');
const logger = require('./config/logger');

const mongoUri = 'mongodb://localhost:27017/messenger'; // Местное подключение или URL из env

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('✅ Подключение к MongoDB успешно');
  } catch (error) {
    logger.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1); // Завершаем процесс, если не удалось подключиться
  }
};

module.exports = connectDB;
