const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config/config');

// 连接数据库
mongoose.connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('MongoDB连接成功');
  })
  .catch(err => {
    console.error('MongoDB连接失败:', err);
    process.exit(1);
  });

// 启动服务器
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    mongoose.connection.close(false, () => {
      console.log('MongoDB连接已关闭');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    mongoose.connection.close(false, () => {
      console.log('MongoDB连接已关闭');
      process.exit(0);
    });
  });
});
