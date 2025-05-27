import axios from 'axios';

// 初始状态
const state = {
  favorites: [],
  favorite: null,
  loading: false,
  error: null,
  filters: {
    tags: [],
    type: null,
    search: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
};

// Getters
const getters = {
  allFavorites: state => state.favorites,
  currentFavorite: state => state.favorite,
  isLoading: state => state.loading,
  hasError: state => !!state.error,
  errorMessage: state => state.error,
  filters: state => state.filters,
  pagination: state => state.pagination
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
    state.filters = {
      tags: [],
      type: null,
      search: ''
    };
  },
  ADD_FAVORITE(state, favorite) {
    state.favorites.unshift(favorite);
  },
  UPDATE_FAVORITE(state, updatedFavorite) {
    const index = state.favorites.findIndex(f => f._id === updatedFavorite._id);
    if (index !== -1) {
      state.favorites.splice(index, 1, updatedFavorite);
    }
    if (state.favorite && state.favorite._id === updatedFavorite._id) {
      state.favorite = updatedFavorite;
    }
  },
  REMOVE_FAVORITE(state, id) {
    state.favorites = state.favorites.filter(f => f._id !== id);
    if (state.favorite && state.favorite._id === id) {
      state.favorite = null;
    }
  }
};

// Actions
const actions = {
  async fetchFavorites({ commit, state }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      // 构建查询参数
      const params = {
        page: state.pagination.page,
        limit: state.pagination.limit
      };
      
      if (state.filters.tags.length > 0) {
        params.tags = state.filters.tags.join(',');
      }
      
      if (state.filters.type) {
        params.type = state.filters.type;
      }
      
      if (state.filters.search) {
        params.search = state.filters.search;
      }
      
      const response = await axios.get('/api/favorites', { params });
      
      commit('SET_FAVORITES', response.data.favorites);
      commit('SET_PAGINATION', {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit
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
      const response = await axios.get(`/api/favorites/${id}`);
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
  
  async addTagToFavorite({ commit }, { favoriteId, tagId }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.post(`/api/favorites/${favoriteId}/tags`, { tagId });
      commit('UPDATE_FAVORITE', response.data);
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
        let errorMessage = '添加标签失败';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        }
        commit('SET_ERROR', errorMessage);
        commit('SET_LOADING', false);
        throw error;
    }
  },
  
  async removeTagFromFavorite({ commit }, { favoriteId, tagId }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.delete(`/api/favorites/${favoriteId}/tags/${tagId}`);
      commit('UPDATE_FAVORITE', response.data);
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
  
  async deleteFavorite({ commit }, id) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await axios.delete(`/api/favorites/${id}`);
      commit('REMOVE_FAVORITE', id);
      commit('SET_LOADING', false);
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
  
  setFilters({ commit, dispatch }, filters) {
    commit('SET_FILTERS', filters);
    commit('SET_PAGINATION', { page: 1 }); // 重置到第一页
    dispatch('fetchFavorites');
  },
  
  clearFilters({ commit, dispatch }) {
    commit('CLEAR_FILTERS');
    commit('SET_PAGINATION', { page: 1 }); // 重置到第一页
    dispatch('fetchFavorites');
  },
  
  setPage({ commit, dispatch }, page) {
    commit('SET_PAGINATION', { page });
    dispatch('fetchFavorites');
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
