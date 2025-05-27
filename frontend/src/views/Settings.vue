<template>
  <div class="settings-page">
    <h2 class="mb-4">用户设置</h2>
    
    <!-- 错误提示 -->
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- 成功提示 -->
    <div v-if="saveSuccess" class="alert alert-success">
      设置已成功保存！
    </div>
    
    <!-- 设置表单 -->
    <div class="card">
      <div class="card-body">
        <form @submit.prevent="saveSettings">
          <div class="mb-3">
            <label class="form-label">默认视图</label>
            <div class="form-check">
              <input class="form-check-input" type="radio" id="grid-view" value="grid" v-model="settings.defaultView">
              <label class="form-check-label" for="grid-view">
                网格视图
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" id="list-view" value="list" v-model="settings.defaultView">
              <label class="form-check-label" for="list-view">
                列表视图
              </label>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="items-per-page" class="form-label">每页显示数量</label>
            <select class="form-select" id="items-per-page" v-model="settings.itemsPerPage">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          
          <div class="d-grid gap-2 d-md-flex justify-content-md-end">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              保存设置
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- SESSION_STRING管理模块 -->
    <div class="card mt-4">
      <div class="card-header">
        <h5 class="mb-0">Telegram会话管理</h5>
      </div>
      <div class="card-body">
        <!-- SESSION_STRING状态显示 -->
        <div v-if="sessionStatus === 'active'" class="alert alert-success">
          <i class="bi bi-check-circle me-2"></i> 您的Telegram会话已连接，收藏内容将自动同步。
        </div>
        <div v-else-if="sessionStatus === 'error'" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i> 会话连接错误: {{ sessionError }}
        </div>
        <div v-else class="alert alert-warning">
          <i class="bi bi-info-circle me-2"></i> 您尚未连接Telegram会话，请添加您的SESSION_STRING。
        </div>
        
        <!-- SESSION_STRING表单 -->
        <form @submit.prevent="saveSessionString" v-if="!showSessionForm && sessionStatus !== 'active'">
          <button type="button" class="btn btn-primary" @click="showSessionForm = true">
            添加SESSION_STRING
          </button>
        </form>
        
        <form @submit.prevent="saveSessionString" v-if="showSessionForm || sessionStatus === 'active'">
          <div class="mb-3">
            <label for="session-string" class="form-label">SESSION_STRING</label>
            <textarea
              id="session-string"
              class="form-control"
              v-model="sessionString"
              rows="3"
              placeholder="请输入您的Telegram SESSION_STRING..."
              :disabled="sessionLoading"
            ></textarea>
            <div class="form-text">
              SESSION_STRING包含敏感信息，请勿与他人分享。
              <a href="#" @click.prevent="showSessionHelp = true">如何获取SESSION_STRING?</a>
            </div>
          </div>
          
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" :disabled="sessionLoading || !sessionString.trim()">
              <span v-if="sessionLoading" class="spinner-border spinner-border-sm me-1"></span>
              {{ sessionStatus === 'active' ? '更新SESSION_STRING' : '保存SESSION_STRING' }}
            </button>
            
            <button v-if="sessionStatus === 'active'" type="button" class="btn btn-danger" @click="confirmRemoveSession">
              删除SESSION_STRING
            </button>
            
            <button v-if="showSessionForm" type="button" class="btn btn-secondary" @click="showSessionForm = false">
              取消
            </button>
          </div>
        </form>
        
        <!-- 同步控制 -->
        <div v-if="sessionStatus === 'active'" class="mt-4">
          <h6>同步控制</h6>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary" @click="syncFavorites" :disabled="syncLoading">
              <span v-if="syncLoading" class="spinner-border spinner-border-sm me-1"></span>
              手动同步收藏
            </button>
            <span class="text-muted align-self-center" v-if="lastSyncTime">
              上次同步: {{ formatDate(lastSyncTime) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 用户信息 -->
    <div class="card mt-4">
      <div class="card-header">
        <h5 class="mb-0">用户信息</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-2">
            <img :src="user.profilePhoto || '/assets/img/default-avatar.png'" class="img-fluid rounded-circle" alt="用户头像">
          </div>
          <div class="col-md-10">
            <h5>{{ user.firstName }} {{ user.lastName }}</h5>
            <p class="text-muted">@{{ user.username }}</p>
            <p><strong>Telegram ID:</strong> {{ user.telegramId }}</p>
            <p><strong>注册时间:</strong> {{ formatDate(user.createdAt) }}</p>
            <p><strong>最后登录:</strong> {{ formatDate(user.lastLogin) }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 退出登录 -->
    <div class="card mt-4">
      <div class="card-header">
        <h5 class="mb-0">账号操作</h5>
      </div>
      <div class="card-body">
        <button class="btn btn-danger" @click="confirmLogout">
          <i class="bi bi-box-arrow-right me-1"></i> 退出登录
        </button>
      </div>
    </div>
    
    <!-- SESSION_STRING帮助对话框 -->
    <b-modal id="session-help-modal" title="如何获取SESSION_STRING" v-model="showSessionHelp">
      <div>
        <p>获取Telegram SESSION_STRING的步骤：</p>
        <ol>
          <li>安装Python 3.8+</li>
          <li>安装Telethon库: <code>pip install telethon</code></li>
          <li>创建并运行以下Python脚本：</li>
        </ol>
        <pre><code>from telethon.sync import TelegramClient
from telethon.sessions import StringSession

API_ID = "您的API_ID"
API_HASH = "您的API_HASH"

with TelegramClient(StringSession(), API_ID, API_HASH) as client:
    print("请登录您的Telegram账号...")
    client.start()
    session_string = client.session.save()
    print(f"您的SESSION_STRING: {session_string}")</code></pre>
        <p>运行脚本后，按照提示登录您的Telegram账号，然后复制生成的SESSION_STRING。</p>
        <p class="text-danger">注意：SESSION_STRING包含敏感信息，请勿与他人分享。</p>
      </div>
    </b-modal>
    
    <!-- 退出确认对话框 -->
    <b-modal id="logout-modal" title="确认退出" @ok="logout">
      <p>确定要退出登录吗？</p>
    </b-modal>
    
    <!-- 删除SESSION确认对话框 -->
    <b-modal id="remove-session-modal" title="确认删除SESSION_STRING" @ok="removeSessionString">
      <p>确定要删除您的SESSION_STRING吗？</p>
      <p class="text-danger">删除后，您将无法同步和查看Telegram收藏内容，直到重新添加SESSION_STRING。</p>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Settings',
  
  data() {
    return {
      settings: {
        defaultView: 'grid',
        itemsPerPage: 20
      },
      saveSuccess: false,
      sessionString: '',
      showSessionForm: false,
      showSessionHelp: false
    };
  },
  
  computed: {
    ...mapGetters('auth', [
      'user', 
      'loading', 
      'error', 
      'sessionStatus', 
      'sessionError', 
      'lastSyncTime',
      'syncLoading',
      'sessionLoading'
    ])
  },
  
  methods: {
    ...mapActions('auth', [
      'updateUserSettings', 
      'logout', 
      'updateSessionString', 
      'removeSessionString', 
      'syncFavorites'
    ]),
    
    // 保存设置
    async saveSettings() {
      try {
        await this.updateUserSettings(this.settings);
        this.saveSuccess = true;
        
        // 3秒后隐藏成功提示
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
    
    // 保存SESSION_STRING
    async saveSessionString() {
      try {
        await this.updateSessionString(this.sessionString);
        this.showSessionForm = false;
      } catch (error) {
        console.error('保存SESSION_STRING失败:', error);
      }
    },
    
    // 确认删除SESSION_STRING
    confirmRemoveSession() {
      this.$bvModal.show('remove-session-modal');
    },
    
    // 确认退出
    confirmLogout() {
      this.$bvModal.show('logout-modal');
    },
    
    // 手动同步收藏
    async syncFavorites() {
      try {
        await this.syncFavorites();
        this.$bvToast.toast('收藏同步成功', {
          title: '同步成功',
          variant: 'success',
          solid: true
        });
      } catch (error) {
        console.error('同步收藏失败:', error);
        this.$bvToast.toast(error.message || '同步失败', {
          title: '同步失败',
          variant: 'danger',
          solid: true
        });
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '未知';
      
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
  
  // 组件创建时
  created() {
    // 获取用户设置
    if (this.user && this.user.settings) {
      this.settings = { ...this.user.settings };
    }
    
    // 获取SESSION_STRING
    if (this.user && this.user.sessionString) {
      this.sessionString = this.user.sessionString;
    }
  }
};
</script>

<style scoped>
.settings-page {
  padding-bottom: 30px;
}

pre {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
}

code {
  color: #d63384;
}
</style>
