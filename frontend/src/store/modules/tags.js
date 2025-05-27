import axios from 'axios';

// 初始状态
const state = {
  tags: [],
  loading: false,
  error: null
};

// Getters
const getters = {
  allTags: state => state.tags,
  isLoading: state => state.loading,
  hasError: state => !!state.error,
  errorMessage: state => state.error
};

// Mutations
const mutations = {
  SET_TAGS(state, tags) {
    state.tags = tags;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  ADD_TAG(state, tag) {
    state.tags.push(tag);
  },
  UPDATE_TAG(state, updatedTag) {
    const index = state.tags.findIndex(t => t._id === updatedTag._id);
    if (index !== -1) {
      state.tags.splice(index, 1, updatedTag);
    }
  },
  REMOVE_TAG(state, id) {
    state.tags = state.tags.filter(t => t._id !== id);
  }
};

// Actions
const actions = {
  async fetchTags({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.get('/api/tags');
      commit('SET_TAGS', response.data);
      commit('SET_LOADING', false);
    } catch (error) {
      let errorMessage = '获取标签失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async createTag({ commit }, tagData) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.post('/api/tags', tagData);
      commit('ADD_TAG', response.data);
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '创建标签失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async updateTag({ commit }, { id, tagData }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await axios.put(`/api/tags/${id}`, tagData);
      commit('UPDATE_TAG', response.data);
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '更新标签失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async deleteTag({ commit }, id) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await axios.delete(`/api/tags/${id}`);
      commit('REMOVE_TAG', id);
      commit('SET_LOADING', false);
    } catch (error) {
      let errorMessage = '删除标签失败';
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
  state,
  getters,
  actions,
  mutations
};
