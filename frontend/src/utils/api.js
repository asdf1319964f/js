// src/utils/api.js - 请确保这个文件的内容是这样的！
import axios from 'axios';
import store from '../store'; // 导入 Vuex store 以获取 token (用于拦截器)

const apiClient = axios.create({
  baseURL: '/api', // 后端 API 的基地址，前端请求会发到这里
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器，自动添加 JWT token
apiClient.interceptors.request.use(config => {
  // 确保在请求拦截器中，store 已经初始化
  const token = store.state.auth.token; // 从 auth 模块获取 token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 可选：添加响应拦截器处理通用错误，例如 401 Unauthorized
apiClient.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response && error.response.status === 401) {
    // 如果是认证失败，清除 token 并重定向到登录页
    // 注意：这里需要确保 store 已初始化且 dispatch 可用
    store.dispatch('auth/logout'); // 调用 auth 模块的 logout action
  }
  return Promise.reject(error);
});

export default apiClient; // 导出配置好的 Axios 实例