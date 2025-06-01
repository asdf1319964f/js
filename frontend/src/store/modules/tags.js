// src/store/modules/tags.js
import apiClient from '../../utils/api'; // 使用封装后的 Axios 实例

// 初始状态
const state = {
  tags: [], // 标签列表
  loading: false, // 加载状态
  error: null // 错误信息
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
    // 确保新标签添加到列表的正确位置，例如按计数排序
    const existingIndex = state.tags.findIndex(t => t._id === tag._id);
    if (existingIndex !== -1) {
      // 如果标签已存在 (例如后端返回了已存在的标签)，则更新它
      state.tags.splice(existingIndex, 1, tag);
    } else {
      state.tags.push(tag);
      // 可以根据 count 重新排序：state.tags.sort((a, b) => b.count - a.count);
    }
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
      // 后端 /api/tags 路由默认返回按 count 降序排序的标签
      const response = await apiClient.get('/tags');
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

  async createTag({ commit, dispatch }, tagData) { // tagData 包含 name 和可能有的 color
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.post('/tags', tagData);
      // 后端 createTag 服务会检查标签是否存在，如果存在会返回已存在的标签
      // 这里统一处理，如果后端返回了已存在的标签，就直接更新列表
      commit('ADD_TAG', response.data); // ADD_TAG mutation 现在会处理已存在的标签
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '创建标签失败';
      // 如果后端明确返回标签名称已存在，可以更精确地提示
      if (error.response && error.response.status === 400 && error.response.data && error.response.data.message === '用户名已存在') { // 假设后端返回此错误信息
        errorMessage = '标签名称已存在';
      } else if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      commit('SET_ERROR', errorMessage);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  async updateTag({ commit }, { id, tagData }) { // tagData 包含 name 和可能有的 color
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await apiClient.put(`/tags/${id}`, tagData);
      commit('UPDATE_TAG', response.data);
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      let errorMessage = '更新标签失败';
      // 如果后端明确返回标签名称已存在，可以更精确地提示
      if (error.response && error.response.status === 400 && error.response.data && error.response.data.message === '标签名称已存在') { // 假设后端返回此错误信息
        errorMessage = '标签名称已存在';
      } else if (error.response && error.response.data && error.response.data.message) {
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
      await apiClient.delete(`/tags/${id}`);
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
  namespaced: true, // 启用命名空间
  state,
  getters,
  actions,
  mutations
};