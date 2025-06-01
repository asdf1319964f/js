const Favorite = require('../models/Favorite');
const Tag = require('../models/Tag');

// 收藏内容服务
const favoriteService = {
  // 获取用户收藏列表
  async getFavorites(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        tags, 
        category, 
        search,
        sortBy = 'savedAt',
        sortOrder = 'desc'
      } = options;
      
      // 构建查询条件
      const query = { userId };
      
      // 按类型过滤
      if (type) {
        query.type = type;
      }
      
      // 按标签过滤
      if (tags && tags.length > 0) {
        query.tags = { $all: Array.isArray(tags) ? tags : [tags] };
      }
      
      // 按分类过滤
      if (category) {
        query.category = category;
      }
      
      // 搜索功能
      if (search) {
        query.$text = { $search: search };
      }
      
      // 构建排序条件
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // 执行分页查询
      const skip = (page - 1) * limit;
      
      const [favorites, total] = await Promise.all([
        Favorite.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Favorite.countDocuments(query)
      ]);
      
      // 计算总页数
      const totalPages = Math.ceil(total / limit);
      
      return {
        favorites,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      };
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      throw error;
    }
  },
  
  // 获取单个收藏详情
  async getFavoriteById(favoriteId, userId) {
    try {
      const favorite = await Favorite.findOne({
        _id: favoriteId,
        userId
      });
      
      if (!favorite) {
        throw new Error('收藏不存在或无权访问');
      }
      
      return favorite;
    } catch (error) {
      console.error('获取收藏详情失败:', error);
      throw error;
    }
  },
  
  // 更新收藏标签
  async updateFavoriteTags(favoriteId, userId, tags) {
    try {
      const favorite = await Favorite.findOne({
        _id: favoriteId,
        userId
      });
      
      if (!favorite) {
        throw new Error('收藏不存在或无权访问');
      }
      
      // 获取旧标签
      const oldTags = favorite.tags || [];
      
      // 更新收藏标签
      favorite.tags = tags;
      await favorite.save();
      
      // 更新标签计数
      // 减少旧标签计数
      for (const tagName of oldTags) {
        if (!tags.includes(tagName)) {
          await Tag.findOneAndUpdate(
            { userId, name: tagName },
            { $inc: { count: -1 } }
          );
          
          // 如果标签计数为0，删除标签
          await Tag.deleteOne({
            userId,
            name: tagName,
            count: { $lte: 0 }
          });
        }
      }
      
      // 增加新标签计数
      for (const tagName of tags) {
        if (!oldTags.includes(tagName)) {
          await Tag.findOneAndUpdate(
            { userId, name: tagName },
            { $inc: { count: 1 } },
            { upsert: true }
          );
        }
      }
      
      return favorite;
    } catch (error) {
      console.error('更新收藏标签失败:', error);
      throw error;
    }
  },
  
  // 删除收藏
  async deleteFavorite(favoriteId, userId) {
    try {
      const favorite = await Favorite.findOne({
        _id: favoriteId,
        userId
      });
      
      if (!favorite) {
        throw new Error('收藏不存在或无权访问');
      }
      
      // 更新标签计数
      const tags = favorite.tags || [];
      for (const tagName of tags) {
        await Tag.findOneAndUpdate(
          { userId, name: tagName },
          { $inc: { count: -1 } }
        );
        
        // 如果标签计数为0，删除标签
        await Tag.deleteOne({
          userId,
          name: tagName,
          count: { $lte: 0 }
        });
      }
      
      // 删除收藏
      await Favorite.deleteOne({ _id: favoriteId });
      
      return { success: true };
    } catch (error) {
      console.error('删除收藏失败:', error);
      throw error;
    }
  },
  
  // 获取用户收藏统计
  async getUserFavoriteStats(userId) {
    try {
      // 获取总收藏数
      const totalCount = await Favorite.countDocuments({ userId });
      
      // 按类型统计
      const typeStats = await Favorite.aggregate([
        { $match: { userId: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      
      // 按分类统计
      const categoryStats = await Favorite.aggregate([
        { $match: { userId: userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
      
      // 获取标签统计
      const tags = await Tag.find({ userId }).sort({ count: -1 });
      
      return {
        totalCount,
        typeStats: typeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        categoryStats: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        tags
      };
    } catch (error) {
      console.error('获取收藏统计失败:', error);
      throw error;
    }
  },
  
  // 搜索收藏
  async searchFavorites(userId, searchQuery, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20,
        type,
        category
      } = options;
      
      // 构建查询条件
      const query = { 
        userId,
        $text: { $search: searchQuery }
      };
      
      // 按类型过滤
      if (type) {
        query.type = type;
      }
      
      // 按分类过滤
      if (category) {
        query.category = category;
      }
      
      // 执行分页查询
      const skip = (page - 1) * limit;
      
      const [favorites, total] = await Promise.all([
        Favorite.find(query, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(parseInt(limit)),
        Favorite.countDocuments(query)
      ]);
      
      // 计算总页数
      const totalPages = Math.ceil(total / limit);
      
      return {
        favorites,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      };
    } catch (error) {
      console.error('搜索收藏失败:', error);
      throw error;
    }
  }
};

module.exports = favoriteService;
