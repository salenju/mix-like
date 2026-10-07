<template>
  <div class="combination-generator">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>选择分类内容</span>
          <el-button type="success" @click="generateCombinations" :disabled="!canGenerate">
            <el-icon><Lightning /></el-icon>
            生成组合
          </el-button>
        </div>
      </template>

      <!-- 分类选择区 -->
      <div class="selection-area">
        <el-empty v-if="categories.length === 0" description="暂无分类，请先创建分类" />
        
        <el-row :gutter="20" v-else>
          <el-col :span="8" v-for="category in categories" :key="category.id">
            <el-card class="selection-card" shadow="hover">
              <template #header>
                <div class="selection-header">
                  <el-checkbox 
                    v-model="categoryEnabled[category.id]"
                    @change="toggleCategory(category)"
                  >
                    {{ category.name }}
                  </el-checkbox>
                  <el-tag size="small" type="info">
                    {{ getSelectedCount(category.id) }} / {{ category.items.length }}
                  </el-tag>
                </div>
              </template>
              
              <el-checkbox-group 
                v-model="selectedItems[category.id]"
                :disabled="!categoryEnabled[category.id]"
              >
                <el-checkbox 
                  v-for="item in category.items" 
                  :key="item" 
                  :label="item"
                  style="display: block; margin: 8px 0"
                >
                  {{ item }}
                </el-checkbox>
              </el-checkbox-group>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 组合结果 -->
    <el-card v-if="combinations.length > 0" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>组合结果 (共 {{ combinations.length }} 种)</span>
          <div>
            <el-button @click="exportCombinations">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="primary" @click="saveCombinations">
              <el-icon><Check /></el-icon>
              保存到历史
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="paginatedCombinations" stripe border max-height="400">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column 
          v-for="(selection, index) in currentSelections" 
          :key="index"
          :label="selection.categoryName"
          :prop="`col${index}`"
        >
          <template #default="{ row }">
            <el-tag>{{ row[index] }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="combinations.length > pageSize"
        style="margin-top: 20px; text-align: center"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="combinations.length"
        layout="prev, pager, next, total"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- 保存对话框 -->
    <el-dialog v-model="saveDialogVisible" title="保存组合" width="400px">
      <el-form>
        <el-form-item label="组合名称">
          <el-input v-model="combinationName" placeholder="请输入组合名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const API_BASE = 'http://localhost:3002/api'

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh'])

const categoryEnabled = ref({})
const selectedItems = ref({})
const combinations = ref([])
const currentSelections = ref([])
const saveDialogVisible = ref(false)
const combinationName = ref('')

const currentPage = ref(1)
const pageSize = ref(50)

// 监听分类变化，初始化选择状态
watch(() => props.categories, (newCategories) => {
  newCategories.forEach(category => {
    if (!(category.id in categoryEnabled.value)) {
      categoryEnabled.value[category.id] = false
    }
    if (!(category.id in selectedItems.value)) {
      selectedItems.value[category.id] = []
    }
  })
}, { immediate: true })

// 切换分类启用状态
const toggleCategory = (category) => {
  if (categoryEnabled.value[category.id]) {
    // 启用时默认全选
    selectedItems.value[category.id] = [...category.items]
  } else {
    // 禁用时清空选择
    selectedItems.value[category.id] = []
  }
}

// 获取已选数量
const getSelectedCount = (categoryId) => {
  return selectedItems.value[categoryId]?.length || 0
}

// 是否可以生成组合
const canGenerate = computed(() => {
  return Object.keys(categoryEnabled.value).some(id => 
    categoryEnabled.value[id] && selectedItems.value[id]?.length > 0
  )
})

// 分页后的组合
const paginatedCombinations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return combinations.value.slice(start, end)
})

// 生成组合
const generateCombinations = async () => {
  // 收集已选择的分类和内容
  const selections = []
  props.categories.forEach(category => {
    if (categoryEnabled.value[category.id] && selectedItems.value[category.id]?.length > 0) {
      selections.push({
        categoryId: category.id,
        categoryName: category.name,
        items: selectedItems.value[category.id]
      })
    }
  })

  if (selections.length === 0) {
    ElMessage.warning('请至少选择一个分类的内容')
    return
  }

  try {
    const response = await axios.post(`${API_BASE}/combinations/generate`, {
      selections,
      name: '' // 临时生成，名称为空
    })

    if (response.data.success) {
      combinations.value = response.data.data.combinations
      currentSelections.value = selections
      currentPage.value = 1
      ElMessage.success(`成功生成 ${combinations.value.length} 种组合`)
    }
  } catch (error) {
    ElMessage.error('生成组合失败')
  }
}

// 保存组合
const saveCombinations = () => {
  combinationName.value = `组合_${new Date().toLocaleString('zh-CN')}`
  saveDialogVisible.value = true
}

// 确认保存
const confirmSave = async () => {
  if (!combinationName.value.trim()) {
    ElMessage.warning('请输入组合名称')
    return
  }

  try {
    await axios.post(`${API_BASE}/combinations/generate`, {
      selections: currentSelections.value,
      name: combinationName.value
    })

    ElMessage.success('组合已保存到历史记录')
    saveDialogVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 导出组合
const exportCombinations = () => {
  if (combinations.value.length === 0) {
    ElMessage.warning('没有可导出的组合')
    return
  }

  // 生成CSV内容
  const headers = currentSelections.value.map(s => s.categoryName).join(',')
  const rows = combinations.value.map(combo => combo.join(',')).join('\n')
  const csv = headers + '\n' + rows

  // 下载文件
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `组合_${new Date().getTime()}.csv`
  link.click()

  ElMessage.success('导出成功')
}

// 分页切换
const handlePageChange = (page) => {
  currentPage.value = page
}
</script>

<style scoped>
.combination-generator {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-area {
  min-height: 200px;
}

.selection-card {
  margin-bottom: 20px;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
