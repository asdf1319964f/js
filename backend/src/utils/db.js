const mongoose = require('mongoose');
const config = require('../config/config');

// 数据库连接函数
const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('MongoDB 连接成功');
  } catch (err) {
    console.error('MongoDB 连接失败:', err.message);
    // 如果连接失败，10秒后重试
    setTimeout(connectDB, 10000);
  }
};

module.exports = connectDB;
