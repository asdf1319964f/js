// backend/services/tagService.js

const Tag = require('../models/Tag'); // 标签模型
const Favorite = require('../models/Favorite'); // 导入 Favorite 模型，用于 deleteTag 方法

// 标签服务
const tagService = {
  // 获取用户所有标签
  async getTags(userId) { // <-- 函数名已修正为 getTags
    try {
      const tags = await Tag.find({ userId }).sort({ count: -1 });
      return tags;
    } catch (error) {
      console.error('获取标签列表失败:', error);
      throw error;
    }
  },
  
  // 创建新标签
  // 修正：参数由 tagName 改为 tagData，并从 tagData 中解构出 name 和 color
  async createTag(userId, tagData) { 
    const { name, color } = tagData; // <-- 关键修改：解构出 name 和 color

    try {
      // 检查标签是否已存在
      const existingTag = await Tag.findOne({ userId, name: name }); // <-- 使用解构出的 name
      
      if (existingTag) {
        return existingTag; // 如果已存在，返回现有标签
      }
      
      // 创建新标签
      const newTag = new Tag({
        userId,
        name: name, // <-- 使用解构出的 name
        color: color, // <-- 添加 color 字段
        count: 0 // 初始化计数
      });
      
      await newTag.save();
      return newTag;
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
    }
  },
  
  // 更新标签
  async updateTag(tagId, userId, updateData) { 
    const { name, color } = updateData; // <-- 解构出 name 和 color

    try {
      const tag = await Tag.findOne({
        _id: tagId,
        userId
      });
      
      if (!tag) {
        throw new Error('标签不存在或无权访问');
      }
      
      // 检查新名称是否已存在
      if (name !== undefined && name !== tag.name) { 
        const existingTag = await Tag.findOne({ userId, name: name });
        
        if (existingTag) {
          throw new Error('标签名称已存在');
        }
      }
      
      // 更新标签名称和颜色
      if (name !== undefined) {
        tag.name = name;
      }
      if (color !== undefined) {
        tag.color = color;
      }

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