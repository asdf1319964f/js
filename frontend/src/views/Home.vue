<template>
  <div class="home-page text-center my-5">
    <h1 class="display-4">欢迎来到Telegram收藏夹</h1>
    <p class="lead">轻松管理和查看您在Telegram中收藏的所有内容。</p>
    <hr class="my-4">
    <p>点击导航栏开始浏览您的收藏，或前往设置管理您的Telegram账户。</p>
    <b-button v-if="!isLoggedIn" variant="primary" to="/login" class="me-2">立即登录</b-button>
    <b-button v-else variant="info" to="/favorites">查看我的收藏</b-button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Home',
  computed: {
    ...mapGetters('auth', ['isLoggedIn'])
  }
};
</script>

<style scoped>
.home-page {
  padding: 60px 0;
}
</style>