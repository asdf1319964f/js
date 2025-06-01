<template>
  <div class="search-page">
    <h1 class="my-4">搜索结果</h1>
    
    <b-card class="mb-4">
      <b-card-body>
        <div class="input-group">
          <b-form-input type="text" placeholder="输入搜索关键字..." v-model="searchQuery" @keyup.enter="performSearch"></b-form-input>
          <b-button variant="primary" type="button" @click="performSearch">
            <i class="bi bi-search me-1"></i> 搜索
          </b-button>
          <b-button variant="outline-secondary" type="button" @click="clearSearch">
            <i class="bi bi-x-lg"></i> 清除
          </b-button>
        </div>
      </b-card-body>
    </b-card>
    
    <div v-if="isLoading" class="text-center my-5">
      <b-spinner class="text-primary"></b-spinner>
      <p class="mt-2">正在搜索收藏内容...</p>
    </div>
    
    <b-alert v-else-if="hasError" show variant="danger">{{ errorMessage }}</b-alert>
    
    <div v-else-if="favorites.length === 0" class="text-center my-5 empty-state">
      <i class="bi bi-search display-1 text-muted"></i>
      <h3 class="mt-3">未找到相关收藏</h3>
      <p class="text-muted">请尝试不同的搜索关键字。</p>
    </div>
    
    <div v-else>
      <h4 class="mb-3">找到 {{ currentPagination.total }} 个结果</h4>
      <b-row class="row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <b-col v-for="favorite in favorites" :key="favorite._id">
          <b-card no-body class="h-100">
            <div class="card-img-top favorite-media" v-if="['photo', 'video', 'document', 'audio'].includes(favorite.type)">
              <div v-if="favorite.type === 'video'" class="video-thumbnail position-relative">
                <img :src="favorite.content.thumbnailUrl || videoPlaceholder" class="img-fluid" alt="视频缩略图">
                <div class="play-icon">
                  <i class="bi bi-play-circle-fill"></i>
                </div>
              </div>
              <img v-else-if="favorite.type === 'photo'" :src="favorite.content.url || imagePlaceholder" class="img-fluid" alt="图片">
              <div v-else-if="favorite.type === 'document'" class="text-center p-3 bg-light d-flex flex-column align-items-center justify-content-center h-100">
                <i class="bi bi-file-earmark-text display-4 text-primary"></i>
                <p class="mt-2 text-muted small">{{ favorite.content.fileName || '文档' }}</p>
              </div>
              <div v-else-if="favorite.type === 'audio'" class="text-center p-3 bg-light d-flex flex-column align-items-center justify-content-center h-100">
                <i class="bi bi-music-note-beamed display-4 text-secondary"></i>
                <p class="mt-2 text-muted small">{{ favorite.content.fileName || '音频' }}</p>
              </div>
            </div>
            <div v-else-if="favorite.type === 'link'" class="card-img-top text-center p-3 bg-light d-flex flex-column align-items-center justify-content-center h-100">
              <i class="bi bi-link-45deg display-4 text-info"></i>
              <p class="mt-2 text-muted small">{{ favorite.content.url | $_truncateText(50) }}</p>
            </div>
            <div v-else class="card-img-top text-center p-3 bg-light d-flex flex-column align-items-center justify-content-center h-100">
              <i class="bi bi-chat-quote display-4 text-secondary"></i>
            </div>
            
            <b-card-body>
              <b-card-title class="mb-2">
                {{ favorite.content.caption || favorite.content.text || '无标题' | $_truncateText(50) }}
              </b-card-title>
              <b-card-text class="text-muted small">
                {{ favorite.savedAt | $_formatDate({year: 'numeric', month: 'short', day: 'numeric'}) }} · {{ favorite.category || '未分类' }}
              </b-card-text>
              
              <div class="tags mt-2">
                <b-badge 
                  v-for="tag in favorite.tags" 
                  :key="tag._id || tag" 
                  pill 
                  class="tag-badge-style me-1 mb-1"
                  @click.stop="filterByTag(tag)"
                >
                  {{ tag.name || tag }}
                </b-badge>
              </div>
            </b-card-body>
            
            <b-card-footer class="bg-white border-top-0 d-flex justify-content-between">
              <router-link :to="`/favorites/${favorite._id}`" class="btn btn-sm btn-outline-primary">
                查看详情
              </router-link>
              <b-button variant="outline-danger" size="sm" @click="confirmDelete(favorite)">
                <i class="bi bi-trash"></i>
              </b-button>
            </b-card-footer>
          </b-card>
        </b-col>
      </b-row>
      
      <div v-if="currentPagination.total > currentPagination.limit" class="pagination-container mt-4 d-flex justify-content-center">
        <b-pagination
          v-model="currentPagination.page"
          :total-rows="currentPagination.total"
          :per-page="currentPagination.limit"
          @change="changePage"
          aria-controls="favorites-list"
        ></b-pagination>
      </div>
    </div>
    
    <b-modal id="delete-modal-search" title="确认删除" ok-variant="danger" ok-title="删除" @ok="deleteFavorite">
      <p>确定要删除这个收藏吗？此操作无法撤销。</p>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Search',
  data() {
    return {
      searchQuery: '', // 搜索关键字
      favoriteToDelete: null, // 待删除的收藏项

      // 占位符图片路径
      imagePlaceholder: require('@/assets/img/image-placeholder.jpg'),
      videoPlaceholder: require('@/assets/img/video-placeholder.jpg'),
      
      // 过滤器选项 (如果需要在这里添加过滤)
      // filters: {
      //   type: null,
      //   category: null,
      //   sortBy: 'savedAt',
      //   sortOrder: 'desc'
      // },
      // typeOptions: [],
      // categoryOptions: [],
      // sortByOptions: []
    };
  },
  computed: {
    ...mapGetters('favorites', [
      'allFavorites', 
      'isLoading', 
      'hasError', 
      'errorMessage', 
      'currentFilters', // 从 Vuex 获取当前过滤器状态
      'currentPagination' // 从 Vuex 获取当前分页状态
    ]),
    ...mapGetters('tags', { allTags: 'allTags' }), // 从 tags 模块映射 allTags

    favorites() {
      // 确保这里的 favorites 始终反映搜索结果
      return this.allFavorites;
    }
  },
  methods: {
    ...mapActions('favorites', [
      'fetchFavorites', // 用于获取数据
      'deleteFavorite', // 用于删除收藏
      'updateFiltersAndFetch', // 用于更新过滤器并触发获取
      'setPage' // 用于分页
    ]),
    
    // 执行搜索
    performSearch() {
      if (this.searchQuery.trim()) {
        // 更新 Vuex 中的搜索过滤器并重新获取数据
        this.updateFiltersAndFetch({
          ...this.currentFilters, // 保持其他过滤器不变
          search: this.searchQuery.trim(),
          page: 1 // 搜索时重置页码
        });
      } else {
        this.clearSearch(); // 如果搜索框为空，则清除搜索
      }
    },

    // 清除搜索
    clearSearch() {
      this.searchQuery = '';
      this.updateFiltersAndFetch({
        ...this.currentFilters,
        search: null, // 清除搜索关键字
        page: 1
      });
    },

    // 按标签筛选 (点击搜索结果中的标签时)
    filterByTag(tag) {
      // 跳转到 Favorites 页面，并带上标签作为过滤器
      const tagName = typeof tag === 'string' ? tag : tag.name;
      this.$router.push({
        path: '/favorites',
        query: { tag: tagName } // 传递标签名
      });
    },

    // 改变页码
    changePage(page) {
      this.setPage(page);
    },

    // 确认删除 (与 Favorites.vue 相同)
    confirmDelete(favorite) {
      this.favoriteToDelete = favorite;
      this.$bvModal.show('delete-modal-search'); // 使用不同的 modal ID
    },
    
    // 执行删除 (与 Favorites.vue 相同)
    async deleteFavorite() {
      if (this.favoriteToDelete) {
        try {
          await this.deleteFavorite(this.favoriteToDelete._id);
          this.$bvToast.toast('收藏已删除', {
            title: '成功',
            variant: 'success',
            solid: true
          });
        } catch (error) {
          this.$bvToast.toast(this.errorMessage || '删除失败，请重试', {
            title: '错误',
            variant: 'danger',
            solid: true
          });
        } finally {
          this.favoriteToDelete = null;
        }
      }
    }
  },
  
  // 组件创建时和路由参数变化时执行搜索
  created() {
    // 从路由查询参数初始化搜索框
    if (this.$route.query.q) {
      this.searchQuery = this.$route.query.q;
      // 触发搜索
      this.performSearch();
    } else {
      // 如果没有搜索参数，确保清除 Vuex 中的搜索过滤器
      this.clearSearch();
    }
  },
  // 监听路由查询参数变化，例如从 App.vue 全局搜索跳转过来
  watch: {
    '$route.query.q': {
      handler(newSearchQuery) {
        if (newSearchQuery !== this.searchQuery) {
          this.searchQuery = newSearchQuery || '';
          this.performSearch();
        } else if (!newSearchQuery && this.searchQuery) {
          // 如果查询参数被清空，且本地搜索框有内容，则清除本地搜索框
          this.searchQuery = '';
          this.clearSearch();
        }
      },
      immediate: true // 立即执行一次
    },
    // 监听分页参数变化，例如从 Favorites 页面点击搜索后跳转过来
    'currentPagination.page': {
      handler(newPage, oldPage) {
        if (newPage !== oldPage && this.$route.name === 'Search' && this.$route.query.q) {
          // 如果当前在搜索页，且页码变化，且有搜索关键字，则触发搜索
          this.performSearch();
        }
      }
    }
  }
};
</script>

<style scoped>
.search-page {
  padding-bottom: 30px;
}
/* 媒体预览和标签样式与 Favorites.vue 保持一致，也可以抽离到通用样式 */
.favorite-media {
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.favorite-media img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-thumbnail img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 10px rgba(0,0,0,0.7);
  pointer-events: none;
}

.empty-state {
  padding: 50px 0;
}

.tag-badge-style {
  background-color: #e9ecef;
  color: #495057;
  cursor: pointer;
  padding: 0.35em 0.65em;
  border-radius: 0.25rem;
}

.tag-badge-style:hover {
  background-color: #0088cc;
  color: white;
}
</style>