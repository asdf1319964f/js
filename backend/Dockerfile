# 后端Dockerfile
FROM node:14-alpine

# 创建应用目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 安装FFmpeg
RUN apk add --no-cache ffmpeg

# 创建上传目录
RUN mkdir -p /app/uploads

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 3077

# 启动应用
CMD ["node", "src/server.js"]
