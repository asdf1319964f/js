<template>
  <div class="settings-page">
    <h2 class="mb-4">用户设置</h2>
    
    <b-alert v-if="hasError" show variant="danger">{{ errorMessage }}</b-alert>
    
    <b-alert v-if="saveSuccess" show variant="success">设置已成功保存！</b-alert>
    
    <b-card class="mb-4">
      <template #header><h5>通用设置</h5></template>
      <b-card-body>
        <b-form @submit.prevent="saveSettings">
          <b-form-group label="默认视图:" label-for="default-view">
            <b-form-radio-group
              id="default-view"
              v-model="settings.defaultView"
              :options="[{ text: '网格视图', value: 'grid' }, { text: '列表视图', value: 'list' }]"
              stacked
            ></b-form-radio-group>
          </b-form-group>
          
          <b-form-group label="每页显示数量:" label-for="items-per-page">
            <b-form-select
              id="items-per-page"
              v-model="settings.itemsPerPage"
              :options="[10, 20, 50, 100]"
            ></b-form-select>
          </b-form-group>
          
          <div class="d-flex justify-content-end">
            <b-button type="submit" variant="primary" :disabled="isLoading">
              <b-spinner v-if="isLoading" small type="grow"></b-spinner> 保存设置
            </b-button>
          </div>
        </b-form>
      </b-card-body>
    </b-card>
    
    <b-card class="mt-4 mb-4">
      <template #header>
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Telegram账户管理</h5>
          <b-button size="sm" variant="success" @click="showAddAccountModal">
            <i class="bi bi-plus-circle me-1"></i> 添加账户
          </b-button>
        </div>
      </template>
      <b-card-body>
        <b-alert v-if="telegramAccounts.length === 0" show variant="info">
          <i class="bi bi-info-circle me-1"></i> 暂无Telegram账户，请添加您的第一个账户。
        </b-alert>
        <b-list-group v-else>
          <b-list-group-item v-for="account in telegramAccounts" :key="account.id"
            :class="{ 'border-primary': account.isActive, 'account-item': true }"
            class="d-flex justify-content-between align-items-center"
          >
            <div>
              <h6>{{ account.name || `账户 ${account.id.substring(0, 8)}...` }}
                <b-badge v-if="account.isActive" variant="primary" class="ms-2">活跃</b-badge>
              </h6>
              <p class="text-muted mb-0 small">
                @{{ account.username || 'N/A' }} (ID: {{ account.telegramId || 'N/A' }})<br/>
                上次同步: {{ account.lastSync | $_formatDate({year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) }}
              </p>
            </div>
            <div class="d-flex gap-2">
              <b-button v-if="!account.isActive" size="sm" variant="outline-primary" @click="switchActiveAccount(account.id)" :disabled="isLoading">
                切换活跃
              </b-button>
              <b-button size="sm" variant="outline-danger" @click="confirmDeleteAccount(account)">
                <i class="bi bi-trash"></i> 删除
              </b-button>
            </div>
          </b-list-group-item>
        </b-list-group>
      </b-card-body>
    </b-card>

    <b-card class="mt-4 mb-4">
      <template #header><h5>收藏同步</h5></template>
      <b-card-body>
        <p v-if="sessionStatus === 'active'" class="text-success mb-2">
          <i class="bi bi-check-circle me-2"></i> 您的Telegram会话已连接，收藏内容将自动同步。
        </p>
        <p v-else-if="sessionStatus === 'error'" class="text-danger mb-2">
          <i class="bi bi-exclamation-triangle me-2"></i> 会话连接错误: {{ sessionError }}
        </p>
        <p v-else class="text-warning mb-2">
          <i class="bi bi-info-circle me-2"></i> 您尚未连接Telegram会话，请在"添加账户"时提供完整的Telegram凭证。
        </p>

        <b-button variant="outline-primary" @click="syncFavorites" :disabled="syncLoading || !hasActiveAccount">
          <b-spinner v-if="syncLoading" small type="grow"></b-spinner> 手动同步收藏
        </b-button>
        <small class="text-muted ms-3" v-if="lastSyncTime">
          上次同步: {{ lastSyncTime | $_formatDate({year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) }}
        </small>
      </b-card-body>
    </b-card>

    <b-card class="mt-4 mb-4" v-if="activeAccount">
      <template #header><h5>用户信息</h5></template>
      <b-card-body>
        <b-row align-v="center">
          <b-col md="2" cols="4">
            <b-img :src="activeAccount.profilePhoto || defaultAvatar" rounded="circle" fluid alt="用户头像"></b-img>
          </b-col>
          <b-col md="10" cols="8">
            <h5>{{ activeAccount.firstName || 'N/A' }} {{ activeAccount.lastName || 'N/A' }}</h5>
            <p class="text-muted">@{{ activeAccount.username || 'N/A' }}</p>
            <p class="mb-0"><strong>Telegram ID:</strong> {{ activeAccount.telegramId || 'N/A' }}</p>
            <p class="mb-0"><strong>注册时间:</strong> {{ user.createdAt | $_formatDate() }}</p>
            <p class="mb-0"><strong>最后登录:</strong> {{ user.lastLogin | $_formatDate() }}</p>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
    <b-card class="mt-4 mb-4" v-else> <template #header><h5>用户信息</h5></template>
        <b-card-body>
            <p class="text-muted">请添加并激活您的Telegram账户，以查看您的用户信息。</p>
        </b-card-body>
    </b-card>
    
    <b-card class="mt-4 mb-4">
      <template #header><h5>账户操作</h5></template>
      <b-card-body>
        <b-button variant="danger" @click="confirmLogout">
          <i class="bi bi-box-arrow-right me-1"></i> 退出登录
        </b-button>
      </b-card-body>
    </b-card>

    <b-modal
      id="add-account-modal"
      :title="isEditingAccount ? '编辑Telegram账户' : '添加Telegram账户'"
      v-model="showAddAccountModalForm"
      @ok="handleAddAccountSubmit"
      @hidden="resetAddAccountForm"
      :ok-disabled="!isAddAccountFormValid"
      :ok-title="isEditingAccount ? '保存' : '添加'"
    >
      <b-form>
        <b-form-group label="账户名称 (可选):" label-for="modal-account-name">
          <b-form-input id="modal-account-name" v-model="addAccountForm.name" placeholder="例如：个人账户"></b-form-input>
        </b-form-group>
        <b-form-group label="API ID:" label-for="modal-api-id">
          <b-form-input id="modal-api-id" v-model="addAccountForm.apiId" required></b-form-input>
          <div class="form-text">从 <a href="https://my.telegram.org/apps" target="_blank">my.telegram.org/apps</a> 获取</div>
        </b-form-group>
        <b-form-group label="API Hash:" label-for="modal-api-hash">
          <b-form-input id="modal-api-hash" v-model="addAccountForm.apiHash" required></b-form-input>
        </b-form-group>
        <b-form-group label="SESSION_STRING:" label-for="modal-session-string">
          <b-form-textarea id="modal-session-string" v-model="addAccountForm.sessionString" rows="3" required></b-form-textarea>
          <div class="form-text">
            使用Telegram客户端生成的会话字符串
            <a href="#" @click.prevent="showSessionHelp = true">如何获取SESSION_STRING?</a>
          </div>
        </b-form-group>
      </b-form>
    </b-modal>

    <b-modal id="session-help-modal" title="如何获取SESSION_STRING" v-model="showSessionHelp" ok-only>
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
    
    <b-modal id="delete-account-modal" title="确认删除账户" ok-variant="danger" ok-title="删除" @ok="deleteAccount">
      <p>确定要删除账户 "{{ accountToDelete ? accountToDelete.name : '' }}" 吗？</p>
      <p class="text-danger">删除账户后，您将无法查看和同步与此账户相关的收藏内容。</p>
    </b-modal>

    <b-modal id="logout-modal" title="确认退出" ok-variant="danger" ok-title="退出" @ok="logout">
      <p>确定要退出登录吗？</p>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Settings',
  
  data() {
    return {
      saveSuccess: false, // 保存设置成功提示
      showSessionHelp: false, // SESSION_STRING 帮助模态框
      showAddAccountModalForm: false, // 添加/编辑账户模态框
      isEditingAccount: false, // 是否处于编辑模式
      accountToDelete: null, // 待删除的账户
      
      // 用户设置本地副本，用于表单绑定
      settings: {
        defaultView: 'grid',
        itemsPerPage: 20
      },
      
      // 添加/编辑账户表单数据
      addAccountForm: {
        id: null, // 用于编辑模式
        name: '',
        apiId: '',
        apiHash: '',
        sessionString: ''
      },

      defaultAvatar: require('@/assets/img/default-avatar.png'), // 默认头像占位符
    };
  },
  
  computed: {
    ...mapGetters('auth', [
      'currentUser', // 映射 currentUser 为 user
      'isLoading', // 映射全局加载状态
      'hasError',  // 映射全局错误状态
      'errorMessage', // 映射全局错误信息
      'telegramAccounts', // 映射所有 Telegram 账户
      'activeAccount', // 映射当前活跃账户
      'hasActiveAccount', // 映射是否有活跃账户
      'syncLoading', // 同步收藏的加载状态
      'lastSyncTime' // 上次同步时间
    ]),

    // user getter 的别名，用于模板访问 currentUser
    user: {
      get() { return this.currentUser; },
      set() {} // 只读，防止直接修改
    },
    
    // 检查添加账户表单是否有效
    isAddAccountFormValid() {
      const { apiId, apiHash, sessionString } = this.addAccountForm;
      return apiId && apiHash && sessionString;
    }
  },
  
  methods: {
    ...mapActions('auth', [
      'updateUserSettings', // 更新用户通用设置
      'logout',             // 退出登录
      'addTelegramAccount', // 添加 Telegram 账户
      'switchTelegramAccount', // 切换活跃账户
      'updateTelegramAccount', // 更新 Telegram 账户
      'deleteTelegramAccount', // 删除 Telegram 账户
      'syncFavorites'        // 手动同步收藏
    ]),
    
    // 保存通用设置
    async saveSettings() {
      try {
        await this.updateUserSettings(this.settings);
        this.saveSuccess = true;
        
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000); // 3秒后隐藏成功提示
      } catch (error) {
        console.error('保存设置失败:', error);
        this.$bvToast.toast(this.errorMessage || '保存设置失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      }
    },
    
    // 显示添加账户模态框
    showAddAccountModal() {
      this.isEditingAccount = false;
      this.resetAddAccountForm();
      this.showAddAccountModalForm = true;
    },

    // 显示编辑账户模态框
    showEditAccountModal(account) {
      this.isEditingAccount = true;
      // 拷贝账户数据到表单，避免直接修改 Vuex 状态
      this.addAccountForm = { 
        id: account.id,
        name: account.name,
        // API 凭证通常不从后端返回，所以这里无法预填充。
        // 如果要编辑它们，用户需要重新输入。
        apiId: '', 
        apiHash: '', 
        sessionString: '' 
      };
      this.showAddAccountModalForm = true;
    },

    // 处理添加/编辑账户表单提交
    async handleAddAccountSubmit(bvModalEvent) {
      bvModalEvent.preventDefault(); // 阻止模态框自动关闭
      
      if (!this.isAddAccountFormValid) {
        this.$bvToast.toast('请填写所有必填的API凭证字段', { title: '验证失败', variant: 'warning', solid: true });
        return;
      }
      
      try {
        const accountData = {
          name: this.addAccountForm.name.trim() || undefined, // 如果为空则不发送 name 字段
          apiId: this.addAccountForm.apiId.trim(),
          apiHash: this.addAccountForm.apiHash.trim(),
          sessionString: this.addAccountForm.sessionString.trim()
        };

        if (this.isEditingAccount) {
          await this.updateTelegramAccount({
            accountId: this.addAccountForm.id,
            updateData: accountData
          });
          this.$bvToast.toast('账户信息已更新', { title: '成功', variant: 'success', solid: true });
        } else {
          await this.addTelegramAccount(accountData);
          this.$bvToast.toast('Telegram账户已添加', { title: '成功', variant: 'success', solid: true });
        }
        
        this.showAddAccountModalForm = false; // 关闭模态框
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '操作失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      }
    },

    // 重置添加账户表单
    resetAddAccountForm() {
      this.addAccountForm = {
        id: null,
        name: '',
        apiId: '',
        apiHash: '',
        sessionString: ''
      };
      this.isEditingAccount = false;
    },
    
    // 切换活跃账户
    async switchActiveAccount(accountId) {
      try {
        await this.switchTelegramAccount(accountId);
        this.$bvToast.toast('活跃账户已切换', { title: '成功', variant: 'success', solid: true });
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '切换账户失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      }
    },
    
    // 确认删除账户
    confirmDeleteAccount(account) {
      this.accountToDelete = account;
      this.$bvModal.show('delete-account-modal');
    },

    // 删除账户
    async deleteAccount() {
      if (!this.accountToDelete) return;
      
      try {
        await this.deleteTelegramAccount(this.accountToDelete.id);
        this.$bvToast.toast('账户已删除', { title: '成功', variant: 'success', solid: true });
      } catch (error) {
        this.$bvToast.toast(this.errorMessage || '删除账户失败，请重试', {
          title: '错误',
          variant: 'danger',
          solid: true
        });
      } finally {
        this.accountToDelete = null;
      }
    },
    
    // 确认退出登录
    confirmLogout() {
      this.$bvModal.show('logout-modal');
    },

    // 格式化日期
    formatDate(dateString) {
      return this.$_formatDate(dateString); // 使用全局辅助函数
    }
  },
  
  // 组件创建时加载数据
  async created() {
    // 尝试获取最新的用户数据和账户列表
    if (this.isAuthenticated) { // 确保用户已登录
      try {
        await this.fetchCurrentUser(); // 这个 action 也会更新 activeAccount 和 telegramAccounts
        // 初始化 settings 副本
        if (this.user && this.user.settings) {
          this.settings = { ...this.user.settings };
        }
      } catch (error) {
        // fetchCurrentUser 内部已处理 token 无效的重定向
        console.error("加载用户设置和账户失败:", error);
      }
    }
  }
};
</script>

<style scoped>
.settings-page {
  padding-bottom: 30px;
}

.account-item {
  transition: all 0.2s ease-in-out;
}

.account-item:hover {
  background-color: #f8f9fa;
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

.border-primary {
  border-left: 4px solid #0088cc !important; /* 用于活跃账户的左边框 */
}
</style>