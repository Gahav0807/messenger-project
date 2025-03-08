const path = require('path');
const winston = require('winston');

// Настройка логгера с поддержкой всех уровней
const logger = winston.createLogger({
    level: 'debug',  // Устанавливаем минимальный уровень логирования
    format: winston.format.combine(
      winston.format.colorize(), // Цветная визуализация логов
      winston.format.simple()    // Простой формат вывода
    ),
    transports: [
      new winston.transports.Console({ 
        format: winston.format.combine(
          winston.format.colorize(),  // Цветной вывод в консоль
          winston.format.simple()     // Простой формат
        )
      }),
      new winston.transports.File({ filename: path.join(__dirname, '../logs/app.log') })
    ]
  });

module.exports = logger;