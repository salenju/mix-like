const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3002;

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const COMBINATIONS_FILE = path.join(DATA_DIR, 'combinations.json');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 确保数据目录和文件存在
async function ensureDataFiles() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(CATEGORIES_FILE);
  } catch {
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(COMBINATIONS_FILE);
  } catch {
    await fs.writeFile(COMBINATIONS_FILE, JSON.stringify([], null, 2));
  }
}

// 读取JSON文件
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取文件错误:', error);
    return [];
  }
}

// 写入JSON文件
// 先写临时文件再 rename，保证原子性——避免写入过程中进程崩溃/并发请求
// 截断原文件，导致数据全部损坏
async function writeJSON(filePath, data) {
  const tmpFile = `${filePath}.tmp`;
  try {
    await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpFile, filePath);
    return true;
  } catch (error) {
    await fs.unlink(tmpFile).catch(() => {});
    console.error('写入文件错误:', error);
    return false;
  }
}

// ============ 分类管理 API ============

// 规范化 tags 字段：统一为去空、去重后的字符串数组
// 首个元素视为主 tag，用于前端分组显示
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map(t => String(t).trim()).filter(Boolean))];
}

// 给分类补齐 tags 字段，兼容未含该字段的历史数据
function withTags(category) {
  return { ...category, tags: normalizeTags(category.tags) };
}

// 获取所有分类
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await readJSON(CATEGORIES_FILE);
    res.json({
      success: true,
      data: categories.map(withTags)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类失败',
      error: error.message
    });
  }
});

// 获取单个分类
app.get('/api/categories/:id', async (req, res) => {
  try {
    const categories = await readJSON(CATEGORIES_FILE);
    const category = categories.find(c => c.id === req.params.id);
    
    if (category) {
      res.json({
        success: true,
        data: withTags(category)
      });
    } else {
      res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类失败',
      error: error.message
    });
  }
});

// 创建分类
app.post('/api/categories', async (req, res) => {
  try {
    const { name, items, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    const categories = await readJSON(CATEGORIES_FILE);
    
    const newCategory = {
      id: Date.now().toString(),
      name,
      tags: normalizeTags(tags),
      items: items || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    categories.push(newCategory);
    await writeJSON(CATEGORIES_FILE, categories);

    res.json({
      success: true,
      message: '分类创建成功',
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建分类失败',
      error: error.message
    });
  }
});

// 更新分类
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, items, tags } = req.body;
    const categories = await readJSON(CATEGORIES_FILE);
    const index = categories.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    categories[index] = {
      ...categories[index],
      name: name !== undefined ? name : categories[index].name,
      tags: tags !== undefined ? normalizeTags(tags) : normalizeTags(categories[index].tags),
      items: items !== undefined ? items : categories[index].items,
      updatedAt: new Date().toISOString()
    };

    await writeJSON(CATEGORIES_FILE, categories);

    res.json({
      success: true,
      message: '分类更新成功',
      data: categories[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新分类失败',
      error: error.message
    });
  }
});

// 删除分类
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const categories = await readJSON(CATEGORIES_FILE);
    const index = categories.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    categories.splice(index, 1);
    await writeJSON(CATEGORIES_FILE, categories);

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除分类失败',
      error: error.message
    });
  }
});

// ============ 排列组合 API ============

// 单次生成允许的最大组合数，超出则直接拒绝，防止内存耗尽导致进程崩溃
const MAX_COMBINATIONS = 100000;
// 组合历史最多保留的记录数
const MAX_HISTORY = 100;

// 估算组合总数：各分类选中项数的乘积
function countCombinations(selections) {
  return selections.reduce((total, s) => total * (s.items?.length || 0), 1);
}

// 校验 selections，合法返回 null，否则返回错误信息
function validateSelections(selections) {
  if (!Array.isArray(selections) || selections.length === 0) {
    return '请选择至少一个分类的内容';
  }

  for (const s of selections) {
    if (!Array.isArray(s.items) || s.items.length === 0) {
      return `分类「${s.categoryName || s.categoryId}」没有选中任何项`;
    }
  }

  const total = countCombinations(selections);
  if (total > MAX_COMBINATIONS) {
    return `组合数达 ${total.toLocaleString()} 条，超出上限 ${MAX_COMBINATIONS.toLocaleString()} 条，请减少勾选的分类或项数`;
  }

  return null;
}

// 笛卡尔积
function generateCombinations(arrays) {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map(item => [item]);

  const [first, ...rest] = arrays;
  const restCombinations = generateCombinations(rest);

  const result = [];
  for (const item of first) {
    for (const combination of restCombinations) {
      result.push([item, ...combination]);
    }
  }
  return result;
}

// 构造组合结果对象
function buildResult(selections, name) {
  const combinations = generateCombinations(selections.map(s => s.items));

  return {
    id: Date.now().toString(),
    name: name,
    selections: selections,
    combinations: combinations,
    count: combinations.length,
    createdAt: new Date().toISOString()
  };
}

// 生成排列组合（仅计算，不写入历史记录）
app.post('/api/combinations/generate', async (req, res) => {
  const { selections } = req.body;

  const error = validateSelections(selections);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }

  try {
    const result = buildResult(selections, '');
    res.json({
      success: true,
      message: '组合生成成功',
      data: result
    });
  } catch (error) {
    console.error('生成组合错误:', error);
    res.status(500).json({
      success: false,
      message: '生成组合失败',
      error: error.message
    });
  }
});

// 保存排列组合到历史记录
app.post('/api/combinations/save', async (req, res) => {
  const { selections, name } = req.body;

  const error = validateSelections(selections);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }

  if (!name || !String(name).trim()) {
    return res.status(400).json({
      success: false,
      message: '请输入组合名称'
    });
  }

  try {
    const result = buildResult(selections, String(name).trim());

    // 保存到历史记录
    const history = await readJSON(COMBINATIONS_FILE);
    history.unshift(result);

    // 只保留最近 MAX_HISTORY 条记录
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY);
    }

    const written = await writeJSON(COMBINATIONS_FILE, history);
    if (!written) {
      return res.status(500).json({
        success: false,
        message: '保存失败，请重试'
      });
    }

    res.json({
      success: true,
      message: '组合已保存到历史记录',
      data: result
    });
  } catch (error) {
    console.error('保存组合错误:', error);
    res.status(500).json({
      success: false,
      message: '保存组合失败',
      error: error.message
    });
  }
});

// 获取组合历史
app.get('/api/combinations', async (req, res) => {
  try {
    const combinations = await readJSON(COMBINATIONS_FILE);
    res.json({
      success: true,
      data: combinations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取组合历史失败',
      error: error.message
    });
  }
});

// 获取单个组合
app.get('/api/combinations/:id', async (req, res) => {
  try {
    const combinations = await readJSON(COMBINATIONS_FILE);
    const combination = combinations.find(c => c.id === req.params.id);
    
    if (combination) {
      res.json({
        success: true,
        data: combination
      });
    } else {
      res.status(404).json({
        success: false,
        message: '组合不存在'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取组合失败',
      error: error.message
    });
  }
});

// 删除组合记录
app.delete('/api/combinations/:id', async (req, res) => {
  try {
    const combinations = await readJSON(COMBINATIONS_FILE);
    const index = combinations.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '组合不存在'
      });
    }

    combinations.splice(index, 1);
    await writeJSON(COMBINATIONS_FILE, combinations);

    res.json({
      success: true,
      message: '组合删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除组合失败',
      error: error.message
    });
  }
});

// 清空组合历史
app.delete('/api/combinations', async (req, res) => {
  try {
    await writeJSON(COMBINATIONS_FILE, []);
    res.json({
      success: true,
      message: '组合历史已清空'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清空失败',
      error: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mix-Like API Server is running',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  await ensureDataFiles();
  app.listen(PORT, () => {
    console.log(`🚀 Mix-Like Server 运行在 http://localhost:${PORT}`);
    console.log(`📁 数据目录: ${DATA_DIR}`);
    console.log(`📝 分类文件: ${CATEGORIES_FILE}`);
    console.log(`📊 组合文件: ${COMBINATIONS_FILE}`);
  });
}

startServer();
