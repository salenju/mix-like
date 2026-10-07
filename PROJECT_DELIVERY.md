# 🎲 Mix-Like 排列组合工具 - 项目交付说明

## ✅ 已完成功能

### 1. 分类管理 ✨
- ✅ 创建、编辑、删除分类
- ✅ 为分类添加/删除项目
- ✅ 实时保存到本地JSON文件
- ✅ 美观的卡片式展示

### 2. 排列组合生成 🔮
- ✅ 从多个分类中选择内容
- ✅ 灵活选择每个分类的具体项
- ✅ 自动计算所有可能的排列组合
- ✅ 实时显示组合数量

### 3. 数据管理 💾
- ✅ 分类数据存储在本地JSON
- ✅ 组合历史记录存储在本地JSON
- ✅ 支持导出为CSV格式
- ✅ 历史记录时间线展示

### 4. 用户界面 🎨
- ✅ 基于Element Plus的现代化UI
- ✅ 响应式设计
- ✅ 分页显示大量数据
- ✅ 友好的交互提示

## 📁 项目结构

```
mix-like/
├── backend/                         # 后端服务
│   ├── server.js                   # Express API服务器
│   ├── package.json                # 后端依赖配置
│   └── data/                       # 数据存储目录
│       ├── categories.json         # 分类数据（含示例）
│       └── combinations.json       # 组合历史
│
├── frontend/                        # 前端应用
│   ├── src/
│   │   ├── App.vue                 # 主应用
│   │   ├── main.js                 # 入口文件
│   │   └── components/
│   │       ├── CategoryManager.vue      # 分类管理组件
│   │       ├── CombinationGenerator.vue # 组合生成组件
│   │       └── HistoryViewer.vue        # 历史记录组件
│   ├── index.html                  # HTML入口
│   ├── package.json                # 前端依赖配置
│   └── vite.config.js              # Vite配置
│
├── start.sh                         # Linux/Mac启动脚本
├── start.bat                        # Windows启动脚本
├── README.md                        # 完整文档
├── QUICK_START.md                   # 快速开始
├── EXAMPLES.md                      # 使用示例
└── .gitignore                       # Git忽略配置
```

## 🚀 快速启动（三步搞定）

### 方法一：使用启动脚本（推荐）

**Windows系统**：
双击 `start.bat` 文件

**Mac/Linux系统**：
```bash
cd mix-like
./start.sh
```

### 方法二：手动启动

**步骤1：启动后端**
```bash
cd mix-like/backend
npm install      # 首次运行需要安装依赖
npm start
```
后端将运行在 http://localhost:3002

**步骤2：启动前端**（新开一个终端）
```bash
cd mix-like/frontend
npm install      # 首次运行需要安装依赖
npm run dev
```
前端将运行在 http://localhost:5174 并自动打开浏览器

## 🎯 使用流程

### 第一步：创建分类
1. 打开应用，默认进入"分类管理"页面
2. 点击"新建分类"按钮
3. 输入分类名称（如：颜色、尺码）
4. 添加分类项（如：红色、蓝色、绿色）
5. 点击"保存"

**提示**：已经预置了3个示例分类，可以直接使用！

### 第二步：生成组合
1. 切换到"生成组合"标签
2. 勾选要参与组合的分类
3. 选择每个分类中的具体项（默认全选）
4. 点击"生成组合"按钮
5. 查看生成的所有排列组合

### 第三步：保存和导出
1. 点击"保存到历史"为组合命名并保存
2. 点击"导出"将组合导出为CSV文件
3. 在"历史记录"中查看所有保存的组合

## 💡 实际应用场景

### 1. 电商产品SKU管理
- 分类：款式、颜色、尺码
- 生成所有商品规格组合
- 导出为库存表

### 2. 服装搭配方案
- 分类：上衣、裤子、鞋子
- 生成穿搭组合建议
- 用于搭配推荐系统

### 3. 餐饮套餐设计
- 分类：主食、主菜、饮料
- 生成所有套餐组合
- 制作套餐菜单

### 4. 软件测试用例
- 分类：浏览器、操作系统、分辨率
- 生成测试场景矩阵
- 分配测试任务

### 5. 营销策略规划
- 分类：优惠类型、目标用户、商品类别
- 生成营销方案组合
- 评估不同策略

## 🛠️ 技术栈

**后端**：
- Node.js + Express
- 本地JSON文件存储
- RESTful API设计

**前端**：
- Vue 3 (Composition API)
- Element Plus (UI组件库)
- Vite (构建工具)
- Axios (HTTP请求)

## 📊 API接口列表

### 分类管理
- `GET /api/categories` - 获取所有分类
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 组合管理
- `POST /api/combinations/generate` - 生成组合
- `GET /api/combinations` - 获取历史记录
- `DELETE /api/combinations/:id` - 删除记录

## ⚠️ 注意事项

1. **组合数量控制**
   - 组合数 = 各分类选中项数的乘积
   - 建议控制在1000种以内
   - 例：5个分类×每个10项 = 100,000种组合（较大）

2. **端口占用**
   - 后端使用 3002 端口
   - 前端使用 5174 端口
   - 如有冲突可在配置文件中修改

3. **数据备份**
   - 数据保存在 `backend/data/` 目录
   - 建议定期备份该目录
   - 可以手动编辑JSON文件

4. **浏览器兼容**
   - 推荐使用Chrome、Edge、Firefox最新版
   - 需要启用JavaScript

## 📚 文档说明

- **README.md** - 完整的项目文档，包含详细说明
- **QUICK_START.md** - 快速开始指南
- **EXAMPLES.md** - 5个实际使用场景示例
- **本文档** - 项目交付说明

## 🎉 开始使用

现在你可以：
1. 运行启动脚本 `start.sh` 或 `start.bat`
2. 或者按照"快速启动"手动启动服务
3. 打开浏览器访问 http://localhost:5174
4. 开始创建分类和生成组合！

## 🐛 问题反馈

如遇到问题，请检查：
1. Node.js 版本是否 >= 14
2. 端口是否被占用
3. 依赖是否正确安装（npm install）
4. 查看控制台错误信息

## 📄 许可证

MIT License - 自由使用和修改

---

**祝你使用愉快！🎊**

如有问题或改进建议，欢迎反馈！
