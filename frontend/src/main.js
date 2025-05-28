import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

// 导入Bootstrap 4 和 BootstrapVue CSS文件
// 确保这里引入的是与 package.json 匹配的 Bootstrap 4 版本
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
// 额外导入 Bootstrap Icons CSS，因为 App.vue 和其他组件会用到
import 'bootstrap-icons/font/bootstrap-icons.css';


// 安装BootstrapVue
Vue.use(BootstrapVue);
// 安装BootstrapVue图标组件
Vue.use(IconsPlugin); // 允许使用 <b-icon> 组件，但您在模板中直接使用了 <i> 标签的 bi-* 类


// Vue CLI 会自动处理这个，但在纯净的 SPA 中，如果生产环境没配对，会弹出提示
Vue.config.productionTip = false;

// 添加 Axios 请求拦截器，自动添加 JWT Token
import axios from 'axios';
axios.interceptors.request.use(config => {
  const token = store.state.auth.token; // 从 Vuex store 获取 token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // 添加 Authorization 头
  }
  return config;
}, error => {
  return Promise.reject(error); // 拒绝请求 Promise
});

// 添加 Axios 响应拦截器，处理 401 Unauthorized 错误
axios.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response && error.response.status === 401) {
    // 检查是否在登录页，避免循环重定向
    if (router.currentRoute.path !== '/login') {
      store.dispatch('auth/logout'); // 调用 Vuex 的 logout action 清除 token
      router.push({ path: '/login', query: { redirect: router.currentRoute.fullPath } }); // 重定向到登录页
      // 使用 BootstrapVue 的 Toast 提示用户
      Vue.prototype.$bvToast.toast('您的会话已过期，请重新登录。', {
        title: '认证失败',
        variant: 'danger',
        solid: true
      });
    }
  }
  return Promise.reject(error);
});


// 定义全局帮助函数或过滤器
// 截断文本
Vue.filter('truncate', function (text, length) {
  if (!text) return '';
  return text.length > length
    ? text.substring(0, length) + '...'
    : text;
});

// 日期格式化
Vue.filter('formatDate', function (dateString, options = {}) {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
});


// 创建 Vue 实例
new Vue({
  router, // 注入 Vue Router
  store,  // 注入 Vuex store
  render: h => h(App) // 渲染 App 根组件
}).$mount('#app'); // 将 Vue 实例挂载到 public/index.html 中的 <div id="app"></div> 元素上