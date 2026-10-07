<template>
  <div class="combination-generator">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>
            选择分类内容
            <span v-if="estimatedTotal > 0" class="estimate-hint" :class="{ 'is-over': exceedsLimit }">
              预计 {{ estimatedTotal.toLocaleString() }} 种组合
              <template v-if="exceedsLimit">（超出上限 {{ MAX_COMBINATIONS.toLocaleString() }}）</template>
            </span>
          </span>
          <el-button type="success" @click="generateCombinations" :disabled="!canGenerate || exceedsLimit">
            <el-icon><Lightning /></el-icon>
            生成组合
          </el-button>
        </div>
      </template>

      <!-- 分类选择区 -->
      <div class="selection-area">
        <el-empty v-if="categories.length === 0" description="暂无分类，请先创建分类" />

        <template v-else>
          <!-- 标签栏：选中标签后仅显示其下分类，并可批量勾选 -->
          <div class="tag-batch-bar" v-if="allTags.length > 0">
            <span class="tag-batch-label">
              按标签筛选
              <el-tooltip content="选中标签后只显示其下分类，可一键勾选全部分类" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
            <el-tag
              v-for="tag in allTags"
              :key="tag"
              class="filter-tag"
              type="info"
              effect="plain"
              :style="tagStyle(tag, activeTags.includes(tag))"
              @click="toggleFilterTag(tag)"
            >
              {{ tag }}
            </el-tag>
            <div class="tag-batch-actions">
              <el-button
                size="small"
                type="primary"
                :disabled="activeTags.length === 0 || filteredCategories.length === 0"
                @click="batchEnable()"
              >
                勾选标签下的全部分类
              </el-button>
            </div>
          </div>

          <!-- 筛选状态提示：过滤会隐藏其他分组的分类，需明确告知以免漏选 -->
          <el-alert
            v-if="activeTags.length > 0"
            type="info"
            :closable="false"
            class="filter-alert"
          >
            <template #title>
              仅显示含「{{ activeTags.join(' / ') }}」标签的 {{ filteredCategories.length }} 个分类，已隐藏 {{ hiddenCount }} 个
              <el-button link type="primary" size="small" @click="activeTags = []">退出筛选</el-button>
            </template>
          </el-alert>

          <el-empty
            v-if="filteredCategories.length === 0"
            description="没有匹配当前标签的分类"
          />

          <!-- 按主标签分组展示，不做折叠，便于跨标签组合 -->
          <div v-for="group in groupedCategories" :key="group.name" class="group-section">
            <div class="group-header">
              <span class="group-name">{{ group.name }}</span>
              <el-tag size="small" type="info" effect="plain">
                已启用 {{ group.enabledCount }} / {{ group.categories.length }}
              </el-tag>
            </div>

            <el-row :gutter="20">
              <el-col :span="8" v-for="category in group.categories" :key="category.id">
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

                  <div class="selection-tags" v-if="category.tags && category.tags.length > 0">
                    <el-tag
                      v-for="tag in category.tags"
                      :key="tag"
                      size="small"
                      type="info"
                      effect="plain"
                      :style="tagStyle(tag, activeTags.includes(tag))"
                      class="filter-tag"
                      @click.stop="toggleFilterTag(tag)"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>

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
        </template>
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
import { tagStyle } from '../utils/tagColor'

const API_BASE = 'http://localhost:3002/api'

// 单次生成允许的最大组合数，需与后端 server.js 的 MAX_COMBINATIONS 保持一致
const MAX_COMBINATIONS = 100000

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

// 当前选中的批量操作标签（多选，标签之间为「或」关系）
const activeTags = ref([])

// 全部标签，按其在数据中首次出现的顺序排列
const allTags = computed(() => {
  const tags = []
  for (const category of props.categories) {
    for (const tag of category.tags || []) {
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    }
  }
  return tags
})

// 按选中的标签过滤分类（命中任一标签即保留）
// 需求：选中标签后只展示其下分类
const filteredCategories = computed(() => {
  if (activeTags.value.length === 0) {
    return props.categories
  }
  return props.categories.filter(category =>
    (category.tags || []).some(tag => activeTags.value.includes(tag))
  )
})

// 被当前筛选隐藏的分类数，用于提示用户避免漏选
const hiddenCount = computed(() => props.categories.length - filteredCategories.value.length)

// 按主标签（首个标签）分组，顺序与筛选栏一致，未分组置底
// 统计各组已启用分类数，便于跨标签勾选时不漏看
const groupedCategories = computed(() => {
  const groups = [...allTags.value, '未分组'].map(name => ({
    name,
    categories: [],
    enabledCount: 0
  }))
  const groupMap = new Map(groups.map(group => [group.name, group]))

  for (const category of filteredCategories.value) {
    const key = (category.tags && category.tags[0]) || '未分组'
    const group = groupMap.get(key)
    if (!group) continue
    group.categories.push(category)
    if (categoryEnabled.value[category.id]) {
      group.enabledCount += 1
    }
  }

  return groups.filter(group => group.categories.length > 0)
})

// 取消某标签的勾选状态
// 该标签下的分类若同时属于其他仍选中的标签，则保留勾选，避免误清
const uncheckCategoriesByTag = removedTag => {
  const stillActive = activeTags.value
  let count = 0

  props.categories.forEach(category => {
    const tags = category.tags || []
    if (!tags.includes(removedTag)) return
    if (tags.some(tag => stillActive.includes(tag))) return
    if (!categoryEnabled.value[category.id]) return

    categoryEnabled.value[category.id] = false
    selectedItems.value[category.id] = []
    count += 1
  })

  if (count > 0) {
    ElMessage.info(`已取消勾选「${removedTag}」下的 ${count} 个分类`)
  }
}

// 切换标签选中状态
// 取消标签时同步撤销该标签带来的分类勾选
const toggleFilterTag = tag => {
  const index = activeTags.value.indexOf(tag)
  if (index === -1) {
    activeTags.value.push(tag)
  } else {
    activeTags.value.splice(index, 1)
    uncheckCategoriesByTag(tag)
  }
}

// 勾选当前筛选出的全部分类
const batchEnable = () => {
  const targets = filteredCategories.value

  if (targets.length === 0) {
    ElMessage.warning('当前选中的标签下没有分类')
    return
  }

  targets.forEach(category => {
    categoryEnabled.value[category.id] = true
    selectedItems.value[category.id] = [...category.items]
  })

  ElMessage.success(`已勾选 ${targets.length} 个分类`)
}

// 是否可以生成组合
const canGenerate = computed(() => {
  return Object.keys(categoryEnabled.value).some(id => 
    categoryEnabled.value[id] && selectedItems.value[id]?.length > 0
  )
})

// 预估当前勾选将产生的组合总数（各分类选中项数的乘积），未勾选任何分类时为 0
const estimatedTotal = computed(() => {
  let total = 0
  for (const category of props.categories) {
    if (!categoryEnabled.value[category.id]) continue
    const count = selectedItems.value[category.id]?.length || 0
    if (count > 0) {
      total = total === 0 ? count : total * count
    }
  }
  return total
})

// 是否已超出组合数上限
const exceedsLimit = computed(() => estimatedTotal.value > MAX_COMBINATIONS)

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

  // 组合数为各分类选中项数的乘积，可能指数级增长，超限直接拦截避免请求打挂后端
  const total = selections.reduce((acc, s) => acc * s.items.length, 1)
  if (total > MAX_COMBINATIONS) {
    ElMessage.warning(
      `组合数达 ${total.toLocaleString()} 条，超出上限 ${MAX_COMBINATIONS.toLocaleString()} 条，请减少勾选的分类或项数`
    )
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
    ElMessage.error(error.response?.data?.message || '生成组合失败')
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
    // 交由后端重算后落库，不信任前端传入的组合结果，保证数据一致性
    await axios.post(`${API_BASE}/combinations/save`, {
      selections: currentSelections.value,
      name: combinationName.value
    })

    ElMessage.success('组合已保存到历史记录')
    saveDialogVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
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

/* 标签批量操作栏 */
.tag-batch-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: #f7f8fa;
  border-radius: 4px;
}

.tag-batch-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
  margin-right: 4px;
}

.help-icon {
  color: #909399;
  cursor: help;
}

.tag-batch-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.filter-tag {
  cursor: pointer;
  user-select: none;
}

/* 分组 */
.group-section {
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
}

.group-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-left: 3px solid #409eff;
  padding-left: 8px;
}

.selection-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.filter-alert {
  margin-bottom: 12px;
}

.estimate-hint {
  margin-left: 12px;
  font-size: 13px;
  font-weight: normal;
  color: #909399;
}

.estimate-hint.is-over {
  color: #f56c6c;
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
