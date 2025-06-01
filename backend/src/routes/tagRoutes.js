const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const tagService = require('../services/tagService');

// 获取所有标签
router.get('/', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const tags = await tagService.getTags(userId);
    res.status(200).json(tags);
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(400).json({ message: error.message || '获取标签列表失败' });
  }
});

// 创建新标签
router.post('/', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: '标签名称不能为空' });
    }
    
    const newTag = await tagService.createTag(userId, { name, color });
    res.status(201).json(newTag);
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(400).json({ message: error.message || '创建标签失败' });
  }
});

// 更新标签
router.put('/:id', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const tagId = req.params.id;
    const { name, color } = req.body;
    
    const updatedTag = await tagService.updateTag(userId, tagId, { name, color });
    
    if (!updatedTag) {
      return res.status(404).json({ message: '标签不存在' });
    }
    
    res.status(200).json(updatedTag);
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(400).json({ message: error.message || '更新标签失败' });
  }
});

// 删除标签
router.delete('/:id', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const tagId = req.params.id;
    
    await tagService.deleteTag(userId, tagId);
    
    res.status(200).json({ message: '标签已删除' });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(400).json({ message: error.message || '删除标签失败' });
  }
});

// 获取标签统计信息
router.get('/stats', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await tagService.getTagStats(userId);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('获取标签统计信息失败:', error);
    res.status(400).json({ message: error.message || '获取标签统计信息失败' });
  }
});

// 获取带有收藏计数的标签列表
router.get('/with-counts', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const tagsWithCounts = await tagService.getTagsWithCounts(userId);
    
    res.status(200).json(tagsWithCounts);
  } catch (error) {
    console.error('获取标签计数失败:', error);
    res.status(400).json({ message: error.message || '获取标签计数失败' });
  }
});

module.exports = router;
