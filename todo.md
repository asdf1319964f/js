# Telegram多用户收藏夹查看系统 - 多账户支持开发计划

## 多账户功能实现

- [x] 确认用户需求：采用方案A，用户注册系统账号后可管理多组API凭证并随时切换
- [x] 设计并实现前端多账户登录与管理界面
  - [x] 修改登录页面，支持用户注册和登录
  - [x] 设计账户管理界面，允许添加/编辑/删除多个Telegram账号
  - [x] 实现账户切换功能
- [x] 升级后端用户模型与认证逻辑
  - [x] 修改User模型，支持存储多组API凭证
  - [x] 实现多账户认证和切换API
  - [x] 确保API凭证安全存储
- [x] 实现前后端多账户切换与会话隔离
  - [x] 实现账户切换时的状态管理
  - [x] 确保不同账户数据隔离
- [x] 创建并完善路由文件
  - [x] 添加authRoutes.js，实现用户注册、登录和认证API
  - [x] 添加userRoutes.js，实现多账户管理API
  - [x] 添加favoriteRoutes.js，实现收藏夹管理API
  - [x] 添加tagRoutes.js，实现标签管理API
- [x] 修正依赖和配置
  - [x] 在package.json中添加bcryptjs和crypto-js依赖
  - [x] 修正docker-compose.yml，移除SESSION_STRING环境变量
  - [x] 更新.env配置模板
- [x] 更新配置和文档
  - [x] 完善多账户使用说明
  - [x] 添加常见问题排查指南
- [ ] 打包与交付
  - [ ] 重新打包支持多账户的docker-compose包
  - [ ] 向用户发送新包和说明
