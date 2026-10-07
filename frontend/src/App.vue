<template>
  <div id="app">
    <el-container style="height: 100vh">
      <!-- 侧边栏 -->
      <el-aside width="200px" style="background-color: #545c64">
        <div class="logo">
          <h2>🎲 Mix-Like</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          @select="handleMenuSelect"
        >
          <el-menu-item index="categories">
            <el-icon><List /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="generator">
            <el-icon><Grid /></el-icon>
            <span>生成组合</span>
          </el-menu-item>
          <el-menu-item index="history">
            <el-icon><Clock /></el-icon>
            <span>历史记录</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header style="background-color: #fff; border-bottom: 1px solid #e6e6e6">
          <h1 style="margin: 0; line-height: 60px">{{ pageTitle }}</h1>
        </el-header>

        <el-main>
          <!-- 分类管理页面 -->
          <CategoryManager v-if="activeMenu === 'categories'" @refresh="loadCategories" />

          <!-- 生成组合页面 -->
          <CombinationGenerator v-if="activeMenu === 'generator'" :categories="categories" @refresh="loadHistory" />

          <!-- 历史记录页面 -->
          <HistoryViewer v-if="activeMenu === 'history'" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import CategoryManager from './components/CategoryManager.vue'
import CombinationGenerator from './components/CombinationGenerator.vue'
import HistoryViewer from './components/HistoryViewer.vue'

const API_BASE = 'http://localhost:3002/api'

const activeMenu = ref('categories')
const categories = ref([])

const pageTitle = computed(() => {
  const titles = {
    categories: '分类管理',
    generator: '生成组合',
    history: '历史记录'
  }
  return titles[activeMenu.value] || '排列组合工具'
})

const handleMenuSelect = (index) => {
  activeMenu.value = index
  if (index === 'generator') {
    loadCategories()
  }
}

const loadCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE}/categories`)
    if (response.data.success) {
      categories.value = response.data.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadHistory = () => {
  // 触发历史记录刷新
  if (activeMenu.value === 'history') {
    window.dispatchEvent(new Event('refreshHistory'))
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #434a50;
}

.logo h2 {
  margin: 0;
  font-size: 20px;
}

.el-menu-vertical {
  border-right: none;
}
</style>
