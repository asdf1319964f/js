const jwt = require('jsonwebtoken');
const config = require('../config/config');

// 认证中间件
const authMiddleware = {
  // 验证JWT令牌
  verifyToken: (req, res, next) => {
    try {
      // 获取请求头中的Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ message: '未提供认证令牌' });
      }
      
      // 提取令牌
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: '无效的认证令牌格式' });
      }
      
      // 验证令牌
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // 将用户ID添加到请求对象
      req.userId = decoded.id;
      req.telegramId = decoded.telegramId;
      
      next();
    } catch (error) {
      console.error('令牌验证失败:', error);
      return res.status(401).json({ message: '无效的认证令牌' });
    }
  }
};

module.exports = authMiddleware;
