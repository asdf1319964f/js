// backend/middlewares/authMiddleware.js

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
      const decoded = jwt.verify(token, config.jwt.secret); // <-- 错误通常发生在这里
      
      // 将用户ID添加到请求对象
      req.userId = decoded.id;
      // 注意：decoded.telegramId 可能不存在于旧的token中，或如果用户未绑定Telegram
      // req.telegramId = decoded.telegramId; 
      
      next();
    } catch (error) {
      // ***** 关键修改：在这里添加更详细的错误日志 *****
      console.error('令牌验证失败的详细错误信息:', {
        message: error.message,      // 错误消息 (例如: TokenExpiredError, invalid signature)
        name: error.name,            // 错误名称 (例如: TokenExpiredError, JsonWebTokenError)
        stack: error.stack,          // 错误堆栈
        expiredAt: error.expiredAt,  // 如果是 TokenExpiredError，会有过期时间
        // token: token,             // 生产环境请勿打印完整 token，调试时可短时开启
        jwtSecretLength: config.jwt.secret ? config.jwt.secret.length : 'undefined' // 打印密钥长度以检查配置
      });
      // ***********************************************
      // 根据具体 JWT 错误类型返回不同状态码给前端（可选，但更精确）
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '认证令牌已过期，请重新登录' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: '无效的认证令牌，请重新登录' });
      } else {
        return res.status(401).json({ message: '认证失败' }); // 通用认证失败
      }
    }
  }
};

module.exports = authMiddleware;