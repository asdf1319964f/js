const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const favoriteService = require('../services/favoriteService');

// 获取收藏列表
router.get('/', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, type, search, tag } = req.query;
    
    const favorites = await favoriteService.getFavorites(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      search,
      tag
    });
    
    res.status(200).json(favorites);
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(400).json({ message: error.message || '获取收藏列表失败' });
  }
});

// 获取单个收藏详情
router.get('/:id', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const favoriteId = req.params.id;
    
    const favorite = await favoriteService.getFavoriteById(userId, favoriteId);
    
    if (!favorite) {
      return res.status(404).json({ message: '收藏不存在' });
    }
    
    res.status(200).json(favorite);
  } catch (error) {
    console.error('获取收藏详情失败:', error);
    res.status(400).json({ message: error.message || '获取收藏详情失败' });
  }
});

// 添加标签到收藏
router.post('/:id/tags', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const favoriteId = req.params.id;
    const { tags } = req.body;
    
    const updatedFavorite = await favoriteService.addTagsToFavorite(userId, favoriteId, tags);
    
    res.status(200).json(updatedFavorite);
  } catch (error) {
    console.error('添加标签失败:', error);
    res.status(400).json({ message: error.message || '添加标签失败' });
  }
});

// 从收藏中移除标签
router.delete('/:id/tags/:tagId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const favoriteId = req.params.id;
    const tagId = req.params.tagId;
    
    const updatedFavorite = await favoriteService.removeTagFromFavorite(userId, favoriteId, tagId);
    
    res.status(200).json(updatedFavorite);
  } catch (error) {
    console.error('移除标签失败:', error);
    res.status(400).json({ message: error.message || '移除标签失败' });
  }
});

// 删除收藏
router.delete('/:id', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const favoriteId = req.params.id;
    
    await favoriteService.deleteFavorite(userId, favoriteId);
    
    res.status(200).json({ message: '收藏已删除' });
  } catch (error) {
    console.error('删除收藏失败:', error);
    res.status(400).json({ message: error.message || '删除收藏失败' });
  }
});

// 获取收藏统计信息
router.get('/stats/summary', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await favoriteService.getUserFavoriteStats(userId);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('获取收藏统计信息失败:', error);
    res.status(400).json({ message: error.message || '获取收藏统计信息失败' });
  }
});

module.exports = router;
