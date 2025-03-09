const User = require('../models/User'); 

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;  // Получаем строку поиска через query параметр

    if (!username) {
      return res.status(400).json({ success: false, message: "Необходимо передать строку для поиска" });
    }

    // Ищем пользователей по части имени с использованием регулярных выражений
    const regex = new RegExp(username, 'i'); // 'i' для нечувствительности к регистру
    const users = await User.find({ username: { $regex: regex } }, 'username');

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Пользователи не найдены" });
    }

    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("Ошибка при получении пользователей:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

module.exports = {
  getUserByUsername,
};
