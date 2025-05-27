<template>
  <div class="favorite-detail-page">
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
    
    <!-- 收藏详情 -->
    <div v-else-if="favorite" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="mb-0">收藏详情</h3>
        <div>
          <router-link to="/favorites" class="btn btn-outline-secondary me-2">
            <i class="bi bi-arrow-left"></i> 返回
          </router-link>
          <button class="btn btn-outline-danger" @click="confirmDelete">
            <i class="bi bi-trash"></i> 删除
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <!-- 媒体内容 -->
        <div v-if="favorite.type === 'photo'" class="media-container text-center mb-4">
          <img :src="favorite.content.url" class="img-fluid" alt="图片">
        </div>
        
        <div v-else-if="favorite.type === 'video'" class="media-container text-center mb-4">
          <video controls class="img-fluid">
            <source :src="favorite.content.url" :type="favorite.content.mimeType">
            您的浏览器不支持视频播放。
          </video>
        </div>
        
        <div v-else-if="favorite.type === 'audio'" class="media-container text-center mb-4">
          <audio controls class="w-100">
            <source :src="favorite.content.url" :type="favorite.content.mimeType">
            您的浏览器不支持音频播放。
          </audio>
        </div>
        
        <div v-else-if="favorite.type === 'document'" class="media-container text-center mb-4">
          <div class="document-preview p-4 bg-light text-center">
            <i class="bi bi-file-earmark-text display-1"></i>
            <p class="mt-2">{{ favorite.content.fileName }}</p>
            <a :href="favorite.content.url" class="btn btn-primary" download>
              <i class="bi bi-download"></i> 下载文档
            </a>
          </div>
        </div>
        
        <div v-else-if="favorite.type === 'link' && favorite.content.url" class="media-container text-center mb-4">
          <div class="link-preview p-4 bg-light text-center">
            <i class="bi bi-link-45deg display-1"></i>
            <p class="mt-2">{{ favorite.content.url }}</p>
            <a :href="favorite.content.url" class="btn btn-primary" target="_blank">
              <i class="bi bi-box-arrow-up-right"></i> 访问链接
            </a>
          </div>
        </div>
        
        <!-- 内容信息 -->
        <div class="content-info">
          <h4 v-if="favorite.content.caption">{{ favorite.content.caption }}</h4>
          <h4 v-else-if="favorite.content.text">{{ favorite.content.text }}</h4>
          
          <div class="meta-info mt-3">
            <div class="row">
              <div class="col-md-6">
                <p><strong>类型：</strong> {{ typeLabel }}</p>
                <p><strong>分类：</strong> {{ favorite.category }}</p>
                <p><strong>收藏时间：</strong> {{ formatDate(favorite.savedAt) }}</p>
              </div>
              <div class="col-md-6" v-if="favorite.type !== 'text'">
                <p v-if="favorite.content.fileSize"><strong>文件大小：</strong> {{ formatFileSize(favorite.content.fileSize) }}</p>
                <p v-if="favorite.content.width && favorite.content.height"><strong>尺寸：</strong> {{ favorite.content.width }} x {{ favorite.content.height }}</p>
                <p v-if="favorite.content.duration"><strong>时长：</strong> {{ formatDuration(favorite.content.duration) }}</p>
              </div>
            </div>
          </div>
          
          <!-- 标签管理 -->
          <div class="tags-section mt-4">
            <h5>标签</h5>
            <div class="d-flex flex-wrap align-items-center">
              <span v-for="tag in favorite.tags" :key="tag" class="badge bg-info me-2 mb-2 p-2">
                {{ tag }}
                <button class="btn-close btn-close-white ms-1" style="font-size: 0.5rem;" @click="removeTag(tag)"></button>
              </span>
              
              <div class="add-tag-form d-inline-flex">
                <input type="text" class="form-control form-control-sm" placeholder="添加标签..." 
                       v-model="newTag" @keyup.enter="addTag">
                <button class="btn btn-sm btn-primary ms-1" @click="addTag" :disabled="!newTag.trim()">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
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
  name: 'FavoriteDetail',
  
  data() {
    return {
      newTag: ''
    };
  },
  
  computed: {
    ...mapGetters('favorites', ['currentFavorite', 'loading', 'error']),
    
    favorite() {
      return this.currentFavorite;
    },
    
    typeLabel() {
      const typeMap = {
        'photo': '图片',
        'video': '视频',
        'audio': '音频',
        'document': '文档',
        'link': '链接',
        'text': '文本'
      };
      
      return this.favorite ? typeMap[this.favorite.type] || '未知' : '';
    }
  },
  
  methods: {
    ...mapActions('favorites', ['fetchFavoriteById', 'updateFavoriteTags', 'deleteFavorite']),
    
    // 添加标签
    async addTag() {
      if (this.newTag.trim() && this.favorite) {
        const tags = [...this.favorite.tags];
        
        // 检查标签是否已存在
        if (!tags.includes(this.newTag.trim())) {
          tags.push(this.newTag.trim());
          
          try {
            await this.updateFavoriteTags({
              id: this.favorite._id,
              tags
            });
            this.newTag = '';
          } catch (error) {
            console.error('添加标签失败:', error);
          }
        } else {
          this.newTag = '';
        }
      }
    },
    
    // 移除标签
    async removeTag(tagToRemove) {
      if (this.favorite) {
        const tags = this.favorite.tags.filter(tag => tag !== tagToRemove);
        
        try {
          await this.updateFavoriteTags({
            id: this.favorite._id,
            tags
          });
        } catch (error) {
          console.error('移除标签失败:', error);
        }
      }
    },
    
    // 确认删除
    confirmDelete() {
      this.$bvModal.show('delete-modal');
    },
    
    // 执行删除
    async deleteFavorite() {
      try {
        await this.deleteFavorite(this.favorite._id);
        this.$router.push('/favorites');
      } catch (error) {
        console.error('删除收藏失败:', error);
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 格式化时长
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  },
  
  // 组件创建时
  async created() {
    // 获取收藏详情
    const favoriteId = this.$route.params.id;
    if (favoriteId) {
      await this.fetchFavoriteById(favoriteId);
    }
  }
};
</script>

<style scoped>
.favorite-detail-page {
  padding-bottom: 30px;
}

.media-container {
  max-height: 500px;
  overflow: hidden;
}

.media-container img,
.media-container video {
  max-height: 500px;
  object-fit: contain;
}

.document-preview,
.link-preview {
  border-radius: 5px;
  padding: 30px;
}

.add-tag-form {
  max-width: 200px;
}
</style>
