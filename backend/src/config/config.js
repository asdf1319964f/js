require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT, // 移除默认值，强制从 env 获取 (如果未设置，应用可能无法启动或报错)
    env: process.env.NODE_ENV, // 直接从环境变量获取，不设置硬编码默认值
  },
  
  // 数据库配置
  database: {
    uri: process.env.MONGODB_URI, // 移除硬编码默认值，强制从 env 获取 (如果未设置，应用将无法连接DB)
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET, // 移除硬编码默认值，强制从 env 获取 (如果未设置，JWT验证会失败)
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // 7d的默认值通常可以接受
  },
  
  // Telegram API配置
  telegram: {
    apiId: process.env.TELEGRAM_API_ID,
    apiHash: process.env.TELEGRAM_API_HASH,
    sessionString: process.env.SESSION_STRING, // 通常由后端加密存储，前端不直接操作
    botToken: process.env.TELEGRAM_BOT_TOKEN, // 强制从 env 获取
    sessionEncryptionKey: process.env.TELEGRAM_SESSION_ENCRYPTION_KEY, // 强制从 env 获取
  },
  
  // 文件存储配置
  storage: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads', // 这些路径和大小的默认值通常可以接受，因为它们不直接影响安全
    maxFileSize: process.env.MAX_FILE_SIZE || 50 * 1024 * 1024,
  },
  
  // 跨域配置
  cors: {
    origin: process.env.CORS_ORIGIN, // 移除硬编码默认值 '*'，强制从 env 获取 (如果未设置，CORS可能不会按预期工作)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
};