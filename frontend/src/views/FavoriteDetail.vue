<template>
  <div class="favorite-detail-page">
    <b-container>
      <h1 class="my-4">收藏详情</h1>

      <b-alert v-if="hasError" show variant="danger">{{ errorMessage }}</b-alert>
      <div v-else-if="isLoading" class="text-center my-5">
        <b-spinner class="text-primary"></b-spinner>
        <p class="mt-2">加载收藏详情...</p>
      </div>
      <b-alert v-else-if="!favorite" show variant="warning">
        <i class="bi bi-exclamation-triangle me-1"></i> 未找到该收藏内容。
      </b-alert>

      <b-card v-else class="mb-4">
        <b-card-body>
          <b-row>
            <b-col md="8">
              <div class="main-content-display mb-3">
                <template v-if="favorite.type === 'photo'">
                  <b-img :src="favorite.content.url" fluid alt="收藏图片"></b-img>
                </template>
                <template v-else-if="favorite.type === 'video'">
                  <video :src="favorite.localPath" controls fluid class="w-100" v-if="favorite.localPath">
                    您的浏览器不支持视频播放。
                  </video>
                  <b-img v-else :src="favorite.content.thumbnailUrl || videoPlaceholder" fluid alt="视频缩略图"></b-img>
                  <div v-if="!favorite.localPath" class="text-muted text-center mt-2">
                    <i class="bi bi-info-circle me-1"></i> 视频文件可能未下载到服务器，无法直接播放。
                  </div>
                </template>
                <template v-else-if="favorite.type === 'audio'">
                  <audio :src="favorite.localPath" controls class="w-100" v-if="favorite.localPath">
                    您的浏览器不支持音频播放。
                  </audio>
                  <div v-else class="text-muted text-center mt-2">
                     <i class="bi bi-info-circle me-1"></i> 音频文件可能未下载到服务器。
                  </div>
                </template>
                 <template v-else-if="favorite.type === 'document'">
                    <a :href="favorite.localPath || '#'" target="_blank" class="btn btn-outline-primary w-100 py-3">
                        <i class="bi bi-file-earmark-arrow-down-fill me-2"></i> 下载文件: {{ favorite.content.fileName }}
                    </a>
                     <div v-if="!favorite.localPath" class="text-muted text-center mt-2">
                       <i class="bi bi-info-circle me-1"></i> 文件可能未下载到服务器。
                    </div>
                </template>
                <template v-else-if="favorite.type === 'link'">
                  <a :href="favorite.content.url" target="_blank" class="btn btn-outline-info w-100 py-3">
                    <i class="bi bi-link-45deg me-2"></i> 前往链接: {{ favorite.content.url | $_truncateText(50) }}
                  </a>
                </template>
                <template v-else-if="favorite.type === 'text'">
                  <div class="card p-3 bg-light text-start">
                    <h5 class="mb-2">文本内容:</h5>
                    <pre class="mb-0">{{ favorite.content.text }}</pre>
                  </div>
                </template>
                <template v-else>
                  <div class="text-center p-5 bg-light">
                    <i class="bi bi-question-circle display-4 text-muted"></i>
                    <p class="mt-2">未知内容类型</p>
                  </div>
                </template>
              </div>

              <h4 class="mb-2">{{ favorite.content.caption || favorite.content.text || '无标题' }}</h4>
              <p class="text-muted small">
                收藏时间: {{ favorite.savedAt | $_formatDate() }} <br/>
                分类: {{ favorite.category || '未分类' }} <br/>
                消息ID: {{ favorite.telegramMessageId }}
              </p>

              <div class="d-flex gap-2 mt-3">
                <b-button variant="outline-danger" @click="confirmDelete">
                  <i class="bi bi-trash me-1"></i> 删除收藏
                </b-button>
              </div>
            </b-col>

            <b-col md="4">
              <b-card header="标签" class="mb-3">
                <div class="tags-list">
                  <b-badge
                    v-for="tag in favorite.tags"
                    :key="tag._id || tag"
                    pill
                    class="tag-badge-style me-1 mb-1"
                    @click="removeTag(tag)"
                  >
                    {{ tag.name || tag }} <i class="bi bi-x-circle-fill ms-1"></i>
                  </b-badge>
                </div>
                <hr />
                <b-form @submit.prevent="addTag">
                  <b-form-group label="添加新标签:" label-for="add-tag-input">
                    <b-form-input
                      id="add-tag-input"
                      v-model="newTag"
                      placeholder="输入标签名称"
                      required
                    ></b-form-input>
                  </b-form-group>
                  <b-button type="submit" variant="outline-primary" size="sm" class="mt-2" :disabled="!newTag.trim()">添加标签</b-button>
                </b-form>
              </b-card>

              <b-card header="其他信息" class="mb-3">
                <p><strong>文件ID:</strong> {{ favorite.content.fileId || 'N/A' }}</p>
                <p><strong>文件名:</strong> {{ favorite.content.fileName || 'N/A' }}</p>
                <p><strong>文件大小:</strong> {{ favorite.content.fileSize ? (favorite.content.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A' }}</p>
                <p><strong>MIME类型:</strong> {{ favorite.content.mimeType || 'N/A' }}</p>
                <p><strong>时长:</strong> {{ favorite.content.duration ? favorite.content.duration + ' 秒' : 'N/A' }}</p>
                <p><strong>分辨率:</strong> {{ favorite.content.width || 'N/A' }} x {{ favorite.content.height || 'N/A' }}</p>
                <p><strong>本地下载:</strong> 
                    <i v-if="favorite.isDownloaded" class="bi bi-check-circle-fill text-success"></i>
                    <i v-else class="bi bi-x-circle-fill text-danger"></i>
                    {{ favorite.isDownloaded ? '已下载' : '未下载' }}
                </p>
                <p v-if="favorite.localPath"><strong>本地路径:</strong> {{ favorite.localPath }}</p>
              </b-card>
            </b-col>
          </b-row>
        </b-card-body>
      </b-card>
    </b-container>
    
    <b-modal id="delete-modal-detail" title="确认删除" ok-variant="danger" ok-title="删除" @ok="deleteFavorite">
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
      newTag: '', // 新标签输入
      // 占位符图片路径
      imagePlaceholder: require('@/assets/img/image-placeholder.jpg'),
      videoPlaceholder: require('@/assets/img/video-placeholder.jpg'),
    };
  },
  computed: {
    ...mapGetters('favorites', [
      'currentFavorite', 
      'isLoading', 
      'hasError', 
      'errorMessage'
    ]),
    favorite() {
      return this.currentFavorite;
    }
  },
  methods: {
    ...mapActions('favorites', [
      'fetchFavoriteById', 
      'deleteFavorite', 
      'updateFavoriteTags',
      'removeTagFromFavorite'
    ]),
    
    // 添加标签
    async addTag() {
      if (!this.newTag.trim()) {
        this.$bvToast.toast('标签名称不能为空', { title: '验证错误', variant: 'warning', solid: true });
        return;
      }
      // 检查标签是否已存在于当前收藏中
      const existingTag = this.favorite.tags.find(
        t => (typeof t === 'string' ? t.toLowerCase() : t.name.toLowerCase()) === this.newTag.trim().toLowerCase()
      );
      if (existingTag) {
        this.$bvToast.toast('该标签已存在于此收藏中', { title: '提示', variant: 'info', solid: true });
        return;
      }

      try {
        // 构建要发送的标签数组，包含新标签
        // 假设 favorite.tags 是字符串数组，或者后端能处理字符串数组作为tags参数
        const updatedTags = [...this.favorite.tags.map(t => typeof t === 'string' ? t : t.name), this.newTag.trim()];
        
        // 调用 Vuex action 更新标签
        await this.updateFavoriteTags({
          favoriteId: this.favorite._id,
          tags: updatedTags // 发送更新后的完整标签数组
        });
        
        this.newTag = ''; // 清空输入
        this.$bvToast.toast('标签添加成功', { title: '成功', variant: 'success', solid: true });
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '添加标签失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      }
    },
    
    // 移除标签
    async removeTag(tagToRemove) {
      if (!confirm(`确定要移除标签 "${typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.name}" 吗？`)) {
        return;
      }

      try {
        const tagName = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.name;
        // 调用 Vuex action 移除标签
        await this.removeTagFromFavorite({
          favoriteId: this.favorite._id,
          tagName: tagName // 发送要移除的标签名称
        });
        this.$bvToast.toast('标签已移除', { title: '成功', variant: 'success', solid: true });
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '移除标签失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      }
    },

    // 确认删除收藏
    confirmDelete() {
      this.$bvModal.show('delete-modal-detail');
    },
    
    // 删除收藏
    async deleteFavorite() {
      try {
        await this.deleteFavorite(this.favorite._id);
        this.$bvToast.toast('收藏已删除', {
          title: '成功',
          variant: 'success',
          solid: true
        });
        // 删除成功后重定向回收藏列表
        this.$router.push('/favorites');
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '删除失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      }
    }
  },
  
  // 组件创建时，根据路由ID获取收藏详情
  created() {
    const favoriteId = this.$route.params.id;
    if (favoriteId) {
      this.fetchFavoriteById(favoriteId);
    }
  },
  // 监听路由参数变化，当从一个详情页跳到另一个详情页时
  watch: {
    '$route.params.id': {
      handler(newId) {
        if (newId) {
          this.fetchFavoriteById(newId);
        }
      },
      immediate: true // 立即执行一次
    }
  }
};
</script>

<style scoped>
.favorite-detail-page {
  padding-bottom: 30px;
}

.main-content-display {
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px; /* 最小高度 */
  max-height: 500px;
  margin-bottom: 20px;
}

.main-content-display img,
.main-content-display video,
.main-content-display audio {
  max-width: 100%;
  max-height: 100%;
  display: block; /* 移除图片底部空白 */
}

.main-content-display pre {
  background-color: transparent; /* 移除背景色 */
  border: none; /* 移除边框 */
  padding: 0;
  margin: 0;
  white-space: pre-wrap; /* 文本换行 */
  word-break: break-word; /* 单词内换行 */
  font-size: 0.9rem;
}

.tags-list {
  margin-bottom: 1rem;
}

.tag-badge-style {
  background-color: #e9ecef;
  color: #495057;
  cursor: pointer;
  padding: 0.35em 0.65em;
  border-radius: 0.25rem;
}

.tag-badge-style:hover {
  background-color: #dc3545; /* 删除时变为红色 */
  color: white;
}
</style>