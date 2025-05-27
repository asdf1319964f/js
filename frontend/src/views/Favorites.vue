<template>
  <div class="favorites-page">
    <!-- 过滤和搜索工具栏 -->
    <div class="filter-toolbar mb-4">
      <div class="card">
        <div class="card-body">
          <div class="row">
            <div class="col-md-3 mb-2">
              <label class="form-label">内容类型</label>
              <b-form-select v-model="filters.type" :options="typeOptions" @change="applyFilters"></b-form-select>
            </div>
            <div class="col-md-3 mb-2">
              <label class="form-label">分类</label>
              <b-form-select v-model="filters.category" :options="categoryOptions" @change="applyFilters"></b-form-select>
            </div>
            <div class="col-md-3 mb-2">
              <label class="form-label">标签</label>
              <b-form-select v-model="filters.tags" :options="tagOptions" multiple @change="applyFilters"></b-form-select>
            </div>
            <div class="col-md-3 mb-2">
              <label class="form-label">排序方式</label>
              <div class="d-flex">
                <b-form-select v-model="filters.sortBy" :options="sortByOptions" @change="applyFilters" class="me-2"></b-form-select>
                <b-button @click="toggleSortOrder" variant="outline-secondary">
                  <i :class="sortOrderIcon"></i>
                </b-button>
              </div>
            </div>
          </div>
          
          <div class="row mt-3">
            <div class="col-md-8">
              <div class="input-group">
                <input type="text" class="form-control" placeholder="搜索收藏..." v-model="searchQuery" @keyup.enter="search">
                <button class="btn btn-primary" type="button" @click="search">搜索</button>
              </div>
            </div>
            <div class="col-md-4 text-end">
              <b-button variant="success" @click="syncFavorites" :disabled="loading">
                <i class="bi bi-arrow-repeat me-1"></i> 同步收藏
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
      <p class="mt-2">正在加载收藏内容...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="favorites.length === 0" class="text-center my-5">
      <div class="empty-state">
        <i class="bi bi-bookmark-star display-1 text-muted"></i>
        <h3 class="mt-3">暂无收藏内容</h3>
        <p class="text-muted">您可以点击"同步收藏"按钮从Telegram同步您的收藏内容</p>
      </div>
    </div>
    
    <!-- 收藏内容展示 -->
    <div v-else>
      <!-- 视图切换 -->
      <div class="view-toggle mb-3 text-end">
        <div class="btn-group">
          <button type="button" class="btn" :class="{'btn-primary': viewMode === 'grid', 'btn-outline-primary': viewMode !== 'grid'}" @click="viewMode = 'grid'">
            <i class="bi bi-grid-3x3-gap"></i>
          </button>
          <button type="button" class="btn" :class="{'btn-primary': viewMode === 'list', 'btn-outline-primary': viewMode !== 'list'}" @click="viewMode = 'list'">
            <i class="bi bi-list"></i>
          </button>
        </div>
      </div>
      
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <div v-for="favorite in favorites" :key="favorite._id" class="col">
          <div class="card h-100">
            <!-- 媒体预览 -->
            <div class="card-img-top favorite-media" v-if="favorite.type === 'photo' || favorite.type === 'video'">
              <div v-if="favorite.type === 'video'" class="video-thumbnail position-relative">
                <img :src="favorite.content.thumbnailUrl || '/assets/img/video-placeholder.jpg'" class="img-fluid" alt="视频缩略图">
                <div class="play-icon">
                  <i class="bi bi-play-circle-fill"></i>
                </div>
              </div>
              <img v-else :src="favorite.content.url || '/assets/img/image-placeholder.jpg'" class="img-fluid" alt="图片">
            </div>
            <div v-else-if="favorite.type === 'document'" class="card-img-top text-center p-3 bg-light">
              <i class="bi bi-file-earmark-text display-4"></i>
            </div>
            <div v-else-if="favorite.type === 'link'" class="card-img-top text-center p-3 bg-light">
              <i class="bi bi-link-45deg display-4"></i>
            </div>
            <div v-else class="card-img-top text-center p-3 bg-light">
              <i class="bi bi-chat-quote display-4"></i>
            </div>
            
            <!-- 内容 -->
            <div class="card-body">
              <h5 class="card-title">
                {{ favorite.content.caption || favorite.content.text || '无标题' | truncate(50) }}
              </h5>
              <p class="card-text text-muted small">
                {{ formatDate(favorite.savedAt) }} · {{ favorite.category }}
              </p>
              
              <!-- 标签 -->
              <div class="tags mt-2">
                <span v-for="tag in favorite.tags" :key="tag" class="badge bg-info me-1 mb-1">
                  {{ tag }}
                </span>
              </div>
            </div>
            
            <!-- 操作 -->
            <div class="card-footer bg-white border-top-0">
              <div class="d-flex justify-content-between">
                <router-link :to="`/favorites/${favorite._id}`" class="btn btn-sm btn-outline-primary">
                  查看详情
                </router-link>
                <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(favorite)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 列表视图 -->
      <div v-else class="list-view">
        <div class="list-group">
          <div v-for="favorite in favorites" :key="favorite._id" class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
              <div class="d-flex">
                <!-- 类型图标 -->
                <div class="type-icon me-3">
                  <i v-if="favorite.type === 'photo'" class="bi bi-image text-success"></i>
                  <i v-else-if="favorite.type === 'video'" class="bi bi-film text-danger"></i>
                  <i v-else-if="favorite.type === 'document'" class="bi bi-file-earmark-text text-primary"></i>
                  <i v-else-if="favorite.type === 'link'" class="bi bi-link-45deg text-info"></i>
                  <i v-else class="bi bi-chat-quote text-secondary"></i>
                </div>
                
                <!-- 内容 -->
                <div>
                  <h5 class="mb-1">{{ favorite.content.caption || favorite.content.text || '无标题' | truncate(100) }}</h5>
                  <p class="mb-1 text-muted small">
                    {{ formatDate(favorite.savedAt) }} · {{ favorite.category }}
                  </p>
                  
                  <!-- 标签 -->
                  <div class="tags mt-2">
                    <span v-for="tag in favorite.tags" :key="tag" class="badge bg-info me-1">
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- 操作 -->
              <div class="actions">
                <router-link :to="`/favorites/${favorite._id}`" class="btn btn-sm btn-outline-primary me-2">
                  查看
                </router-link>
                <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(favorite)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container mt-4 d-flex justify-content-center">
        <b-pagination
          v-model="currentPage"
          :total-rows="pagination.total"
          :per-page="pagination.limit"
          @change="changePage"
          aria-controls="favorites-table"
        ></b-pagination>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <b-modal id="delete-modal" title="确认删除" @ok="deleteFavorite">
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
      viewMode: 'grid',
      currentPage: 1,
      searchQuery: '',
      favoriteToDelete: null,
      filters: {
        type: null,
        category: null,
        tags: [],
        sortBy: 'savedAt',
        sortOrder: 'desc'
      },
      typeOptions: [
        { value: null, text: '所有类型' },
        { value: 'photo', text: '图片' },
        { value: 'video', text: '视频' },
        { value: 'document', text: '文档' },
        { value: 'link', text: '链接' },
        { value: 'text', text: '文本' }
      ],
      categoryOptions: [
        { value: null, text: '所有分类' },
        { value: '图片', text: '图片' },
        { value: '视频', text: '视频' },
        { value: '文档', text: '文档' },
        { value: '链接', text: '链接' },
        { value: '文本', text: '文本' },
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
    ...mapGetters('favorites', ['allFavorites', 'loading', 'error', 'pagination', 'filters']),
    ...mapGetters('tags', ['allTags']),
    
    favorites() {
      return this.allFavorites;
    },
    
    tagOptions() {
      return [
        { value: null, text: '所有标签' },
        ...this.allTags.map(tag => ({
          value: tag.name,
          text: `${tag.name} (${tag.count})`
        }))
      ];
    },
    
    sortOrderIcon() {
      return this.filters.sortOrder === 'asc' 
        ? 'bi bi-sort-up-alt' 
        : 'bi bi-sort-down-alt';
    }
  },
  
  methods: {
    ...mapActions('favorites', ['fetchFavorites', 'deleteFavorite', 'updateFiltersAndFetch', 'searchFavorites', 'syncFavorites']),
    ...mapActions('tags', ['fetchTags']),
    
    // 应用过滤器
    applyFilters() {
      this.currentPage = 1;
      this.updateFiltersAndFetch({
        ...this.filters,
        page: this.currentPage
      });
    },
    
    // 切换排序顺序
    toggleSortOrder() {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
      this.applyFilters();
    },
    
    // 搜索
    search() {
      if (this.searchQuery.trim()) {
        this.currentPage = 1;
        this.searchFavorites(this.searchQuery);
      } else {
        this.applyFilters();
      }
    },
    
    // 切换页面
    changePage(page) {
      this.currentPage = page;
      this.updateFiltersAndFetch({
        ...this.filters,
        page: this.currentPage
      });
    },
    
    // 确认删除
    confirmDelete(favorite) {
      this.favoriteToDelete = favorite;
      this.$bvModal.show('delete-modal');
    },
    
    // 执行删除
    async deleteFavorite() {
      if (this.favoriteToDelete) {
        await this.deleteFavorite(this.favoriteToDelete._id);
        this.favoriteToDelete = null;
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  },
  
  // 过滤器
  filters: {
    // 截断文本
    truncate(text, length) {
      if (!text) return '';
      return text.length > length 
        ? text.substring(0, length) + '...' 
        : text;
    }
  },
  
  // 组件创建时
  async created() {
    // 获取标签列表
    await this.fetchTags();
    
    // 获取收藏列表
    await this.fetchFavorites();
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
}

.favorite-media img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
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
  color: white;
  text-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.type-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 50px 0;
}
</style>
