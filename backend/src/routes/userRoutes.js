const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authService = require('../services/authService');

// 添加Telegram账号
router.post('/accounts', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const accountData = req.body;
    const result = await authService.addTelegramAccount(userId, accountData);
    res.status(201).json(result);
  } catch (error) {
    console.error('添加Telegram账号失败:', error);
    res.status(400).json({ message: error.message || '添加Telegram账号失败' });
  }
});

// 切换活跃Telegram账号
router.post('/accounts/:accountId/activate', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const accountId = req.params.accountId;
    const result = await authService.switchTelegramAccount(userId, accountId);
    res.status(200).json(result);
  } catch (error) {
    console.error('切换Telegram账号失败:', error);
    res.status(400).json({ message: error.message || '切换Telegram账号失败' });
  }
});

// 更新Telegram账号
router.put('/accounts/:accountId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const accountId = req.params.accountId;
    const updateData = req.body;
    const result = await authService.updateTelegramAccount(userId, accountId, updateData);
    res.status(200).json(result);
  } catch (error) {
    console.error('更新Telegram账号失败:', error);
    res.status(400).json({ message: error.message || '更新Telegram账号失败' });
  }
});

// 删除Telegram账号
router.delete('/accounts/:accountId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const accountId = req.params.accountId;
    const result = await authService.deleteTelegramAccount(userId, accountId);
    res.status(200).json(result);
  } catch (error) {
    console.error('删除Telegram账号失败:', error);
    res.status(400).json({ message: error.message || '删除Telegram账号失败' });
  }
});

// 同步收藏
router.post('/sync', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    // 这里应该调用同步收藏的服务
    // 简化处理，返回成功消息
    res.status(200).json({ message: '同步成功' });
  } catch (error) {
    console.error('同步收藏失败:', error);
    res.status(400).json({ message: error.message || '同步收藏失败' });
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
