// src/store/modules/auth.js
import apiClient from '../../utils/api'; // 使用封装后的 Axios 实例
import router from '../../router'; // 导入 Vue Router 实例

// 初始状态
const state = {
  token: localStorage.getItem('token') || null, // 从 localStorage 初始化 token
  user: null, // 当前用户信息
  accounts: [], // 用户的 Telegram 账号列表
  activeAccount: null, // 当前活跃的 Telegram 账号
  loading: false, // 全局加载状态
  error: null, // 全局错误信息
  sessionStatus: 'idle', // 'idle', 'connecting', 'active', 'error'
  sessionError: null,
  syncLoading: false, // 同步收藏的加载状态
  lastSyncTime: null // 上次同步时间
};

// Getters
const getters = {
  isAuthenticated: state => !!state.token,
  currentUser: state => state.user,
  username: state => (state.user ? state.user.username : ''), // 获取用户名
  telegramAccounts: state => state.accounts,
  activeAccount: state => state.activeAccount,
  hasActiveAccount: state => !!state.activeAccount,
  isLoading: state => state.loading,
  hasError: state => !!state.error,
  errorMessage: state => state.error,
  sessionStatus: state => state.sessionStatus,
  sessionError: state => state.sessionError,
  syncLoading: state => state.syncLoading,
  lastSyncTime: state => state.lastSyncTime
};

// Mutations
const mutations = {
  SET_TOKEN(state, token) {
    state.token = token;
  },
  SET_USER(state, user) {
    state.user = user;
    if (user && user.accounts) {
      state.accounts = user.accounts;
      state.activeAccount = user.accounts.find(acc => acc.isActive) || null;
    }
  },
  SET_ACCOUNTS(state, accounts) {
    state.accounts = accounts;
  },
  SET_ACTIVE_ACCOUNT(state, account) {
    state.activeAccount = account;
  },
  ADD_ACCOUNT(state, account) {
    state.accounts.push(account);
  },
  UPDATE_ACCOUNT(state, updatedAccount) {
    const index = state.accounts.findIndex(acc => acc.id === updatedAccount.id);
    if (index !== -1) {
      // 保持 isActive 属性，避免在渲染时闪烁
      state.accounts.splice(index, 1, { ...updatedAccount, isActive: state.accounts[index].isActive });
    }
    // 如果更新的是活跃账号，也更新活跃账号状态
    if (state.activeAccount && state.activeAccount.id === updatedAccount.id) {
      state.activeAccount = { ...state.activeAccount, ...updatedAccount };
    }
  },
  REMOVE_ACCOUNT(state, accountId) {
    state.accounts = state.accounts.filter(acc => acc.id !== accountId);
    if (state.activeAccount && state.activeAccount.id === accountId) {
      // 移除活跃账号后，尝试设置第一个为新的活跃账号
      state.activeAccount = state.accounts[0] || null;
      if (state.activeAccount) {
        state.activeAccount.isActive = true; // 理论上后端会返回新的活跃状态
      }
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  LOGOUT(state) {
    state.token = null;
    state.user = null;
    state.accounts = [];
    state.activeAccount = null;
    state.loading = false;
    state.error = null;
    state.sessionStatus = 'idle';
    state.sessionError = null;
    state.syncLoading = false;
    state.lastSyncTime = null;
  },
  SET_SESSION_STATUS(state, status) {
    state.sessionStatus = status;
  },
  SET_SESSION_ERROR(state, error) {
    state.sessionError = error;
  },
  SET_SYNC_LOADING(state, loading) {
    state.syncLoading = loading;
  },
  SET_LAST_SYNC_TIME(state, time) {
    state.lastSyncTime = time;
  }
};

// Actions
const actions = {
  // 初始化认证状态 (应用启动时调用)
  async initializeAuth({ commit, dispatch, state }) {
    if (state.token && !state.user) { // 只有当 token 存在但 user 数据未加载时才尝试加载
      try {
        await dispatch('fetchCurrentUser'); // 尝试获取用户信息
        // 如果成功获取用户信息，则认证状态已恢复
      } catch (error) {
        console.error('初始化认证失败，token 可能无效:', error);
        dispatch('logout'); // token 无效，执行登出
      }
    }
  },

  // 注册新用户
  async register({ commit }, userData) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.post('/auth/register', userData);
      commit('SET_LOADING', false);
      // 注册成功后，不直接登录，返回结果让组件处理
      return response.data;
    } catch (error) {
      let errorMessage = '注册失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error; // 抛出错误以便组件处理
    }
  },

  // 用户登录
  async login({ commit, dispatch }, credentials) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, user } = response.data;

      localStorage.setItem('token', token); // 保存 token 到 localStorage
      // 不需要在这里设置 axios.defaults.headers.common，因为 api.js 已经有请求拦截器
      
      commit('SET_TOKEN', token); // 更新 Vuex 状态
      commit('SET_USER', user); // 更新 Vuex 用户信息

      commit('SET_LOADING', false);
      return response.data; // 返回数据给组件，可能包含用户和 token
    } catch (error) {
      let errorMessage = '登录失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error; // 抛出错误以便组件处理
    }
  },

  // 获取当前用户信息
  async fetchCurrentUser({ commit, state }) {
    // 只有在 token 存在且用户数据不存在时才加载，或者明确需要刷新时
    if (!state.token) {
        throw new Error('未认证用户');
    }
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.get('/auth/me');
      const userData = response.data;

      commit('SET_USER', userData); // 更新用户信息和账号列表

      commit('SET_LOADING', false);
      return userData;
    } catch (error) {
      let errorMessage = '获取用户信息失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // 添加Telegram账号
  async addTelegramAccount({ commit }, accountData) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.post('/user/accounts', accountData);
      const newAccount = response.data; // 后端返回新添加的账号信息
      
      // 添加到账号列表
      commit('ADD_ACCOUNT', newAccount); 
      // 如果新添加的账号被设置为活跃，更新活跃账号
      if (newAccount.isActive) {
        commit('SET_ACTIVE_ACCOUNT', newAccount);
      }

      commit('SET_LOADING', false);
      return newAccount;
    } catch (error) {
      let errorMessage = '添加Telegram账号失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // 切换活跃Telegram账号
  async switchTelegramAccount({ commit }, accountId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // 注意：后端 /api/user/accounts/:accountId/activate 路由是 POST 方法
      const response = await apiClient.post(`/user/accounts/${accountId}/activate`);
      const { token, account: newActiveAccountData } = response.data; // 后端返回新 token 和新的活跃账号信息

      // 更新 token
      localStorage.setItem('token', token);
      // api.js 中的请求拦截器会处理 axios.defaults.headers.common['Authorization']
      commit('SET_TOKEN', token);

      // 更新所有账号的活跃状态
      commit('SET_ACCOUNTS', state.accounts.map(acc => ({
        ...acc,
        isActive: acc.id === accountId // 确保只有当前切换的账号是活跃的
      })));
      commit('SET_ACTIVE_ACCOUNT', newActiveAccountData); // 更新活跃账号

      commit('SET_LOADING', false);
      return newActiveAccountData;
    } catch (error) {
      let errorMessage = '切换Telegram账号失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // 更新Telegram账号信息 (仅更新部分字段，如 name, apiId, apiHash, sessionString)
  async updateTelegramAccount({ commit }, { accountId, updateData }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.put(`/user/accounts/${accountId}`, updateData);
      const updatedAccount = response.data;

      commit('UPDATE_ACCOUNT', updatedAccount); // 更新 Vuex 中的账号列表
      // 如果更新的是活跃账号，也更新活跃账号状态
      if (state.activeAccount && state.activeAccount.id === updatedAccount.id) {
        commit('SET_ACTIVE_ACCOUNT', { ...state.activeAccount, ...updatedAccount });
      }

      commit('SET_LOADING', false);
      return updatedAccount;
    } catch (error) {
      let errorMessage = '更新Telegram账号失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // 删除Telegram账号
  async deleteTelegramAccount({ commit }, accountId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.delete(`/user/accounts/${accountId}`);
      const { token, remainingAccounts } = response.data; // 后端返回新 token 和剩余账号列表

      commit('REMOVE_ACCOUNT', accountId); // 从 Vuex 状态中移除账号

      // 如果后端返回了新 token (因为删除了活跃账号)，则更新 token
      if (token) {
        localStorage.setItem('token', token);
        // api.js 中的请求拦截器会处理 axios.defaults.headers.common['Authorization']
        commit('SET_TOKEN', token);
      }
      // 后端应该在 remainingAccounts 中设置新的活跃账号，如果它返回了的话
      // 否则，这里根据 removeAccount mutation 的逻辑处理活跃账号
      // 注意：这里需要确保 SET_USER 和 SET_ACCOUNTS 的同步更新
      if (remainingAccounts) {
          commit('SET_ACCOUNTS', remainingAccounts);
          commit('SET_ACTIVE_ACCOUNT', remainingAccounts.find(acc => acc.isActive) || null);
      }


      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '删除Telegram账号失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // 清除错误信息
  clearError({ commit }) {
    commit('SET_ERROR', null);
  },

  // 用户登出
  logout({ commit }) {
    localStorage.removeItem('token'); // 清除 localStorage 中的 token
    // api.js 中的请求拦截器会处理 axios.defaults.headers.common['Authorization'] 的删除

    commit('LOGOUT'); // 更新 Vuex 状态
    router.push('/login'); // 重定向到登录页
  },

  // 同步收藏 (用户手动触发)
  async syncFavorites({ commit }) {
    commit('SET_SYNC_LOADING', true); // 使用单独的同步加载状态
    commit('SET_SESSION_ERROR', null); // 清除会话错误

    try {
      const response = await apiClient.post('/user/sync');
      // 假设后端返回 { count: syncedCount, lastSyncTime: date }
      commit('SET_LAST_SYNC_TIME', new Date().toISOString()); // 假设同步成功立即更新时间
      commit('SET_SYNC_LOADING', false);
      
      // 可以在这里添加一些更新收藏列表的 dispatch
      // dispatch('favorites/fetchFavorites', null, { root: true }); // 同步后刷新收藏列表

      return response.data;
    } catch (error) {
      let errorMessage = '同步收藏失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_SESSION_ERROR', errorMessage); // 使用 sessionError 来显示同步错误
      commit('SET_SYNC_LOADING', false);
      throw error;
    }
  },

  // 更新用户设置
  async updateUserSettings({ commit }, settings) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.put('/user/settings', settings);
      const updatedSettings = response.data;

      // 更新用户设置 (注意：只更新 user 对象中的 settings 部分)
      commit('SET_USER', {
        ...state.user, // 保持 user 对象的其他属性不变
        settings: updatedSettings
      });

      commit('SET_LOADING', false);
      return updatedSettings;
    } catch (error) {
      let errorMessage = '更新设置失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  }
};

export default {
  namespaced: true, // 启用命名空间
  state,
  getters,
  actions,
  mutations
};