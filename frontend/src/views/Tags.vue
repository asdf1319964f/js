<template>
  <div class="tags-container">
    <b-container>
      <h1 class="my-4">标签管理</h1>
      
      <!-- 标签列表 -->
      <b-card class="mb-4">
        <template #header>
          <div class="d-flex justify-content-between align-items-center">
            <h4 class="mb-0">所有标签</h4>
            <b-button variant="primary" size="sm" @click="showAddTagModal">
              <i class="fas fa-plus"></i> 添加标签
            </b-button>
          </div>
        </template>
        
        <b-table
          :items="allTags"
          :fields="fields"
          striped
          hover
          responsive
          :busy="isLoading"
        >
          <template #cell(color)="data">
            <div class="color-preview" :style="{ backgroundColor: data.item.color }"></div>
            {{ data.item.color }}
          </template>
          
          <template #cell(actions)="data">
            <b-button-group size="sm">
              <b-button variant="outline-primary" @click="showEditTagModal(data.item)">
                <i class="fas fa-edit"></i>
              </b-button>
              <b-button variant="outline-danger" @click="showDeleteTagModal(data.item)">
                <i class="fas fa-trash"></i>
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
        
        <div v-if="!isLoading && allTags.length === 0" class="text-center py-3">
          <p class="text-muted">暂无标签，请点击"添加标签"按钮创建</p>
        </div>
      </b-card>
    </b-container>
    
    <!-- 添加/编辑标签模态框 -->
    <b-modal
      v-model="showTagModal"
      :title="isEditing ? '编辑标签' : '添加标签'"
      @ok="handleTagSubmit"
      @hidden="resetTagForm"
    >
      <b-form>
        <b-form-group label="标签名称" label-for="tag-name">
          <b-form-input
            id="tag-name"
            v-model="tagForm.name"
            required
            placeholder="输入标签名称"
          ></b-form-input>
        </b-form-group>
        
        <b-form-group label="标签颜色" label-for="tag-color">
          <b-form-input
            id="tag-color"
            v-model="tagForm.color"
            type="color"
          ></b-form-input>
        </b-form-group>
      </b-form>
    </b-modal>
    
    <!-- 删除标签确认模态框 -->
    <b-modal
      v-model="showDeleteModal"
      title="删除标签"
      ok-variant="danger"
      ok-title="删除"
      @ok="deleteTag"
    >
      <p>确定要删除标签 "{{ tagToDelete && tagToDelete.name ? tagToDelete.name : '' }}" 吗？</p>
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
      fields: [
        { key: 'name', label: '标签名称' },
        { key: 'color', label: '颜色' },
        { key: 'actions', label: '操作' }
      ],
      showTagModal: false,
      showDeleteModal: false,
      isEditing: false,
      tagForm: {
        name: '',
        color: '#3498db'
      },
      tagToDelete: null
    };
  },
  computed: {
    ...mapGetters({
      allTags: 'allTags',
      isLoading: 'isLoading',
      hasError: 'hasError',
      errorMessage: 'errorMessage'
    })
  },
  created() {
    this.fetchTags();
  },
  methods: {
    ...mapActions(['fetchTags', 'createTag', 'updateTag', 'deleteTag']),
    
    showAddTagModal() {
      this.isEditing = false;
      this.showTagModal = true;
    },
    
    showEditTagModal(tag) {
      this.isEditing = true;
      this.tagForm = { ...tag };
      this.showTagModal = true;
    },
    
    showDeleteTagModal(tag) {
      this.tagToDelete = tag;
      this.showDeleteModal = true;
    },
    
    async handleTagSubmit(bvModalEvent) {
      bvModalEvent.preventDefault();
      
      try {
        if (this.isEditing) {
          await this.updateTag({
            id: this.tagForm._id,
            tagData: {
              name: this.tagForm.name,
              color: this.tagForm.color
            }
          });
          this.$bvToast.toast('标签已更新', {
            title: '成功',
            variant: 'success'
          });
        } else {
          await this.createTag({
            name: this.tagForm.name,
            color: this.tagForm.color
          });
          this.$bvToast.toast('标签已创建', {
            title: '成功',
            variant: 'success'
          });
        }
        this.showTagModal = false;
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '操作失败', {
          title: '错误',
          variant: 'danger'
        });
      }
    },
    
    async deleteTag() {
      if (!this.tagToDelete) return;
      
      try {
        await this.deleteTag(this.tagToDelete._id);
        this.$bvToast.toast('标签已删除', {
          title: '成功',
          variant: 'success'
        });
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '删除失败', {
          title: '错误',
          variant: 'danger'
        });
      }
    },
    
    resetTagForm() {
      this.tagForm = {
        name: '',
        color: '#3498db'
      };
    }
  }
};
</script>

<style scoped>
.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border-radius: 4px;
  vertical-align: middle;
}
</style>
