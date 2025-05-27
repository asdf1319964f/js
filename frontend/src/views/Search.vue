<template>
  <div class="search-page">
    <h2 class="mb-4">搜索结果</h2>
    
    <!-- 搜索表单 -->
    <div class="search-form mb-4">
      <div class="card">
        <div class="card-body">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="搜索收藏内容..." 
                   v-model="searchQuery" @keyup.enter="search">
            <button class="btn btn-primary" type="button" @click="search">
              <i class="bi bi-search"></i> 搜索
            </button>
          </div>
          
          <!-- 过滤选项 -->
          <div class="filter-options mt-3 row">
            <div class="col-md-4">
              <label class="form-label">内容类型</label>
              <b-form-select v-model="filters.type" :options="typeOptions" @change="search"></b-form-select>
            </div>
            <div class="col-md-4">
              <label class="form-label">分类</label>
              <b-form-select v-model="filters.category" :options="categoryOptions" @change="search"></b-form-select>
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
      <p class="mt-2">正在搜索...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- 搜索结果 -->
    <div v-else>
      <div v-if="favorites.length > 0">
        <div class="alert alert-info">
          找到 {{ pagination.total }} 个匹配结果，关键词: "{{ currentSearchQuery }}"
        </div>
        
        <!-- 结果列表 -->
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
                <router-link :to="`/favorites/${favorite._id}`" class="btn btn-sm btn-outline-primary">
                  查看
                </router-link>
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
            aria-controls="search-results"
          ></b-pagination>
        </div>
      </div>
      
      <!-- 无结果 -->
      <div v-else class="text-center my-5">
        <div class="empty-state">
          <i class="bi bi-search display-1 text-muted"></i>
          <h3 class="mt-3">未找到匹配结果</h3>
          <p class="text-muted">尝试使用不同的关键词或过滤条件</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Search',
  
  data() {
    return {
      searchQuery: '',
      currentSearchQuery: '',
      currentPage: 1,
      filters: {
        type: null,
        category: null
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
      ]
    };
  },
  
  computed: {
    ...mapGetters('favorites', ['allFavorites', 'loading', 'error', 'pagination']),
    
    favorites() {
      return this.allFavorites;
    }
  },
  
  methods: {
    ...mapActions('favorites', ['searchFavorites']),
    
    // 执行搜索
    search() {
      if (this.searchQuery.trim()) {
        this.currentPage = 1;
        this.currentSearchQuery = this.searchQuery;
        this.performSearch();
      }
    },
    
    // 执行搜索请求
    async performSearch() {
      try {
        await this.searchFavorites(this.currentSearchQuery, {
          page: this.currentPage,
          ...this.filters
        });
      } catch (error) {
        console.error('搜索失败:', error);
      }
    },
    
    // 切换页面
    changePage(page) {
      this.currentPage = page;
      this.performSearch();
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
  created() {
    // 从URL获取搜索查询
    const query = this.$route.query.q;
    if (query) {
      this.searchQuery = query;
      this.currentSearchQuery = query;
      this.performSearch();
    }
  }
};
</script>

<style scoped>
.search-page {
  padding-bottom: 30px;
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
