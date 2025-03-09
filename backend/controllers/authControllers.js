const User = require('../models/User');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken 
} = require('../utils/authUtils');
const jwt = require('jsonwebtoken');
const logger = require("../config/logger");

const REFRESH_TOKEN_SECRET = process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET;

const registerUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Такой пользователь уже существует' });
    }

    // Сохраняем пароль в открытом виде (без хеширования)
    const newUser = new User({ username, password });
    await newUser.save();

    const accessToken = generateAccessToken(newUser.username, newUser._id);
    const refreshToken = generateRefreshToken(newUser.username, newUser._id);

    logger.info(`Пользователь ${username} зарегистрирован.`);
    res.status(201).json({ message: 'Регистрация успешна', username, accessToken, refreshToken });
  } catch (err) {
    logger.error(`Ошибка при регистрации пользователя ${username}:`, err);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || password !== user.password) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const accessToken = generateAccessToken(user.username, user._id);
    const refreshToken = generateRefreshToken(user.username, user._id);

    logger.info(`Пользователь ${username} вошел в систему.`);
    res.status(200).json({ message: 'Вход успешен', accessToken, refreshToken });
  } catch (err) {
    logger.error(`Ошибка при входе пользователя ${username}:`, err);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
};

const checkAuth = async (req, res) => {
  const { authorization } = req.headers;
  const { refreshToken } = req.body;

  if (!authorization && !refreshToken) {
    return res.status(401).json({ authenticated: false, error: 'Токен и Refresh токен отсутствуют' });
  }

  let decodedUser;
  if (authorization) {
    const token = authorization.split(' ')[1];
    decodedUser = await verifyToken(token);
  }

  if (!decodedUser && refreshToken) {
    try {
      const decodedRefresh = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      decodedUser = decodedRefresh;
    } catch (error) {
      return res.status(403).json({ authenticated: false, error: 'Refresh токен недействителен', logout: true });
    }
  }

  if (!decodedUser) {
    return res.status(401).json({ authenticated: false, error: 'Не удалось аутентифицировать' });
  }

  const newAccessToken = generateAccessToken(decodedUser.username, decodedUser.is_admin);
  const newRefreshToken = generateRefreshToken(decodedUser.username, decodedUser.is_admin);

  try {
    const user = await User.findOne({ username: decodedUser.username });
    if (!user) return res.status(401).json({ authenticated: false });

    logger.info(`Пользователь ${decodedUser.username} успешно прошел аутентификацию.`);
    res.json({
      authenticated: true,
      username: decodedUser.username,
      userId: user._id,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    logger.error(`Ошибка при проверке аутентификации пользователя ${decodedUser.username}:`, err);
    res.status(500).json({ authenticated: false, error: 'Ошибка сервера' });
  }
};

module.exports = { registerUser, loginUser, checkAuth };
