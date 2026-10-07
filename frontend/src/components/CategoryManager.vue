<template>
  <div class="category-manager">
    <!-- 操作栏 -->
    <el-row :gutter="20" style="margin-bottom: 16px">
      <el-col :span="24">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新建分类
        </el-button>
      </el-col>
    </el-row>

    <!-- 标签筛选栏 -->
    <div class="tag-filter-bar" v-if="allTags.length > 0">
      <span class="tag-filter-label">按标签筛选</span>
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
      <el-button v-if="activeTags.length > 0" link type="primary" @click="activeTags = []">
        清空筛选
      </el-button>
    </div>

    <!-- 按主标签分组的分类列表 -->
    <div v-if="categories.length === 0" class="empty-hint">
      <el-empty description="暂无分类，请先创建分类" />
    </div>

    <div v-else-if="filteredCategories.length === 0" class="empty-hint">
      <el-empty description="没有匹配当前标签筛选的分类" />
    </div>

    <div v-for="group in groupedCategories" :key="group.name" class="group-section">
      <div class="group-header">
        <span class="group-name">{{ group.name }}</span>
        <el-tag size="small" type="info" effect="plain">
          {{ group.categories.length }} 个分类
        </el-tag>
      </div>

      <el-row :gutter="20">
        <el-col :span="8" v-for="category in group.categories" :key="category.id">
          <el-card class="category-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="category-name">{{ category.name }}</span>
                <div>
                  <el-button size="small" text @click="editCategory(category)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button size="small" text type="danger" @click="deleteCategory(category)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 标签徽章 -->
            <div class="category-tags" v-if="category.tags && category.tags.length > 0">
              <el-tag
                v-for="tag in category.tags"
                :key="tag"
                size="small"
                class="category-tag"
                type="info"
                effect="plain"
                :style="tagStyle(tag, activeTags.includes(tag))"
                @click.stop="toggleFilterTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>

            <div class="category-content">
              <el-tag
                v-for="(item, index) in category.items"
                :key="index"
                style="margin: 5px"
                closable
                @close="removeItem(category, index)"
              >
                {{ item }}
              </el-tag>

              <el-input
                v-if="addingItem[category.id]"
                v-model="newItemValue[category.id]"
                size="small"
                style="width: 100px; margin: 5px"
                @keyup.enter="addItemToCategory(category)"
                @blur="cancelAddItem(category.id)"
                ref="itemInput"
              />

              <el-button v-else size="small" @click="startAddItem(category)" style="margin: 5px">
                <el-icon><Plus /></el-icon>
                添加项
              </el-button>
            </div>

            <div class="category-info">
              <el-text size="small" type="info">
                共 {{ category.items.length }} 项 | 创建于 {{ formatDate(category.createdAt) }}
              </el-text>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 新建/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新建分类' : '编辑分类'"
      width="520px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            :default-first-option="false"
            placeholder="选择已有标签，或直接输入新标签后回车"
            style="width: 100%"
          >
            <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
          <div class="form-tip">输入下拉中没有的标签后回车即可新增，新增后会自动出现在选项中；首个标签作为主标签，决定卡片归属的分组</div>
        </el-form-item>
        <el-form-item label="分类项">
          <div style="width: 100%">
            <el-tag
              v-for="(item, index) in formData.items"
              :key="index"
              closable
              @close="formData.items.splice(index, 1)"
              style="margin: 5px"
            >
              {{ item }}
            </el-tag>
            <el-input
              v-if="isAddingDialogItem"
              v-model="dialogNewItem"
              size="small"
              style="width: 120px; margin: 5px"
              @keyup.enter="addDialogItem"
              @blur="addDialogItem"
              ref="dialogItemInput"
            />
            <el-button v-else size="small" @click="startAddDialogItem" style="margin: 5px">
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import axios from 'axios';
  import { tagStyle } from '../utils/tagColor';

  const API_BASE = 'http://localhost:3002/api';

  const emit = defineEmits(['refresh']);

  const categories = ref([]);
  const dialogVisible = ref(false);
  const dialogMode = ref('add');
  const formData = reactive({
    id: '',
    name: '',
    tags: [],
    items: [],
  });

  const addingItem = ref({});
  const newItemValue = ref({});
  const itemInput = ref(null);

  const isAddingDialogItem = ref(false);
  const dialogNewItem = ref('');
  const dialogItemInput = ref(null);

  // 当前选中的筛选标签（多选，标签之间为「或」关系）
  const activeTags = ref([]);

  // 本次会话中新建但尚未保存到分类上的标签，
  // 使其能立即出现在弹窗的下拉选项中，无需先保存分类
  const customTags = ref([]);

  // 下拉可选标签 = 已有标签 + 本次新建标签
  const availableTags = computed(() => {
    const tags = [...allTags.value];
    for (const tag of customTags.value) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
    return tags;
  });

  // 监听用户输入的新标签，实时并入可选项
  watch(
    () => formData.tags,
    tags => {
      for (const tag of tags) {
        if (tag && !allTags.value.includes(tag) && !customTags.value.includes(tag)) {
          customTags.value.push(tag);
        }
      }
    },
    { deep: true }
  );

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      if (response.data.success) {
        categories.value = response.data.data;
      }
    } catch (error) {
      ElMessage.error('加载分类失败');
    }
  };

  // 全部标签，按其在数据中首次出现的顺序排列
  const allTags = computed(() => {
    const tags = [];
    for (const category of categories.value) {
      for (const tag of category.tags || []) {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }
    }
    return tags;
  });

  // 按选中的标签过滤分类（命中任一标签即保留）
  const filteredCategories = computed(() => {
    if (activeTags.value.length === 0) {
      return categories.value;
    }
    return categories.value.filter(category =>
      (category.tags || []).some(tag => activeTags.value.includes(tag))
    );
  });

  // 按主标签（首个标签）分组，顺序与筛选栏一致，未分组置底
  const groupedCategories = computed(() => {
    const groups = [...allTags.value, '未分组'].map(name => ({ name, categories: [] }));
    const groupMap = new Map(groups.map(group => [group.name, group]));

    for (const category of filteredCategories.value) {
      const key = (category.tags && category.tags[0]) || '未分组';
      if (groupMap.has(key)) {
        groupMap.get(key).categories.push(category);
      }
    }

    return groups.filter(group => group.categories.length > 0);
  });

  // 切换标签筛选状态
  const toggleFilterTag = tag => {
    const index = activeTags.value.indexOf(tag);
    if (index === -1) {
      activeTags.value.push(tag);
    } else {
      activeTags.value.splice(index, 1);
    }
  };

  // 显示新建对话框
  const showAddDialog = () => {
    dialogMode.value = 'add';
    formData.id = '';
    formData.name = '';
    formData.tags = [];
    formData.items = [];
    dialogVisible.value = true;
  };

  // 编辑分类
  const editCategory = category => {
    dialogMode.value = 'edit';
    formData.id = category.id;
    formData.name = category.name;
    formData.tags = [...(category.tags || [])];
    formData.items = [...category.items];
    dialogVisible.value = true;
  };

  // 保存分类
  const saveCategory = async () => {
    if (isAddingDialogItem.value) {
      addDialogItem();
    }

    if (!formData.name.trim()) {
      ElMessage.warning('请输入分类名称');
      return;
    }

    try {
      if (dialogMode.value === 'add') {
        await axios.post(`${API_BASE}/categories`, {
          name: formData.name,
          tags: formData.tags,
          items: formData.items,
        });
        ElMessage.success('分类创建成功');
      } else {
        await axios.put(`${API_BASE}/categories/${formData.id}`, {
          name: formData.name,
          tags: formData.tags,
          items: formData.items,
        });
        ElMessage.success('分类更新成功');
      }

      dialogVisible.value = false;
      customTags.value = [];
      loadCategories();
      emit('refresh');
    } catch (error) {
      ElMessage.error('保存失败');
    }
  };

  // 删除分类
  const deleteCategory = async category => {
    try {
      await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });

      await axios.delete(`${API_BASE}/categories/${category.id}`);
      ElMessage.success('分类删除成功');
      loadCategories();
      emit('refresh');
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  };

  // 开始添加项到分类
  const startAddItem = category => {
    addingItem.value[category.id] = true;
    newItemValue.value[category.id] = '';
    nextTick(() => {
      itemInput.value?.focus();
    });
  };

  // 添加项到分类
  const addItemToCategory = async category => {
    const value = newItemValue.value[category.id]?.trim();
    if (!value) {
      addingItem.value[category.id] = false;
      return;
    }

    try {
      const updatedItems = [...category.items, value];
      await axios.put(`${API_BASE}/categories/${category.id}`, {
        items: updatedItems,
      });

      addingItem.value[category.id] = false;
      newItemValue.value[category.id] = '';
      loadCategories();
      emit('refresh');
    } catch (error) {
      ElMessage.error('添加失败');
    }
  };

  // 取消添加项
  const cancelAddItem = categoryId => {
    setTimeout(() => {
      addingItem.value[categoryId] = false;
      newItemValue.value[categoryId] = '';
    }, 200);
  };

  // 删除项
  const removeItem = async (category, index) => {
    try {
      const updatedItems = category.items.filter((_, i) => i !== index);
      await axios.put(`${API_BASE}/categories/${category.id}`, {
        items: updatedItems,
      });
      loadCategories();
      emit('refresh');
    } catch (error) {
      ElMessage.error('删除失败');
    }
  };

  // 对话框中添加项
  const startAddDialogItem = () => {
    isAddingDialogItem.value = true;
    dialogNewItem.value = '';
    nextTick(() => {
      dialogItemInput.value?.focus();
    });
  };

  const addDialogItem = () => {
    const value = dialogNewItem.value.trim();
    if (value) {
      formData.items.push(value);
    }
    dialogNewItem.value = '';
    isAddingDialogItem.value = false;
  };

  // 格式化日期
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  onMounted(() => {
    loadCategories();
  });
</script>

<style scoped>
  .category-manager {
    padding: 20px;
  }

  /* 标签筛选栏 */
  .tag-filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    background-color: #f7f8fa;
    border-radius: 4px;
  }

  .tag-filter-label {
    font-size: 13px;
    color: #606266;
    margin-right: 4px;
  }

  .filter-tag,
  .category-tag {
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

  .empty-hint {
    padding: 40px 0;
  }

  /* 卡片 */
  .category-card {
    margin-bottom: 20px;
    min-height: 200px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .category-name {
    font-weight: bold;
    font-size: 16px;
  }

  .category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  .category-content {
    min-height: 100px;
    margin-bottom: 10px;
  }

  .category-info {
    padding-top: 10px;
    border-top: 1px solid #eee;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
    margin-top: 4px;
  }
</style>
