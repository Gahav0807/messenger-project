const express = require('express');
const authController = require('../controllers/authControllers');

const authRoutes = express.Router();

authRoutes.post('/register', authController.registerUser);
authRoutes.post('/login', authController.loginUser);
authRoutes.post('/auth/check', authController.checkAuth);

module.exports = authRoutes;