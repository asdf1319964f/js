import axios from 'axios';

// 初始状态
const state = {
  token: localStorage.getItem('token') || null,
  user: null,
  accounts: [],
  activeAccount: null,
  loading: false,
  error: null
};

// Getters
const getters = {
  isAuthenticated: state => !!state.token,
  currentUser: state => state.user,
  telegramAccounts: state => state.accounts,
  activeAccount: state => state.activeAccount,
  hasActiveAccount: state => !!state.activeAccount,
  isLoading: state => state.loading,
  hasError: state => !!state.error,
  errorMessage: state => state.error
};

// Mutations
const mutations = {
  SET_TOKEN(state, token) {
    state.token = token;
  },
  SET_USER(state, user) {
    state.user = user;
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
      state.accounts.splice(index, 1, updatedAccount);
    }
  },
  REMOVE_ACCOUNT(state, accountId) {
    state.accounts = state.accounts.filter(acc => acc.id !== accountId);
    if (state.activeAccount && state.activeAccount.id === accountId) {
      state.activeAccount = state.accounts.find(acc => acc.isActive) || null;
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
  }
};

// Actions
const actions = {
  // 注册新用户
  async register({ commit }, userData) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.post('/api/auth/register', userData);
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '注册失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  // 用户登录
  async login({ commit }, credentials) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
      
      if (user.accounts && user.accounts.length > 0) {
        commit('SET_ACCOUNTS', user.accounts);
        const activeAccount = user.accounts.find(acc => acc.isActive);
        if (activeAccount) {
          commit('SET_ACTIVE_ACCOUNT', activeAccount);
        }
      }
      
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '登录失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  // 获取当前用户信息
  async fetchCurrentUser({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.get('/api/auth/me');
      const userData = response.data;
      
      commit('SET_USER', userData);
      
      if (userData.accounts && userData.accounts.length > 0) {
        commit('SET_ACCOUNTS', userData.accounts);
        const activeAccount = userData.accounts.find(acc => acc.isActive);
        if (activeAccount) {
          commit('SET_ACTIVE_ACCOUNT', activeAccount);
        }
      }
      
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
      const response = await axios.post('/api/user/accounts', accountData);
      const newAccount = response.data;
      
      commit('ADD_ACCOUNT', newAccount);
      
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
      const response = await axios.post(`/api/user/accounts/${accountId}/activate`);
      const { token, account } = response.data;
      
      // 更新token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      commit('SET_TOKEN', token);
      
      // 更新账号状态
      commit('SET_ACCOUNTS', state.accounts.map(acc => ({
        ...acc,
        isActive: acc.id === accountId
      })));
      
      commit('SET_ACTIVE_ACCOUNT', account);
      commit('SET_LOADING', false);
      
      return account;
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
  
  // 更新Telegram账号
  async updateTelegramAccount({ commit }, { accountId, updateData }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.put(`/api/user/accounts/${accountId}`, updateData);
      const updatedAccount = response.data;
      
      commit('UPDATE_ACCOUNT', updatedAccount);
      
      if (updatedAccount.isActive) {
        commit('SET_ACTIVE_ACCOUNT', updatedAccount);
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
      const response = await axios.delete(`/api/user/accounts/${accountId}`);
      const { token, remainingAccounts } = response.data;
      
      commit('REMOVE_ACCOUNT', accountId);
      
      // 如果返回了新token（删除的是活跃账号），更新token
      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        commit('SET_TOKEN', token);
        
        // 更新活跃账号
        const newActiveAccount = remainingAccounts.find(acc => acc.isActive);
        if (newActiveAccount) {
          commit('SET_ACTIVE_ACCOUNT', newActiveAccount);
        } else {
          commit('SET_ACTIVE_ACCOUNT', null);
        }
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
  
  // 同步收藏
  async syncFavorites({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.post('/api/user/sync');
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '同步收藏失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  // 更新用户设置
  async updateUserSettings({ commit }, settings) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.put('/api/user/settings', settings);
      
      // 更新用户设置
      commit('SET_USER', {
        ...state.user,
        settings: response.data
      });
      
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '更新设置失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  // 清除错误
  clearError({ commit }) {
    commit('SET_ERROR', null);
  },
  
  // 登出
  logout({ commit }) {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    commit('LOGOUT');
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
