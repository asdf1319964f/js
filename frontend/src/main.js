import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

// 导入Bootstrap和BootstrapVue CSS文件
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

// 安装BootstrapVue
Vue.use(BootstrapVue);
// 安装BootstrapVue图标组件
Vue.use(IconsPlugin);

Vue.config.productionTip = false;

// 添加axios请求拦截器，自动添加token
import axios from 'axios';
axios.interceptors.request.use(config => {
  const token = store.state.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 创建Vue实例
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
