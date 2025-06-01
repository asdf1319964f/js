// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const authMiddleware = require('../middlewares/authMiddleware');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    const result = await authService.register(userData);
    res.status(201).json(result);
  } catch (error) {
    console.error('注册失败:', error);
    res.status(400).json({ message: error.message || '注册失败' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const credentials = req.body;
    const result = await authService.login(credentials);
    res.status(200).json(result);
  } catch (error) {
    console.error('登录失败:', error);
    res.status(401).json({ message: error.message || '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    // ***** 关键修改已应用：getCurrentUser 更改为 fetchCurrentUser *****
    const user = await authService.fetchCurrentUser(userId); // <-- 这一行已修改
    res.status(200).json(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(400).json({ message: error.message || '获取用户信息失败' });
  }
});

// 更新用户设置
router.put('/settings', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const settings = req.body;
    const updatedSettings = await authService.updateUserSettings(userId, settings);
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(400).json({ message: error.message || '更新设置失败' });
  }
});

module.exports = router;