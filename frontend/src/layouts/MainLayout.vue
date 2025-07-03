<template>
  <div class="main-layout">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="header-left">
        <h1>小红书账号批量管理系统</h1>
      </div>
      <div class="header-right">
        <el-dropdown>
          <span class="user-dropdown">
            <el-avatar :size="32" :src="userAvatar" />
            <span class="username">管理员</span>
            <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人设置</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="main-container">
      <!-- 侧边栏 -->
      <div class="sidebar">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/accounts" @click="() => handleMenuClick('/accounts')">
            <el-icon><user /></el-icon>
            <span>账号管理</span>
          </el-menu-item>
          <el-menu-item index="/devices" @click="() => handleMenuClick('/devices')">
            <el-icon><monitor /></el-icon>
            <span>设备管理</span>
          </el-menu-item>
          <el-menu-item index="/personas" @click="() => handleMenuClick('/personas')">
            <el-icon><avatar /></el-icon>
            <span>人设管理</span>
          </el-menu-item>
          <el-menu-item index="/tasks" @click="() => handleMenuClick('/tasks')">
            <el-icon><timer /></el-icon>
            <span>任务中心</span>
          </el-menu-item>
          <el-menu-item index="/analytics" @click="() => handleMenuClick('/analytics')">
            <el-icon><data-analysis /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容 -->
      <div class="content">
        <router-view :key="$route.fullPath" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ArrowDown, 
  User, 
  Monitor, 
  Timer, 
  DataAnalysis,
  Avatar
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const activeMenu = ref(route.path)
const userAvatar = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')

// 监听路由变化，更新活跃菜单
watch(() => route.path, (newPath, oldPath) => {
  console.log('路由变化:', oldPath, '->', newPath)
  activeMenu.value = newPath
  // 强制触发页面重新渲染
  console.log('页面应该重新渲染了')
}, { immediate: true })

const handleMenuSelect = (index: string) => {
  console.log('菜单选择:', index, '当前路径:', route.path)
  activeMenu.value = index
  console.log('导航到:', index)
  router.push(index).catch(err => {
    console.error('路由跳转失败:', err)
  })
}

const handleMenuClick = (path: string) => {
  console.log('菜单点击:', path)
  activeMenu.value = path
  router.push(path).then(() => {
    console.log('路由跳转成功到:', path)
  }).catch(err => {
    console.error('路由跳转失败:', err)
  })
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.header-left h1 {
  color: #303133;
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.main-container {
  display: flex;
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  width: 100%;
  box-sizing: border-box;
}

.sidebar {
  width: 180px;
  background: white;
  box-shadow: 1px 0 2px rgba(0,0,0,0.1);
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  overflow-y: auto;
}

.menu {
  border: none;
  height: 100%;
}

.content {
  flex: 1;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
  overflow-y: auto;
  box-sizing: border-box;
  margin-left: 180px;
  padding: 20px 20px 20px 5px;
}

/* 菜单项样式 */
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 2px;
  border-radius: 6px;
}

:deep(.el-menu-item:hover) {
  background-color: #ecf5ff !important;
  color: #409eff;
}

:deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: white;
}

:deep(.el-menu-item.is-active .el-icon) {
  color: white;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 8px;
  font-size: 16px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .sidebar {
    width: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .content {
    margin-left: 0;
    padding: 10px;
  }
  
  .header-left h1 {
    font-size: 16px;
  }
}
</style>