const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config/config');
const authMiddleware = require('./middlewares/authMiddleware');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const tagRoutes = require('./routes/tagRoutes');
const userRoutes = require('./routes/userRoutes');

// 创建Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(config.cors));

// 静态文件服务
app.use('/media', express.static(path.join(process.cwd(), config.storage.uploadDir)));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/favorites', authMiddleware.verifyToken, favoriteRoutes);
app.use('/api/tags', authMiddleware.verifyToken, tagRoutes);
app.use('/api/user', authMiddleware.verifyToken, userRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
