# Dockerfile (位于 frontend/ 目录下)

# 第一阶段：构建前端应用
FROM node:14-alpine AS build_stage

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
# 这样可以利用 Docker 缓存，如果依赖未变，则不会重新安装
COPY package.json ./
# 如果有 package-lock.json 或 yarn.lock 也复制
COPY package-lock.json ./ 

# 安装依赖
# --frozen-lockfile 确保使用 lock 文件中精确的依赖版本
# --production 仅安装生产依赖，但 Vue CLI build 通常需要 devDependencies
# 建议在构建阶段安装所有依赖，最终镜像只复制构建产物
RUN npm install

# 复制所有前端源代码
COPY . .

# 构建前端应用，生成静态文件到 dist 目录
# --no-lint 避免在构建时因 linting 错误而失败 (已在 package.json 中配置)
RUN npm run build


# 第二阶段：运行 Nginx 服务器
FROM nginx:alpine

# 复制 Nginx 配置文件
# 确保这个 nginx.conf 已经配置好对 SPA 的支持（例如 try_files $uri $uri/ /index.html;）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制编译好的前端静态文件
# dist 目录是 Vue CLI 构建产物，通常放在 /usr/share/nginx/html
COPY --from=build_stage /app/dist /usr/share/nginx/html

# 暴露 Nginx 监听的端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]