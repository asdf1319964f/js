import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '../store';

// 导入视图组件
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
    meta: { guestOnly: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorites,
    meta: { requiresAuth: true }
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
    path: '*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

// 导航守卫 - 极简版本，避免任何可能的重定向循环
router.beforeEach((to, from, next) => {
  // 获取当前token，直接从localStorage读取，避免状态同步问题
  const token = localStorage.getItem('token');
  const hasToken = !!token;
  
  console.log(`[Router] 导航到: ${to.path}, 来自: ${from.path}, Token存在: ${hasToken}`);
  
  // 简化逻辑：只做最基本的鉴权判断
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 需要认证的页面
    if (!hasToken) {
      console.log(`[Router] 未登录，重定向到登录页`);
      // 未登录时，简单地跳转到登录页，保存重定向信息
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
    
    // 有token，直接通过
    console.log(`[Router] 已登录，允许访问: ${to.path}`);
    return next();
  } 
  else if (to.path === '/login') {
    // 登录页特殊处理
    if (hasToken && to.query.redirect) {
      // 已登录且有重定向参数，直接跳转到重定向地址
      const redirectPath = to.query.redirect;
      console.log(`[Router] 已登录用户访问登录页，重定向到: ${redirectPath}`);
      return next({ path: redirectPath, replace: true });
    } else if (hasToken) {
      // 已登录但没有重定向参数，跳转到收藏页
      console.log(`[Router] 已登录用户访问登录页，重定向到收藏页`);
      return next({ path: '/favorites', replace: true });
    }
    
    // 未登录访问登录页，正常通过
    console.log(`[Router] 未登录用户访问登录页，允许访问`);
    return next();
  }
  else {
    // 其他页面，直接通过
    console.log(`[Router] 访问普通页面: ${to.path}，允许访问`);
    return next();
  }
});

export default router;
