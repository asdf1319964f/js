<template>
  <div id="app">
    <header>
      <b-navbar toggleable="lg" type="dark" variant="info">
        <b-container>
          <b-navbar-brand to="/">Telegram收藏夹</b-navbar-brand>
          <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
          <b-collapse id="nav-collapse" is-nav>
            <b-navbar-nav>
              <b-nav-item to="/" exact>首页</b-nav-item>
              <b-nav-item to="/favorites">收藏内容</b-nav-item>
              <b-nav-item to="/tags">标签管理</b-nav-item>
            </b-navbar-nav>

            <b-navbar-nav class="ml-auto">
              <b-nav-form class="d-flex my-2 my-lg-0">
                <b-form-input
                  size="sm"
                  class="mr-sm-2"
                  placeholder="搜索收藏..."
                  v-model="searchQuery"
                  @keyup.enter="onSearch"
                ></b-form-input>
                <b-button size="sm" class="my-2 my-sm-0" type="submit" @click.prevent="onSearch" variant="outline-light">
                  <i class="bi bi-search"></i>
                </b-button>
              </b-nav-form>

              <b-nav-item-dropdown right v-if="isLoggedIn">
                <template #button-content>
                  <em class="text-white">{{ username }}</em>
                </template>
                <b-dropdown-item to="/settings">设置</b-dropdown-item>
                <b-dropdown-item @click="confirmLogout">退出登录</b-dropdown-item>
              </b-nav-item-dropdown>
              <b-nav-item v-else to="/login">登录</b-nav-item>
            </b-navbar-nav>
          </b-collapse>
        </b-container>
      </b-navbar>
    </header>

    <main class="container mt-4 flex-grow-1">
      <router-view />
    </main>

    <footer class="footer mt-5 py-3 bg-light text-center">
      <b-container>
        <span class="text-muted">Telegram收藏夹查看系统 &copy; {{ new Date().getFullYear() }}</span>
      </b-container>
    </footer>

    <b-modal id="logout-modal" title="确认退出" ok-variant="danger" ok-title="退出" @ok="logout">
      <p>确定要退出登录吗？</p>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'App',
  data() {
    return {
      searchQuery: ''
    };
  },
  computed: {
    ...mapGetters('auth', ['isLoggedIn', 'username'])
  },
  methods: {
    ...mapActions('auth', ['logout']), // 映射 auth 模块的 logout action
    
    // 全局搜索逻辑
    onSearch() {
      if (this.searchQuery.trim()) {
        // 跳转到搜索页面，并传递搜索关键字作为查询参数
        this.$router.push({
          path: '/search',
          query: { q: this.searchQuery.trim() }
        }).catch(() => {}); // 捕获重复导航的错误
        this.searchQuery = ''; // 清空搜索框
      }
    },

    // 确认退出登录
    confirmLogout() {
      this.$bvModal.show('logout-modal');
    }
  },
  // 在组件创建时尝试加载用户数据，以防页面刷新后 Vuex 状态丢失
  created() {
    // 仅在 isLoggedIn 为假，但 localStorage 中有 token 时尝试恢复会话
    if (!this.isLoggedIn && localStorage.getItem('token')) {
      this.$store.dispatch('auth/initializeAuth');
    }
  }
};
</script>

<style>
/* 全局样式 */
body {
  background-color: #f5f5f5;
  padding-top: 56px; /* 为固定导航栏留出空间 */
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 确保 App 占据整个视口高度，使页脚始终在底部 */
}

main {
  flex: 1; /* 确保主内容区域占据可用空间，将页脚推到底部 */
}

.navbar {
  background-color: #0088cc !important; /* Telegram蓝色 */
}

.navbar-brand, .nav-link {
  color: white !important;
}

.btn-primary {
  background-color: #0088cc !important;
  border-color: #0088cc !important;
}

.btn-primary:hover {
  background-color: #006699 !important;
  border-color: #006699 !important;
}

.btn-outline-primary {
  color: #0088cc !important;
  border-color: #0088cc !important;
}

.btn-outline-primary:hover {
  background-color: #0088cc !important;
  color: white !important;
}

/* 覆盖 BootstrapVue 的一些默认颜色，使其更符合Telegram风格 */
.badge.bg-info {
  background-color: #0088cc !important;
}

/* 其他通用样式 */
.card {
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.loading, .empty-state {
  text-align: center;
  padding: 50px 0;
}

.empty-state i {
  font-size: 5rem;
  color: #dee2e6;
}

.empty-state h3 {
  margin-top: 20px;
  color: #6c757d;
}

.empty-state p {
  color: #adb5bd;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>