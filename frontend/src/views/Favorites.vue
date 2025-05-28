<template>
  <div class="favorites-page">
    <b-card class="mb-4">
      <b-card-body>
        <b-row>
          <b-col md="3" sm="6" class="mb-2">
            <label class="form-label">内容类型</label>
            <b-form-select v-model="filters.type" :options="typeOptions" @change="applyFilters"></b-form-select>
          </b-col>
          <b-col md="3" sm="6" class="mb-2">
            <label class="form-label">分类</label>
            <b-form-select v-model="filters.category" :options="categoryOptions" @change="applyFilters"></b-form-select>
          </b-col>
          <b-col md="3" sm="6" class="mb-2">
            <label class="form-label">标签</label>
            <b-form-select v-model="filters.tags" :options="tagOptions" multiple @change="applyFilters"></b-form-select>
          </b-col>
          <b-col md="3" sm="6" class="mb-2">
            <label class="form-label">排序方式</label>
            <div class="d-flex">
              <b-form-select v-model="filters.sortBy" :options="sortByOptions" @change="applyFilters" class="me-2"></b-form-select>
              <b-button @click="toggleSortOrder" variant="outline-secondary">
                <i :class="sortOrderIcon"></i>
              </b-button>
            </div>
          </b-col>
        </b-row>
        
        <b-row class="mt-3">
          <b-col md="8">
            <div class="input-group">
              <b-form-input type="text" placeholder="搜索收藏..." v-model="filters.search" @keyup.enter="applyFilters"></b-form-input>
              <b-button variant="primary" type="button" @click="applyFilters">搜索</b-button>
              <b-button variant="outline-secondary" type="button" @click="clearAllFilters">重置</b-button>
            </div>
          </b-col>
          <b-col md="4" class="text-end">
            <b-button variant="success" @click="triggerSyncFavorites" :disabled="syncLoading">
              <b-spinner v-if="syncLoading" small type="grow"></b-spinner>
              <i class="bi bi-arrow-repeat me-1"></i> 同步收藏
            </b-button>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
    
    <div v-if="isLoading" class="text-center my-5">
      <b-spinner class="text-primary"></b-spinner>
      <p class="mt-2">正在加载收藏内容...</p>
    </div>
    
    <b-alert v-else-if="hasError" show variant="danger">{{ errorMessage }}</b-alert>
    
    <div v-else-if="favorites.length === 0" class="text-center my-5 empty-state">
      <i class="bi bi-bookmark-star display-1 text-muted"></i>
      <h3 class="mt-3">暂无收藏内容</h3>
      <p class="text-muted">您可以点击"同步收藏"按钮从Telegram同步您的收藏内容</p>
      <b-button v-if="!hasActiveAccount" variant="primary" to="/settings" class="mt-3">添加Telegram账户</b-button>
    </div>
    
    <div v-else>
      <div class="view-toggle mb-3 text-end">
        <b-button-group>
          <b-button :variant="viewMode === 'grid' ? 'primary' : 'outline-primary'" @click="viewMode = 'grid'">
            <i class="bi bi-grid-3x3-gap"></i>
          </b-button>
          <b-button :variant="viewMode === 'list' ? 'primary' : 'outline-primary'" @click="viewMode = 'list'">
            <i class="bi bi-list"></i>
          </b-button>
        </b-button-group>
      </div>
      
      <b-row v-if="viewMode === 'grid'" class="row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
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
      
      <div v-else class="list-view">
        <b-list-group>
          <b-list-group-item v-for="favorite in favorites" :key="favorite._id" class="list-group-item-action">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <div class="type-icon me-3">
                  <i v-if="favorite.type === 'photo'" class="bi bi-image text-success"></i>
                  <i v-else-if="favorite.type === 'video'" class="bi bi-film text-danger"></i>
                  <i v-else-if="favorite.type === 'document'" class="bi bi-file-earmark-text text-primary"></i>
                  <i v-else-if="favorite.type === 'audio'" class="bi bi-music-note-beamed text-secondary"></i>
                  <i v-else-if="favorite.type === 'link'" class="bi bi-link-45deg text-info"></i>
                  <i v-else class="bi bi-chat-quote text-secondary"></i>
                </div>
                
                <div>
                  <h5 class="mb-1">{{ favorite.content.caption || favorite.content.text || '无标题' | $_truncateText(100) }}</h5>
                  <p class="mb-1 text-muted small">
                    {{ favorite.savedAt | $_formatDate({year: 'numeric', month: 'short', day: 'numeric'}) }} · {{ favorite.category || '未分类' }}
                  </p>
                  
                  <div class="tags mt-2">
                    <b-badge 
                      v-for="tag in favorite.tags" 
                      :key="tag._id || tag" 
                      pill 
                      class="tag-badge-style me-1"
                      @click.stop="filterByTag(tag)"
                    >
                      {{ tag.name || tag }}
                    </b-badge>
                  </div>
                </div>
              </div>
              
              <div class="actions d-flex align-items-center">
                <router-link :to="`/favorites/${favorite._id}`" class="btn btn-sm btn-outline-primary me-2">
                  查看
                </router-link>
                <b-button variant="outline-danger" size="sm" @click="confirmDelete(favorite)">
                  <i class="bi bi-trash"></i>
                </b-button>
              </div>
            </div>
          </b-list-group-item>
        </b-list-group>
      </div>
      
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
    
    <b-modal id="delete-modal" title="确认删除" ok-variant="danger" ok-title="删除" @ok="deleteFavorite">
      <p>确定要删除这个收藏吗？此操作无法撤销。</p>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Favorites',
  
  data() {
    return {
      viewMode: 'grid', // 默认网格视图
      searchQuery: '', // 绑定到搜索输入框
      favoriteToDelete: null, // 待删除的收藏项

      // 占位符图片路径
      imagePlaceholder: require('@/assets/img/image-placeholder.jpg'),
      videoPlaceholder: require('@/assets/img/video-placeholder.jpg'),

      // 过滤器选项
      typeOptions: [
        { value: null, text: '所有类型' },
        { value: 'text', text: '文本' },
        { value: 'photo', text: '图片' },
        { value: 'video', text: '视频' },
        { value: 'audio', text: '音频' },
        { value: 'document', text: '文档' },
        { value: 'link', text: '链接' }
      ],
      // 这里的 categoryOptions 应该与后端 categorizeContent 的返回值匹配
      categoryOptions: [
        { value: null, text: '所有分类' },
        { value: '文本', text: '文本' },
        { value: '图片', text: '图片' },
        { value: '视频', text: '视频' },
        { value: '音频', text: '音频' },
        { value: '文档', text: '文档' },
        { value: '链接', text: '链接' },
        { value: '其他', text: '其他' }
      ],
      sortByOptions: [
        { value: 'savedAt', text: '收藏时间' },
        { value: 'type', text: '内容类型' },
        { value: 'category', text: '分类' }
      ]
    };
  },
  
  computed: {
    ...mapGetters('favorites', ['allFavorites', 'isLoading', 'hasError', 'errorMessage', 'currentFilters', 'currentPagination']),
    ...mapGetters('tags', { allTags: 'allTags' }), // 从 tags 模块映射 allTags
    ...mapGetters('auth', ['hasActiveAccount', 'syncLoading']), // 从 auth 模块映射 syncLoading 和 hasActiveAccount

    // 将 Vuex filters 映射到组件本地，以便 v-model 双向绑定
    filters: {
      get() {
        return this.currentFilters;
      },
      set(value) {
        // 当本地 filters 改变时，更新 Vuex
        this.updateFiltersAndFetch(value);
      }
    },
    
    // 动态生成标签选项
    tagOptions() {
      // 确保 allTags 数据结构正确，有 name 和 count 属性
      return [
        { value: null, text: '所有标签' },
        ...this.allTags.map(tag => ({
          value: tag.name, // 后端过滤按 name (string)
          text: `${tag.name} (${tag.count || 0})`
        }))
      ];
    },
    
    // 排序图标
    sortOrderIcon() {
      return this.filters.sortOrder === 'asc'
        ? 'bi bi-sort-up-alt' // 升序图标
        : 'bi bi-sort-down-alt'; // 降序图标
    }
  },
  
  methods: {
    ...mapActions('favorites', ['fetchFavorites', 'deleteFavorite', 'updateFiltersAndFetch', 'setPage', 'clearAllFilters']),
    ...mapActions('tags', ['fetchTags']), // 映射 tags 模块的 fetchTags action
    ...mapActions('auth', { triggerSyncFavorites: 'syncFavorites' }), // 映射 auth 模块的 syncFavorites action

    // 应用过滤器（包括搜索）
    applyFilters() {
      // 在这里将本地 searchQuery 更新到 Vuex 的 filters.search
      const newFilters = { 
        ...this.filters, 
        search: this.searchQuery.trim() 
      };
      this.updateFiltersAndFetch(newFilters);
    },
    
    // 切换排序顺序
    toggleSortOrder() {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
      // 由于 filters 是计算属性，其 setter 会触发 updateFiltersAndFetch
    },
    
    // 改变页码
    changePage(page) {
      this.setPage(page);
    },
    
    // 按标签筛选
    filterByTag(tag) {
      // 如果 favorite.tags 存储的是 Tag 对象，tag.name 会是字符串
      // 如果 favorite.tags 存储的是字符串数组，tag 就是字符串
      const tagName = typeof tag === 'string' ? tag : tag.name;
      this.filters.tags = [tagName]; // 切换为单选标签过滤
      this.applyFilters();
    },

    // 确认删除
    confirmDelete(favorite) {
      this.favoriteToDelete = favorite;
      this.$bvModal.show('delete-modal');
    },
    
    // 执行删除
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
  
  // 组件创建时，获取数据
  async created() {
    // 确保在获取收藏前先获取标签，以便构建标签过滤器选项
    await this.fetchTags(); 
    await this.fetchFavorites();
    
    // 从路由查询参数恢复搜索状态 (如果从 App.vue 全局搜索跳转过来)
    if (this.$route.query.q) {
      this.searchQuery = this.$route.query.q;
      this.filters.search = this.$route.query.q;
    }
  },
  watch: {
    // 监听路由查询参数变化，例如从全局搜索跳转到 Favorites 页面
    '$route.query.q': {
      handler(newSearchQuery) {
        if (newSearchQuery) {
          this.searchQuery = newSearchQuery;
          this.filters.search = newSearchQuery;
          this.applyFilters(); // 触发过滤
        } else if (this.searchQuery) {
          // 如果查询参数被清空，且本地搜索框有内容，则清除本地搜索框
          this.searchQuery = '';
          this.applyFilters();
        }
      },
      immediate: true // 立即执行一次
    }
  }
};
</script>

<style scoped>
.favorites-page {
  padding-bottom: 30px;
}

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
  position: relative; /* 确保 play-icon 定位正确 */
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
  color: rgba(255, 255, 255, 0.9); /* 更亮的白色 */
  text-shadow: 0 0 10px rgba(0,0,0,0.7);
  pointer-events: none; /* 确保点击穿透到下面的 img */
}

.type-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

/* 标签样式 */
.tag-badge-style {
  background-color: #e9ecef;
  color: #495057;
  cursor: pointer;
  padding: 0.35em 0.65em; /* 调整内边距 */
  border-radius: 0.25rem; /* 调整圆角 */
}

.tag-badge-style:hover {
  background-color: #0088cc;
  color: white;
}

/* 覆盖 Bootstrap 的一些默认颜色 */
.badge.bg-info {
  background-color: #0088cc !important;
}

.card-footer {
  border-top: 1px solid #eee; /* 确保 footer 有边框 */
}

.empty-state {
  padding: 50px 0;
}
</style>