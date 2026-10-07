<template>
  <div class="history-viewer">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>历史记录 ({{ history.length }})</span>
          <el-button 
            type="danger" 
            @click="clearHistory"
            :disabled="history.length === 0"
          >
            <el-icon><Delete /></el-icon>
            清空历史
          </el-button>
        </div>
      </template>

      <el-empty v-if="history.length === 0" description="暂无历史记录" />

      <el-timeline v-else>
        <el-timeline-item 
          v-for="item in history" 
          :key="item.id"
          :timestamp="formatTime(item.createdAt)"
          placement="top"
        >
          <el-card shadow="hover">
            <div class="history-item">
              <div class="history-header">
                <h3>{{ item.name }}</h3>
                <div>
                  <el-button size="small" @click="viewDetail(item)">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                  <el-button size="small" @click="exportItem(item)">
                    <el-icon><Download /></el-icon>
                    导出
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteItem(item)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
              
              <div class="history-info">
                <el-tag type="success" style="margin-right: 10px">
                  {{ item.count }} 种组合
                </el-tag>
                <el-tag 
                  v-for="(selection, index) in item.selections" 
                  :key="index"
                  style="margin-right: 10px"
                >
                  {{ selection.categoryName }}: {{ selection.items.length }} 项
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="currentItem?.name"
      width="80%"
      top="5vh"
    >
      <div v-if="currentItem">
        <el-descriptions :column="2" border style="margin-bottom: 20px">
          <el-descriptions-item label="组合数量">
            {{ currentItem.count }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatTime(currentItem.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="选择的分类" :span="2">
            <el-tag 
              v-for="(selection, index) in currentItem.selections" 
              :key="index"
              style="margin-right: 10px"
            >
              {{ selection.categoryName }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-table 
          :data="paginatedDetailCombinations" 
          stripe 
          border 
          max-height="400"
        >
          <el-table-column type="index" label="序号" width="80" />
          <el-table-column 
            v-for="(selection, index) in currentItem.selections" 
            :key="index"
            :label="selection.categoryName"
          >
            <template #default="{ row }">
              <el-tag>{{ row[index] }}</el-tag>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="currentItem.combinations.length > detailPageSize"
          style="margin-top: 20px; text-align: center"
          :current-page="detailCurrentPage"
          :page-size="detailPageSize"
          :total="currentItem.combinations.length"
          layout="prev, pager, next, total"
          @current-change="handleDetailPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const API_BASE = 'http://localhost:3002/api'

const history = ref([])
const detailDialogVisible = ref(false)
const currentItem = ref(null)
const detailCurrentPage = ref(1)
const detailPageSize = ref(50)

// 分页后的详情组合
const paginatedDetailCombinations = computed(() => {
  if (!currentItem.value) return []
  const start = (detailCurrentPage.value - 1) * detailPageSize.value
  const end = start + detailPageSize.value
  return currentItem.value.combinations.slice(start, end)
})

// 加载历史记录
const loadHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE}/combinations`)
    if (response.data.success) {
      history.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('加载历史记录失败')
  }
}

// 查看详情
const viewDetail = (item) => {
  currentItem.value = item
  detailCurrentPage.value = 1
  detailDialogVisible.value = true
}

// 导出单个记录
const exportItem = (item) => {
  const headers = item.selections.map(s => s.categoryName).join(',')
  const rows = item.combinations.map(combo => combo.join(',')).join('\n')
  const csv = headers + '\n' + rows

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${item.name}.csv`
  link.click()

  ElMessage.success('导出成功')
}

// 删除记录
const deleteItem = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${item.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await axios.delete(`${API_BASE}/combinations/${item.id}`)
    ElMessage.success('删除成功')
    loadHistory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 清空历史
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复！',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await axios.delete(`${API_BASE}/combinations`)
    ElMessage.success('历史记录已清空')
    loadHistory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败')
    }
  }
}

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 详情分页切换
const handleDetailPageChange = (page) => {
  detailCurrentPage.value = page
}

onMounted(() => {
  loadHistory()
  
  // 监听刷新事件
  window.addEventListener('refreshHistory', loadHistory)
})
</script>

<style scoped>
.history-viewer {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-item {
  padding: 10px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.history-header h3 {
  margin: 0;
  font-size: 18px;
}

.history-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
