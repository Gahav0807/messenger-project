const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username'); // Получаем только username
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении списка пользователей' });
  }
};

module.exports = {
  getUsers,
};