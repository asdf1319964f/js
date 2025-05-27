<template>
  <div id="app">
    <header>
      <b-navbar toggleable="lg" type="dark" variant="dark">
        <b-navbar-brand to="/">Telegram收藏夹</b-navbar-brand>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item to="/" exact>首页</b-nav-item>
            <b-nav-item to="/favorites">收藏内容</b-nav-item>
            <b-nav-item to="/tags">标签管理</b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-form>
              <b-form-input size="sm" class="mr-sm-2" placeholder="搜索收藏..." v-model="searchQuery" @keyup.enter="onSearch"></b-form-input>
              <b-button size="sm" class="my-2 my-sm-0" type="submit" @click.prevent="onSearch">搜索</b-button>
            </b-nav-form>
            <b-nav-item-dropdown right v-if="isLoggedIn">
              <template #button-content>
                <em>{{ username }}</em>
              </template>
              <b-dropdown-item to="/settings">设置</b-dropdown-item>
              <b-dropdown-item @click="logout">退出登录</b-dropdown-item>
            </b-nav-item-dropdown>
            <b-nav-item v-else to="/login">登录</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </header>
    <main class="container mt-4">
      <router-view />
    </main>
    <footer class="footer mt-5 py-3 bg-light">
      <div class="container text-center">
        <span class="text-muted">Telegram收藏夹查看系统 &copy; {{ new Date().getFullYear() }}</span>
      </div>
    </footer>
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
    ...mapActions('auth', ['logout']),
    onSearch() {
      if (this.searchQuery.trim()) {
        this.$router.push({ 
          path: '/search', 
          query: { q: this.searchQuery } 
        });
        this.searchQuery = '';
      }
    }
  }
};
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

.footer {
  margin-top: auto;
}
</style>
