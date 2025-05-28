require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3077,
    env: process.env.NODE_ENV || 'development',
  },
  
  // 数据库配置
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:password@mongo:27017/telegram-favorites?authSource=admin',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'telegram-favorites-jwt-secret-key-2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Telegram API配置
  telegram: {
    apiId: process.env.TELEGRAM_API_ID,
    apiHash: process.env.TELEGRAM_API_HASH,
    sessionString: process.env.SESSION_STRING,
  },
  
  // 文件存储配置
  storage: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 50 * 1024 * 1024, // 50MB
  },
  
  // 跨域配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
};
