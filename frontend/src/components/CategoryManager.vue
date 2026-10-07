<template>
  <div class="category-manager">
    <!-- 操作栏 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="24">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新建分类
        </el-button>
      </el-col>
    </el-row>

    <!-- 分类列表 -->
    <el-row :gutter="20">
      <el-col :span="8" v-for="category in categories" :key="category.id">
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

    <!-- 新建/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新建分类' : '编辑分类'"
      width="500px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
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
  import { ref, reactive, onMounted, nextTick } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import axios from 'axios';

  const API_BASE = 'http://localhost:3002/api';

  const emit = defineEmits(['refresh']);

  const categories = ref([]);
  const dialogVisible = ref(false);
  const dialogMode = ref('add');
  const formData = reactive({
    id: '',
    name: '',
    items: [],
  });

  const addingItem = ref({});
  const newItemValue = ref({});
  const itemInput = ref(null);

  const isAddingDialogItem = ref(false);
  const dialogNewItem = ref('');
  const dialogItemInput = ref(null);

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

  // 显示新建对话框
  const showAddDialog = () => {
    dialogMode.value = 'add';
    formData.id = '';
    formData.name = '';
    formData.items = [];
    dialogVisible.value = true;
  };

  // 编辑分类
  const editCategory = category => {
    dialogMode.value = 'edit';
    formData.id = category.id;
    formData.name = category.name;
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
          items: formData.items,
        });
        ElMessage.success('分类创建成功');
      } else {
        await axios.put(`${API_BASE}/categories/${formData.id}`, {
          name: formData.name,
          items: formData.items,
        });
        ElMessage.success('分类更新成功');
      }

      dialogVisible.value = false;
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

  .category-content {
    min-height: 100px;
    margin-bottom: 10px;
  }

  .category-info {
    padding-top: 10px;
    border-top: 1px solid #eee;
  }
</style>
