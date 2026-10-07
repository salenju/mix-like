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
async function writeJSON(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('写入文件错误:', error);
    return false;
  }
}

// ============ 分类管理 API ============

// 获取所有分类
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await readJSON(CATEGORIES_FILE);
    res.json({
      success: true,
      data: categories
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
        data: category
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
    const { name, items } = req.body;
    
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
    const { name, items } = req.body;
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

// 生成排列组合
app.post('/api/combinations/generate', async (req, res) => {
  try {
    const { selections, name } = req.body;
    
    if (!selections || selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择至少一个分类的内容'
      });
    }

    // 生成排列组合
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

    const itemArrays = selections.map(s => s.items);
    const combinations = generateCombinations(itemArrays);

    const result = {
      id: Date.now().toString(),
      name: name || `组合_${new Date().toLocaleString('zh-CN')}`,
      selections: selections,
      combinations: combinations,
      count: combinations.length,
      createdAt: new Date().toISOString()
    };

    // 保存到历史记录
    const history = await readJSON(COMBINATIONS_FILE);
    history.unshift(result);
    
    // 只保留最近100条记录
    if (history.length > 100) {
      history.splice(100);
    }
    
    await writeJSON(COMBINATIONS_FILE, history);

    res.json({
      success: true,
      message: '组合生成成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成组合失败',
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
