<template>
  <div class="not-found-page text-center">
    <div class="error-container">
      <h1 class="display-1">404</h1>
      <h2 class="mb-4">页面未找到</h2>
      <p class="lead mb-4">您访问的页面不存在或已被移除。</p>
      <router-link to="/" class="btn btn-primary btn-lg">
        <i class="bi bi-house-door me-2"></i> 返回首页
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
};
</script>

<style scoped>
.not-found-page {
  padding: 100px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.error-container {
  max-width: 500px;
}

h1 {
  font-size: 6rem;
  color: #dc3545;
}
</style>
