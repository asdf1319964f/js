<template>
  <div class="tags-container">
    <b-container>
      <h1 class="my-4">标签管理</h1>
      
      <b-card class="mb-4">
        <template #header>
          <div class="d-flex justify-content-between align-items-center">
            <h4 class="mb-0">所有标签</h4>
            <b-button variant="primary" size="sm" @click="showAddTagModal" :disabled="!hasActiveAccount">
              <i class="bi bi-plus-circle me-1"></i> 添加标签
            </b-button>
          </div>
          <b-alert v-if="!hasActiveAccount" show variant="warning" class="mt-2 py-2">
            <small>请先在 <router-link to="/settings">设置</router-link> 页面添加Telegram账户才能添加标签。</small>
          </b-alert>
        </template>
        
        <b-table
          :items="allTags"
          :fields="fields"
          striped
          hover
          responsive
          :busy="isLoading"
          class="mb-0"
        >
          <template #cell(color)="data">
            <div v-if="data.item.color" class="color-preview" :style="{ backgroundColor: data.item.color }"></div>
            <span v-else class="text-muted">无</span>
          </template>
          
          <template #cell(count)="data">
            {{ data.item.count || 0 }} 个收藏
          </template>
          
          <template #cell(actions)="data">
            <b-button-group size="sm">
              <b-button variant="outline-primary" @click="showEditTagModal(data.item)">
                <i class="bi bi-pencil"></i>
              </b-button>
              <b-button variant="outline-danger" @click="showDeleteTagModal(data.item)">
                <i class="bi bi-trash"></i>
              </b-button>
            </b-button-group>
          </template>
          
          <template #table-busy>
            <div class="text-center my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong> 加载中...</strong>
            </div>
          </template>
        </b-table>
        
        <div v-if="!isLoading && allTags.length === 0 && hasActiveAccount" class="text-center py-3">
          <p class="text-muted">暂无标签，请点击"添加标签"按钮创建。</p>
        </div>
      </b-card>
    </b-container>
    
    <b-modal
      v-model="showTagModal"
      :title="isEditing ? '编辑标签' : '添加标签'"
      @ok="handleTagSubmit"
      @hidden="resetTagForm"
      :ok-disabled="!tagForm.name.trim()"
    >
      <b-form>
        <b-form-group label="标签名称:" label-for="tag-name">
          <b-form-input
            id="tag-name"
            v-model="tagForm.name"
            required
            placeholder="输入标签名称"
          ></b-form-input>
        </b-form-group>
        
        <b-form-group label="标签颜色 (可选):" label-for="tag-color">
          <b-form-input
            id="tag-color"
            v-model="tagForm.color"
            type="color"
          ></b-form-input>
        </b-form-group>
      </b-form>
    </b-modal>
    
    <b-modal
      v-model="showDeleteModal"
      title="删除标签"
      ok-variant="danger"
      ok-title="删除"
      @ok="deleteTag"
    >
      <p>确定要删除标签 "<strong>{{ tagToDelete ? tagToDelete.name : '' }}</strong>" 吗？</p>
      <p class="text-danger">此操作将从所有收藏中移除该标签，且无法撤销。</p>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Tags',
  data() {
    return {
      // B-table 字段定义
      fields: [
        { key: 'name', label: '标签名称', sortable: true },
        { key: 'color', label: '颜色' },
        { key: 'count', label: '收藏数量', sortable: true },
        { key: 'actions', label: '操作' }
      ],
      showTagModal: false, // 控制添加/编辑模态框显示
      showDeleteModal: false, // 控制删除确认模态框显示
      isEditing: false, // 模态框是否处于编辑模式
      tagForm: { // 模态框表单数据
        _id: null, // 用于编辑模式的标签ID
        name: '',
        color: '#3498db' // 默认颜色
      },
      tagToDelete: null // 待删除的标签
    };
  },
  computed: {
    // 映射 tags 模块的 getters
    ...mapGetters('tags', [
      'allTags',
      'isLoading', // 标签模块的加载状态
      'hasError',  // 标签模块的错误状态
      'errorMessage' // 标签模块的错误信息
    ]),
    // 映射 auth 模块的 getters
    ...mapGetters('auth', ['hasActiveAccount']), // 判断用户是否有活跃账户
  },
  created() {
    this.fetchTags(); // 组件创建时获取标签列表
  },
  methods: {
    // 映射 tags 模块的 actions
    ...mapActions('tags', [
      'fetchTags',
      'createTag',
      'updateTag',
      'deleteTag'
    ]),
    
    // 显示添加标签模态框
    showAddTagModal() {
      this.isEditing = false;
      this.resetTagForm(); // 重置表单
      this.showTagModal = true;
    },
    
    // 显示编辑标签模态框
    showEditTagModal(tag) {
      this.isEditing = true;
      // 拷贝标签数据到表单，确保不直接修改 Vuex 状态
      this.tagForm = { ...tag };
      this.showTagModal = true;
    },
    
    // 显示删除标签确认模态框
    showDeleteTagModal(tag) {
      this.tagToDelete = tag;
      this.showDeleteModal = true;
    },
    
    // 处理添加/编辑标签表单提交
    async handleTagSubmit(bvModalEvent) {
      bvModalEvent.preventDefault(); // 阻止模态框自动关闭
      
      if (!this.tagForm.name.trim()) {
        this.$bvToast.toast('标签名称不能为空', { title: '验证错误', variant: 'warning', solid: true });
        return;
      }

      try {
        if (this.isEditing) {
          // 调用更新标签 action
          await this.updateTag({
            id: this.tagForm._id, // 标签ID
            tagData: {            // 更新数据
              name: this.tagForm.name.trim(),
              color: this.tagForm.color
            }
          });
          this.$bvToast.toast('标签已更新', {
            title: '成功',
            variant: 'success',
            solid: true
          });
        } else {
          // 调用创建标签 action
          await this.createTag({
            name: this.tagForm.name.trim(),
            color: this.tagForm.color
          });
          this.$bvToast.toast('标签已创建', {
            title: '成功',
            variant: 'success',
            solid: true
          });
        }
        this.showTagModal = false; // 操作成功后关闭模态框
      } catch (error) {
        // 错误信息会由 Vuex 映射到 errorMessage
        this.$bvToast.toast(this.errorMessage || '操作失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      }
    },
    
    // 删除标签
    async deleteTag() {
      if (!this.tagToDelete) return;
      
      try {
        // 调用删除标签 action
        await this.deleteTag(this.tagToDelete._id);
        this.$bvToast.toast('标签已删除', {
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
        this.tagToDelete = null; // 清空待删除标签
      }
    },
    
    // 重置标签表单
    resetTagForm() {
      this.tagForm = {
        _id: null,
        name: '',
        color: '#3498db'
      };
    }
  }
};
</script>

<style scoped>
/* 颜色预览块 */
.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 1px solid #ddd; /* 增加边框以便白色背景颜色可见 */
  border-radius: 4px;
  vertical-align: middle;
}

/* 覆盖 Bootstrap 的一些默认颜色 */
.btn-primary {
  background-color: #0088cc !important;
  border-color: #0088cc !important;
}

.btn-primary:hover {
  background-color: #006699 !important;
  border-color: #006699 !important;
}

.btn-success {
  background-color: #28a745 !important;
  border-color: #28a745 !important;
}

.btn-success:hover {
  background-color: #218838 !important;
  border-color: #1e7e34 !important;
}
</style>