<template>
  <div class="login-page">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <ul class="nav nav-tabs card-header-tabs">
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'login' }" href="#" @click.prevent="activeTab = 'login'">登录</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'register' }" href="#" @click.prevent="activeTab = 'register'">注册</a>
              </li>
            </ul>
          </div>
          <div class="card-body">
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <!-- 登录表单 -->
            <div v-if="activeTab === 'login'">
              <h4 class="text-center mb-4">登录到Telegram收藏夹</h4>
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="username" class="form-label">用户名</label>
                  <input
                    type="text"
                    id="username"
                    class="form-control"
                    v-model="loginForm.username"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
                
                <div class="mb-3">
                  <label for="password" class="form-label">密码</label>
                  <input
                    type="password"
                    id="password"
                    class="form-control"
                    v-model="loginForm.password"
                    placeholder="请输入密码"
                    required
                  />
                </div>
                
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                    登录
                  </button>
                </div>
              </form>
            </div>
            
            <!-- 注册表单 -->
            <div v-if="activeTab === 'register'">
              <h4 class="text-center mb-4">注册新账号</h4>
              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label for="reg-username" class="form-label">用户名</label>
                  <input
                    type="text"
                    id="reg-username"
                    class="form-control"
                    v-model="registerForm.username"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
                
                <div class="mb-3">
                  <label for="reg-password" class="form-label">密码</label>
                  <input
                    type="password"
                    id="reg-password"
                    class="form-control"
                    v-model="registerForm.password"
                    placeholder="请输入密码"
                    required
                  />
                </div>
                
                <div class="mb-3">
                  <label for="reg-confirm-password" class="form-label">确认密码</label>
                  <input
                    type="password"
                    id="reg-confirm-password"
                    class="form-control"
                    v-model="registerForm.confirmPassword"
                    placeholder="请再次输入密码"
                    required
                  />
                </div>
                
                <div class="mb-4">
                  <h5>添加Telegram账号（可选）</h5>
                  <p class="text-muted small">您可以在注册后在设置页面添加Telegram账号</p>
                  
                  <div class="mb-3">
                    <label for="api-id" class="form-label">API ID</label>
                    <input
                      type="text"
                      id="api-id"
                      class="form-control"
                      v-model="registerForm.apiId"
                      placeholder="请输入Telegram API ID"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <label for="api-hash" class="form-label">API Hash</label>
                    <input
                      type="text"
                      id="api-hash"
                      class="form-control"
                      v-model="registerForm.apiHash"
                      placeholder="请输入Telegram API Hash"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <label for="session-string" class="form-label">SESSION_STRING</label>
                    <textarea
                      id="session-string"
                      class="form-control"
                      v-model="registerForm.sessionString"
                      rows="3"
                      placeholder="请输入Telegram SESSION_STRING"
                    ></textarea>
                    <div class="form-text">
                      <a href="#" @click.prevent="showSessionHelp = true">如何获取SESSION_STRING?</a>
                    </div>
                  </div>
                </div>
                
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loading || !isRegisterFormValid">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                    注册
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
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
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'Login',
  
  data() {
    return {
      activeTab: 'login',
      showSessionHelp: false,
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        password: '',
        confirmPassword: '',
        apiId: '',
        apiHash: '',
        sessionString: ''
      }
    };
  },
  
  computed: {
    ...mapGetters('auth', ['error', 'loading']),
    
    isRegisterFormValid() {
      const { password, confirmPassword } = this.registerForm;
      if (password !== confirmPassword) {
        return false;
      }
      
      // 如果提供了API凭证，则必须同时提供三个字段
      const { apiId, apiHash, sessionString } = this.registerForm;
      if (apiId || apiHash || sessionString) {
        return apiId && apiHash && sessionString;
      }
      
      return true;
    }
  },
  
  methods: {
    ...mapActions('auth', ['login', 'register', 'clearError', 'fetchCurrentUser']),
    
    // 处理登录 - 极简版本，避免任何可能的状态同步问题
    async handleLogin() {
      if (!this.loginForm.username || !this.loginForm.password) {
        return;
      }
      
      try {
        console.log('[Login] 开始登录流程');
        this.clearError();
        
        // 登录并获取token
        const result = await this.login({
          username: this.loginForm.username,
          password: this.loginForm.password
        });
        
        console.log('[Login] 登录成功，获取到token');
        
        // 确保token已写入localStorage
        if (result && result.token) {
          // 手动设置token到localStorage
          localStorage.setItem('token', result.token);
          console.log('[Login] Token已写入localStorage');
          
          // 延迟跳转，确保token已完全写入
          setTimeout(() => {
            const redirectPath = this.$route.query.redirect || '/favorites';
            console.log(`[Login] 准备跳转到: ${redirectPath}`);
            
            // 使用window.location直接跳转，绕过Vue Router可能的问题
            window.location.href = redirectPath;
          }, 500);
        }
      } catch (error) {
        console.error('[Login] 登录失败:', error);
        // 显示错误信息给用户
        this.$bvToast.toast(error.message || '登录失败，请重试', {
          title: '登录错误',
          variant: 'danger',
          solid: true
        });
      }
    },
    
    // 处理注册
    async handleRegister() {
      if (!this.isRegisterFormValid) {
        return;
      }
      
      try {
        const userData = {
          username: this.registerForm.username,
          password: this.registerForm.password
        };
        
        // 如果提供了API凭证，添加到注册数据中
        if (this.registerForm.apiId && this.registerForm.apiHash && this.registerForm.sessionString) {
          userData.telegramAccounts = [{
            name: '默认账号',
            apiId: this.registerForm.apiId,
            apiHash: this.registerForm.apiHash,
            sessionString: this.registerForm.sessionString
          }];
        }
        
        await this.register(userData);
        
        // 注册成功后切换到登录标签
        this.activeTab = 'login';
        this.$bvToast.toast('注册成功，请登录', {
          title: '注册成功',
          variant: 'success',
          solid: true
        });
      } catch (error) {
        console.error('注册失败:', error);
      }
    }
  },
  
  created() {
    // 清除之前的错误
    this.clearError();
  }
};
</script>

<style scoped>
.login-page {
  padding-top: 60px;
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
