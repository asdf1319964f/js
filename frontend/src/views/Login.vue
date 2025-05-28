<template>
  <div class="login-page">
    <b-container>
      <b-row class="justify-content-center">
        <b-col md="6">
          <b-card no-body>
            <b-card-header header-tag="nav">
              <b-nav card-header tabs>
                <b-nav-item :active="activeTab === 'login'" @click="activeTab = 'login'">登录</b-nav-item>
                <b-nav-item :active="activeTab === 'register'" @click="activeTab = 'register'">注册</b-nav-item>
              </b-nav>
            </b-card-header>

            <b-card-body>
              <b-alert v-if="hasError" show variant="danger">{{ errorMessage }}</b-alert>
              <b-alert v-if="successMessage" show variant="success">{{ successMessage }}</b-alert>
              
              <div v-if="activeTab === 'login'">
                <h4 class="text-center mb-4">登录到Telegram收藏夹</h4>
                <b-form @submit.prevent="handleLogin">
                  <b-form-group
                    label="用户名:"
                    label-for="username"
                  >
                    <b-form-input
                      id="username"
                      type="text"
                      v-model="loginForm.username"
                      placeholder="请输入用户名"
                      required
                    ></b-form-input>
                  </b-form-group>
                  
                  <b-form-group
                    label="密码:"
                    label-for="password"
                  >
                    <b-form-input
                      id="password"
                      type="password"
                      v-model="loginForm.password"
                      placeholder="请输入密码"
                      required
                    ></b-form-input>
                  </b-form-group>
                  
                  <b-button type="submit" variant="primary" class="w-100" :disabled="isLoading">
                    <b-spinner v-if="isLoading" small type="grow"></b-spinner> 登录
                  </b-button>
                </b-form>
              </div>
              
              <div v-if="activeTab === 'register'">
                <h4 class="text-center mb-4">注册新账号</h4>
                <b-form @submit.prevent="handleRegister">
                  <b-form-group
                    label="用户名:"
                    label-for="reg-username"
                  >
                    <b-form-input
                      id="reg-username"
                      type="text"
                      v-model="registerForm.username"
                      placeholder="请输入用户名"
                      required
                    ></b-form-input>
                  </b-form-group>
                  
                  <b-form-group
                    label="密码:"
                    label-for="reg-password"
                  >
                    <b-form-input
                      id="reg-password"
                      type="password"
                      v-model="registerForm.password"
                      placeholder="请输入密码"
                      required
                    ></b-form-input>
                  </b-form-group>
                  
                  <b-form-group
                    label="确认密码:"
                    label-for="reg-confirm-password"
                  >
                    <b-form-input
                      id="reg-confirm-password"
                      type="password"
                      v-model="registerForm.confirmPassword"
                      placeholder="请再次输入密码"
                      required
                      :state="passwordMatchState"
                    ></b-form-input>
                    <b-form-invalid-feedback :state="passwordMatchState">
                        两次输入的密码不一致
                    </b-form-invalid-feedback>
                  </b-form-group>

                  <h5 class="mt-4">添加Telegram账号（可选）</h5>
                  <p class="text-muted small">您可以在注册后在设置页面添加Telegram账号</p>
                  
                  <b-form-group label="API ID:" label-for="api-id">
                    <b-form-input id="api-id" type="text" v-model="registerForm.apiId" placeholder="请输入Telegram API ID"></b-form-input>
                  </b-form-group>
                  
                  <b-form-group label="API Hash:" label-for="api-hash">
                    <b-form-input id="api-hash" type="text" v-model="registerForm.apiHash" placeholder="请输入Telegram API Hash"></b-form-input>
                  </b-form-group>
                  
                  <b-form-group label="SESSION_STRING:" label-for="session-string">
                    <b-form-textarea id="session-string" v-model="registerForm.sessionString" rows="3" placeholder="请输入Telegram SESSION_STRING"></b-form-textarea>
                    <small class="form-text text-muted">
                      <a href="#" @click.prevent="showSessionHelp = true">如何获取SESSION_STRING?</a>
                    </small>
                  </b-form-group>
                  
                  <b-button type="submit" variant="primary" class="w-100" :disabled="isLoading || !isRegisterFormValid">
                    <b-spinner v-if="isLoading" small type="grow"></b-spinner> 注册
                  </b-button>
                </b-form>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
    
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
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'Login',
  
  data() {
    return {
      activeTab: 'login', // 默认显示登录表单
      showSessionHelp: false, // 控制 SESSION_STRING 帮助模态框显示
      successMessage: '', // 注册成功提示信息
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
    ...mapGetters('auth', ['isLoading', 'hasError', 'errorMessage']), // 从 auth 模块映射加载和错误状态
    
    passwordMatchState() {
      // 密码和确认密码一致性验证
      if (this.registerForm.password.length === 0 && this.registerForm.confirmPassword.length === 0) {
        return null; // 初始状态不显示验证错误
      }
      return this.registerForm.password === this.registerForm.confirmPassword;
    },

    isRegisterFormValid() {
      // 检查必填字段
      if (!this.registerForm.username || !this.registerForm.password || !this.registerForm.confirmPassword) {
        return false;
      }
      // 密码一致性
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        return false;
      }
      // 如果提供了任何一个 Telegram API 凭证，则要求全部提供
      const { apiId, apiHash, sessionString } = this.registerForm;
      if (apiId || apiHash || sessionString) {
        return apiId && apiHash && sessionString;
      }
      return true;
    }
  },
  
  methods: {
    ...mapActions('auth', ['login', 'register', 'clearError']), // 从 auth 模块映射 actions
    
    // 处理用户登录
    async handleLogin() {
      this.clearError(); // 清除之前的错误信息
      this.successMessage = ''; // 清除成功信息

      if (!this.loginForm.username || !this.loginForm.password) {
        this.$bvToast.toast('请输入用户名和密码', { title: '提示', variant: 'warning', solid: true });
        return;
      }
      
      try {
        const result = await this.login({
          username: this.loginForm.username,
          password: this.loginForm.password
        });
        
        // 登录成功后，根据路由中的 redirect 参数进行跳转，否则跳转到收藏页
        const redirectPath = this.$route.query.redirect || '/favorites';
        this.$router.replace(redirectPath); // 使用 replace 避免在历史记录中留下登录页
        
        this.loginForm.username = ''; // 清空表单
        this.loginForm.password = '';
      } catch (error) {
        // 错误信息会由 Vuex 映射到 errorMessage
        this.$bvToast.toast(this.errorMessage || '登录失败，请重试', {
          title: '登录错误',
          variant: 'danger',
          solid: true
        });
      }
    },
    
    // 处理用户注册
    async handleRegister() {
      this.clearError(); // 清除之前的错误信息
      this.successMessage = ''; // 清除成功信息

      if (!this.isRegisterFormValid) {
        this.$bvToast.toast('请检查表单字段，确保密码一致且Telegram凭证完整', { title: '验证失败', variant: 'warning', solid: true });
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
            name: '默认账号', // 注册时默认名称
            apiId: this.registerForm.apiId,
            apiHash: this.registerForm.apiHash,
            sessionString: this.registerForm.sessionString
          }];
        }
        
        await this.register(userData);
        
        // 注册成功后切换到登录标签并显示成功信息
        this.activeTab = 'login';
        this.successMessage = '注册成功，请登录！';
        
        // 清空注册表单
        this.registerForm = {
          username: '',
          password: '',
          confirmPassword: '',
          apiId: '',
          apiHash: '',
          sessionString: ''
        };

        this.$bvToast.toast('注册成功，请登录', {
          title: '注册成功',
          variant: 'success',
          solid: true
        });

      } catch (error) {
        // 错误信息会由 Vuex 映射到 errorMessage
        this.$bvToast.toast(this.errorMessage || '注册失败，请稍后重试', {
          title: '注册错误',
          variant: 'danger',
          solid: true
        });
      }
    }
  },
  
  created() {
    this.clearError(); // 组件创建时清除可能存在的错误信息
  }
};
</script>

<style scoped>
.login-page {
  padding-top: 60px; /* 为 App.vue 中的固定导航栏留出空间 */
}

/* 覆盖 BootstrapVue Card Header Tabs 的一些样式 */
.card-header .nav-tabs .nav-link {
  color: #0088cc;
}

.card-header .nav-tabs .nav-link.active {
  color: white;
  background-color: #0088cc;
  border-color: #0088cc;
}

.card-header .nav-tabs {
  border-bottom: 1px solid #dee2e6; /* 恢复默认的底部边框 */
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