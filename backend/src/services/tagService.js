const Tag = require('../models/Tag');

// 标签服务
const tagService = {
  // 获取用户所有标签
  async getUserTags(userId) {
    try {
      const tags = await Tag.find({ userId }).sort({ count: -1 });
      return tags;
    } catch (error) {
      console.error('获取标签列表失败:', error);
      throw error;
    }
  },
  
  // 创建新标签
  async createTag(userId, tagName) {
    try {
      // 检查标签是否已存在
      const existingTag = await Tag.findOne({ userId, name: tagName });
      
      if (existingTag) {
        return existingTag;
      }
      
      // 创建新标签
      const newTag = new Tag({
        userId,
        name: tagName,
        count: 0
      });
      
      await newTag.save();
      return newTag;
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
    }
  },
  
  // 更新标签
  async updateTag(tagId, userId, newName) {
    try {
      const tag = await Tag.findOne({
        _id: tagId,
        userId
      });
      
      if (!tag) {
        throw new Error('标签不存在或无权访问');
      }
      
      // 检查新名称是否已存在
      if (newName !== tag.name) {
        const existingTag = await Tag.findOne({ userId, name: newName });
        
        if (existingTag) {
          throw new Error('标签名称已存在');
        }
      }
      
      // 更新标签名称
      tag.name = newName;
      await tag.save();
      
      return tag;
    } catch (error) {
      console.error('更新标签失败:', error);
      throw error;
    }
  },
  
  // 删除标签
  async deleteTag(tagId, userId) {
    try {
      const tag = await Tag.findOne({
        _id: tagId,
        userId
      });
      
      if (!tag) {
        throw new Error('标签不存在或无权访问');
      }
      
      // 从所有收藏中移除该标签
      const Favorite = require('../models/Favorite');
      await Favorite.updateMany(
        { userId, tags: tag.name },
        { $pull: { tags: tag.name } }
      );
      
      // 删除标签
      await Tag.deleteOne({ _id: tagId });
      
      return { success: true };
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  }
};

module.exports = tagService;
