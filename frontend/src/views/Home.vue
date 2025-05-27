<template>
  <div class="home-page">
    <div class="jumbotron bg-light p-5 rounded-3 mb-4">
      <h1 class="display-4">欢迎使用Telegram收藏夹</h1>
      <p class="lead">轻松管理和查看您在Telegram中收藏的内容</p>
      <hr class="my-4">
      <p>使用标签过滤、搜索功能，以相册形式查看图片，观看带缩略图的视频，自动分类整理您的收藏内容。</p>
      <div v-if="!isLoggedIn">
        <router-link to="/login" class="btn btn-primary btn-lg">
          立即登录
        </router-link>
      </div>
      <div v-else>
        <router-link to="/favorites" class="btn btn-primary btn-lg">
          查看我的收藏
        </router-link>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">标签过滤</h5>
            <p class="card-text">使用标签快速过滤和组织您的收藏内容，让信息管理更加高效。</p>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">图片相册</h5>
            <p class="card-text">以相册形式浏览您收藏的图片，支持缩略图预览和全屏查看。</p>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">视频缩略图</h5>
            <p class="card-text">为收藏的视频自动生成缩略图，方便快速识别和预览。</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">强大搜索</h5>
            <p class="card-text">全文搜索您的收藏内容，快速找到需要的信息。</p>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">自动分类</h5>
            <p class="card-text">系统自动对您的收藏内容进行分类，让内容组织更加清晰。</p>
          </div>
        </div>
      </div>
    </div>
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
  padding-bottom: 30px;
}
</style>
