# Telegram多用户收藏夹查看系统 - 多账户版

这是一个基于Node.js开发的Telegram多用户收藏夹查看系统，支持多账户管理，完全不依赖Bot，只通过API直接访问您的Telegram收藏内容。

## 功能特点

- **多账户支持**：一个系统账号下可以管理多个Telegram账号
- **收藏夹查看**：浏览、搜索和管理您的Telegram收藏内容
- **标签管理**：为收藏内容添加标签，方便分类和查找
- **安全存储**：所有API凭证使用AES-256加密存储
- **响应式设计**：适配桌面和移动设备的界面

## 快速开始

### 环境要求

- Docker和Docker Compose
- Caddy或其他Web服务器（用于反向代理）

### 部署步骤

1. 解压项目包
2. 编辑`.env`文件（可选，已设置安全默认值）
3. 启动服务：
   ```bash
   docker-compose up -d
   ```
4. 在您的Caddy配置中添加反向代理规则：
   ```
   your-domain.com {
       reverse_proxy /api/* 127.0.0.1:3077
       reverse_proxy /* 127.0.0.1:8086
   }
   ```
5. 访问系统并注册一个账号
6. 在设置页面添加您的Telegram账号（API_ID、API_HASH、SESSION_STRING）

## 配置说明

系统已预设安全的默认配置，您可以直接使用，无需修改：

```
# MongoDB配置（已设置默认值）
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=telegram-favorites-secure-123

# JWT配置（已设置默认值）
JWT_SECRET=telegram-favorites-jwt-secret-key-2025
JWT_EXPIRES_IN=7d

# SESSION加密密钥（已设置默认值）
SESSION_ENCRYPTION_KEY=telegram-favorites-encryption-key-2025
```

如果您需要更高的安全性，建议在生产环境中修改这些默认值。

## 获取Telegram API凭证

1. 访问 https://my.telegram.org/auth
2. 登录您的Telegram账号
3. 点击"API development tools"
4. 创建一个新应用，填写应用信息
5. 获取API_ID和API_HASH

## 获取SESSION_STRING

您可以使用以下Python脚本获取SESSION_STRING：

```python
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

api_id = 您的API_ID
api_hash = '您的API_HASH'

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print(client.session.save())
```

## 多账户管理

1. 注册系统账号
2. 在设置页面添加Telegram账号
3. 切换不同的Telegram账号
4. 编辑或删除已添加的账号

## 常见问题

1. **如果遇到服务启动问题**：
   - 检查日志：`docker-compose logs backend`
   - 确保MongoDB服务正常运行

2. **如果需要重新构建**：
   - 使用 `docker-compose build --no-cache`

3. **如果遇到权限问题**：
   - 确保uploads目录有正确的权限

## 安全建议

虽然系统已设置默认配置，但在生产环境中，我们强烈建议您：

1. 修改默认的MongoDB密码
2. 修改默认的JWT密钥
3. 修改默认的SESSION加密密钥
4. 限制API访问范围
5. 使用HTTPS确保传输安全
# js
