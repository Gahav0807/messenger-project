const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_SECRET = process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET;

/**
 * Генерирует случайный пароль.
 * @returns {string} Случайный пароль.
 */
const generateRandomPassword = () => crypto.randomBytes(8).toString('hex');

/**
 * Генерирует access token.
 * @param {string} username - Имя пользователя.
 * @param {boolean} isAdmin - Является ли пользователь администратором.
 * @returns {string} Access token.
 */
const generateAccessToken = (username) => {
  return jwt.sign({ username }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

/**
 * Генерирует refresh token.
 * @param {string} username - Имя пользователя.
 * @returns {string} Refresh token.
 */
const generateRefreshToken = (username) => {
  return jwt.sign({ username }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

/**
 * Проверяет токен.
 * @param {string} token - Токен для проверки.
 * @returns {Promise<Object|null>} Декодированный токен или null в случае ошибки.
 */
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded);
    });
  });
};

module.exports = {
  generateRandomPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};