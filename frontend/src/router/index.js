// src/router/index.js
import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '../store'; // 导入 Vuex store

// 导入所有视图组件
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Favorites from '../views/Favorites.vue';
import FavoriteDetail from '../views/FavoriteDetail.vue';
import Tags from '../views/Tags.vue';
import Search from '../views/Search.vue';
import Settings from '../views/Settings.vue';
import NotFound from '../views/NotFound.vue';

Vue.use(VueRouter);

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true } // 只有访客可以访问
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorites,
    meta: { requiresAuth: true } // 需要认证才能访问
  },
  {
    path: '/favorites/:id',
    name: 'FavoriteDetail',
    component: FavoriteDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: Tags,
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '*', // 匹配所有未匹配的路径
    name: 'NotFound',
    component: NotFound
  }
];

const router = new VueRouter({
  mode: 'history', // 使用 HTML5 History 模式，需要服务器端配置（如 Nginx）
  base: process.env.BASE_URL, // 基础 URL，通常由 Vue CLI 自动配置
  routes
});

// 导航守卫 - 处理认证逻辑
router.beforeEach(async (to, from, next) => {
  // 确保 Vuex store 已经初始化认证状态 (例如，从 localStorage 恢复 token)
  // 在 Vuex 的 auth 模块中添加 initializeAuth action
  if (!store.getters['auth/isAuthenticated'] && localStorage.getItem('token')) {
    try {
      await store.dispatch('auth/initializeAuth');
    } catch (error) {
      console.error('初始化认证失败:', error);
      // 如果初始化失败（例如 token 无效），则清除 token 并重定向到登录页
      store.dispatch('auth/logout');
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }

  const isAuthenticated = store.getters['auth/isAuthenticated'];

  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 需要认证的页面
    if (!isAuthenticated) {
      // 未登录时，重定向到登录页，并带上当前尝试访问的路径作为 redirect 参数
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    } else {
      // 已登录，允许访问
      next();
    }
  } else if (to.matched.some(record => record.meta.guestOnly)) {
    // 只有访客可以访问的页面 (如登录页)
    if (isAuthenticated) {
      // 已登录用户访问访客专属页面，重定向到收藏页 (或 redirect 参数指定的页面)
      const redirectPath = to.query.redirect || '/favorites';
      next({ path: redirectPath, replace: true });
    } else {
      // 未登录，允许访问
      next();
    }
  } else {
    // 其他公共页面，直接允许访问
    next();
  }
});

export default router;