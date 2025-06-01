// src/store/modules/favorites.js
import apiClient from '../../utils/api'; // 使用封装后的 Axios 实例

// 初始状态
const state = {
  favorites: [], // 收藏内容列表
  favorite: null, // 单个收藏详情
  loading: false, // 加载状态
  error: null, // 错误信息
  // 过滤器和分页状态
  filters: {
    tags: [],      // 按标签过滤 (数组)
    type: null,    // 按内容类型过滤 (字符串)
    category: null, // 按分类过滤 (字符串)
    search: null,  // 搜索关键字 (字符串)
    sortBy: 'savedAt', // 排序字段
    sortOrder: 'desc' // 排序顺序 'asc'/'desc'
  },
  pagination: {
    page: 1,      // 当前页码
    limit: 20,    // 每页限制数量
    total: 0,     // 总条目数
    totalPages: 0 // 总页数
  }
};

// Getters
const getters = {
  allFavorites: state => state.favorites,
  currentFavorite: state => state.favorite,
  isLoading: state => state.loading,
  hasError: state => !!state.error,
  errorMessage: state => state.error,
  currentFilters: state => state.filters, // 重命名以避免与组件 data 冲突
  currentPagination: state => state.pagination // 重命名以避免与组件 data 冲突
};

// Mutations
const mutations = {
  SET_FAVORITES(state, favorites) {
    state.favorites = favorites;
  },
  SET_FAVORITE(state, favorite) {
    state.favorite = favorite;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters };
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination };
  },
  CLEAR_FILTERS(state) {
    state.filters = { // 重置为初始默认值
      tags: [],
      type: null,
      search: null,
      category: null,
      sortBy: 'savedAt',
      sortOrder: 'desc'
    };
  },
  ADD_FAVORITE(state, favorite) {
    state.favorites.unshift(favorite); // 新增的收藏通常显示在最前面
    state.pagination.total++; // 更新总数
  },
  UPDATE_FAVORITE(state, updatedFavorite) {
    const index = state.favorites.findIndex(f => f._id === updatedFavorite._id);
    if (index !== -1) {
      state.favorites.splice(index, 1, updatedFavorite);
    }
    // 如果当前正在查看这个收藏的详情页，也更新它
    if (state.favorite && state.favorite._id === updatedFavorite._id) {
      state.favorite = updatedFavorite;
    }
  },
  REMOVE_FAVORITE(state, id) {
    state.favorites = state.favorites.filter(f => f._id !== id);
    state.pagination.total--; // 更新总数
    // 如果当前正在查看这个收藏的详情页，清除它
    if (state.favorite && state.favorite._id === id) {
      state.favorite = null;
    }
  }
};

// Actions
const actions = {
  async fetchFavorites({ commit, state, rootGetters }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // 构造查询参数
      const params = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder
      };

      if (state.filters.tags && state.filters.tags.length > 0) {
        // 后端期望 comma-separated string
        params.tags = state.filters.tags.join(',');
      }
      if (state.filters.type) {
        params.type = state.filters.type;
      }
      if (state.filters.category) {
        params.category = state.filters.category;
      }
      if (state.filters.search) { // 全文搜索参数
        params.search = state.filters.search;
      }

      const response = await apiClient.get('/favorites', { params });
      
      const { favorites, pagination } = response.data;
      
      commit('SET_FAVORITES', favorites);
      commit('SET_PAGINATION', {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages // 确保后端返回 totalPages
      });
      commit('SET_LOADING', false);
    } catch (error) {
      let errorMessage = '获取收藏列表失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  async fetchFavoriteById({ commit }, id) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.get(`/favorites/${id}`);
      commit('SET_FAVORITE', response.data);
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '获取收藏详情失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // 增加/更新收藏的标签 (后端 API 是替换所有标签)
  async updateFavoriteTags({ commit }, { favoriteId, tags }) { // tags 是一个数组
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // 后端 updateFavoriteTags 服务是替换所有标签
      const response = await apiClient.post(`/favorites/${favoriteId}/tags`, { tags }); // 注意：后端 tagRoutes POST /:id/tags 期望 body: { tags: [...] }
      commit('UPDATE_FAVORITE', response.data);
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '更新收藏标签失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  // 从收藏中移除单个标签
  async removeTagFromFavorite({ commit }, { favoriteId, tagName }) { // tagName 是字符串
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // 后端 DELETE /api/favorites/:id/tags/:tagId 期望 :tagId 是标签名称字符串
      const response = await apiClient.delete(`/favorites/${favoriteId}/tags/${tagName}`);
      commit('UPDATE_FAVORITE', response.data); // 后端返回更新后的 Favorite
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '移除标签失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  async deleteFavorite({ commit, dispatch }, id) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      await apiClient.delete(`/favorites/${id}`);
      commit('REMOVE_FAVORITE', id);
      commit('SET_LOADING', false);
      // 如果删除后当前页不满，尝试加载上一页
      if (state.favorites.length === 0 && state.pagination.page > 1) {
        commit('SET_PAGINATION', { page: state.pagination.page - 1 });
        dispatch('fetchFavorites');
      } else {
        // 重新获取当前页，确保分页总数更新
        dispatch('fetchFavorites');
      }
    } catch (error) {
      let errorMessage = '删除收藏失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // 更新过滤器并重新获取收藏
  updateFiltersAndFetch({ commit, dispatch }, newFilters) {
    commit('SET_FILTERS', newFilters);
    commit('SET_PAGINATION', { page: 1 }); // 过滤器改变时重置到第一页
    dispatch('fetchFavorites');
  },

  // 清除所有过滤器并重新获取收藏
  clearAllFilters({ commit, dispatch }) {
    commit('CLEAR_FILTERS');
    commit('SET_PAGINATION', { page: 1 });
    dispatch('fetchFavorites');
  },

  // 改变当前页码并重新获取收藏
  setPage({ commit, dispatch }, page) {
    commit('SET_PAGINATION', { page });
    dispatch('fetchFavorites');
  }
};

export default {
  namespaced: true, // 启用命名空间
  state,
  getters,
  actions,
  mutations
};