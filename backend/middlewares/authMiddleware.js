require('dotenv').config();
const { verifyToken, generateAccessToken, generateRefreshToken } = require('../utils/authUtils');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET;

const authMiddleware = async (req, res, next) => {
    let accessToken = req.headers.authorization?.split(" ")[1];
    const refreshToken = req.headers['x-refresh-token'];

    if (!accessToken) {
        return res.status(401).json({ error: "Токен отсутствует" });
    }

    // Verify access token
    let decodedUser = await verifyToken(accessToken);

    if (!decodedUser && refreshToken) {
        // Access token is invalid, but a refresh token is available
        try {
            // Verify the refresh token
            const decodedRefresh = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

            // Generate new access and refresh tokens
            const newAccessToken = generateAccessToken(decodedRefresh.username, decodedRefresh.is_admin);
            const newRefreshToken = generateRefreshToken(decodedRefresh.username, decodedRefresh.is_admin);

            // Set the new tokens in the response headers
            res.setHeader('x-access-token', newAccessToken);
            res.setHeader('x-refresh-token', newRefreshToken);

            // Attach the user info to the request object for further use
            req.user = decodedRefresh;
            return next();
        } catch (error) {
            // Invalid refresh token
            return res.status(403).json({ error: "Ошибка при обновлении токена", logout: true });
        }
    }

    // If access token is valid, attach the user info and proceed
    if (decodedUser) {
        req.user = decodedUser;
        return next();
    }

    // If both tokens are invalid, respond with an error
    return res.status(401).json({ error: "Неверный токен" });
};

module.exports = authMiddleware;
