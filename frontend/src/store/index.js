// src/store/index.js
import Vue from 'vue';
import Vuex from 'vuex';
import auth from './modules/auth';       // 导入认证模块
import favorites from './modules/favorites'; // 导入收藏夹模块
import tags from './modules/tags';       // 导入标签模块

Vue.use(Vuex);

export default new Vuex.Store({
  // 注册所有模块，默认启用命名空间
  modules: {
    auth,
    favorites,
    tags
  }
});