// src/main.js
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

// 导入Bootstrap和BootstrapVue CSS文件
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // 确保这个也在这里导入

// 安装BootstrapVue
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.config.productionTip = false;

// ***** 删除或注释掉下面的 axios 拦截器代码 *****
// import axios from 'axios'; // 这一行也可以删除，因为不再直接使用 axios
// axios.interceptors.request.use(config => {
//   const token = store.state.auth.token;
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, error => {
//   return Promise.reject(error);
// });
// ***********************************************

// 创建Vue实例
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
