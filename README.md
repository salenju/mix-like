# Mix-Like 排列组合工具 🎲

一个基于 Node.js + Vue3 + Element-plus 的排列组合生成工具，支持分类管理和组合结果的存储与导出。

## 功能特性 ✨

### 核心功能
- ✅ **分类管理**: 支持分类的增删改查
- ✅ **本地存储**: 分类和组合数据存储在本地JSON文件中
- ✅ **灵活选择**: 从不同分类中选择内容进行组合
- ✅ **排列组合**: 自动生成所有可能的排列组合
- ✅ **历史记录**: 保存和查看历史组合记录
- ✅ **数据导出**: 支持导出为CSV格式

### 界面功能
- 🎨 现代化的UI设计
- 📱 响应式布局
- 🔍 分页显示大量数据
- 💾 实时数据同步

## 技术栈 🛠️

**后端**:
- Node.js
- Express
- CORS
- 本地JSON文件存储

**前端**:
- Vue 3 (Composition API)
- Element Plus (UI组件库)
- Axios (HTTP客户端)
- Vite (构建工具)

## 项目结构 📁

```
mix-like/
├── backend/                 # 后端服务
│   ├── server.js           # Express服务器
│   ├── data/               # 数据存储目录
│   │   ├── categories.json # 分类数据
│   │   └── combinations.json # 组合历史
│   └── package.json
│
└── frontend/               # 前端应用
    ├── src/
    │   ├── App.vue        # 主应用组件
    │   ├── main.js        # 入口文件
    │   └── components/    # 组件目录
    │       ├── CategoryManager.vue      # 分类管理
    │       ├── CombinationGenerator.vue # 生成组合
    │       └── HistoryViewer.vue        # 历史记录
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始 🚀

### 1. 安装依赖

```bash
# 安装后端依赖
cd mix-like/backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 启动后端服务

```bash
cd mix-like/backend
npm start
```

后端服务将运行在 `http://localhost:3002`

### 3. 启动前端服务

```bash
cd mix-like/frontend
npm run dev
```

前端应用将运行在 `http://localhost:5174` 并自动打开浏览器

## 使用指南 📖

### 分类管理

1. **创建分类**
   - 点击"新建分类"按钮
   - 输入分类名称
   - 添加分类项（可多个）
   - 点击"保存"

2. **编辑分类**
   - 点击分类卡片右上角的编辑图标
   - 修改分类名称或添加/删除项
   - 点击"保存"

3. **快速添加项**
   - 在分类卡片中点击"添加项"按钮
   - 输入内容后按回车确认

4. **删除分类**
   - 点击分类卡片右上角的删除图标
   - 确认删除操作

### 生成组合

1. **选择内容**
   - 勾选要参与组合的分类
   - 选择分类中的具体项（默认全选）
   - 可以从多个分类中选择

2. **生成组合**
   - 点击"生成组合"按钮
   - 系统自动计算所有可能的排列组合
   - 结果会显示在下方表格中

3. **查看结果**
   - 支持分页浏览大量组合
   - 每页显示50条记录

4. **保存组合**
   - 点击"保存到历史"按钮
   - 输入组合名称
   - 点击"确定"保存

5. **导出组合**
   - 点击"导出"按钮
   - 组合结果将导出为CSV文件

### 历史记录

1. **查看历史**
   - 切换到"历史记录"标签
   - 以时间线形式展示所有历史记录

2. **查看详情**
   - 点击"查看"按钮
   - 在弹窗中查看完整的组合结果

3. **导出历史**
   - 点击单条记录的"导出"按钮
   - 导出为CSV文件

4. **删除记录**
   - 点击"删除"按钮删除单条记录
   - 点击"清空历史"删除所有记录

## API 接口 🔌

### 分类管理

- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 组合管理

- `POST /api/combinations/generate` - 生成组合
- `GET /api/combinations` - 获取组合历史
- `GET /api/combinations/:id` - 获取单个组合
- `DELETE /api/combinations/:id` - 删除组合记录
- `DELETE /api/combinations` - 清空组合历史

### 健康检查

- `GET /health` - 服务健康检查

## 数据格式 📊

### 分类数据格式 (categories.json)

```json
[
  {
    "id": "1234567890",
    "name": "颜色",
    "items": ["红色", "蓝色", "绿色"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 组合数据格式 (combinations.json)

```json
[
  {
    "id": "1234567890",
    "name": "示例组合",
    "selections": [
      {
        "categoryId": "xxx",
        "categoryName": "颜色",
        "items": ["红色", "蓝色"]
      }
    ],
    "combinations": [
      ["红色", "大"],
      ["蓝色", "大"]
    ],
    "count": 2,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## 开发模式 🔧

### 后端开发

使用 nodemon 自动重启：

```bash
cd mix-like/backend
npm run dev
```

### 前端开发

Vite 提供热模块替换(HMR)：

```bash
cd mix-like/frontend
npm run dev
```

## 生产部署 🚀

### 构建前端

```bash
cd mix-like/frontend
npm run build
```

构建产物位于 `frontend/dist` 目录

### 使用 PM2 部署后端

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd mix-like/backend
pm2 start server.js --name mix-like-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs mix-like-backend
```

## 示例场景 💡

### 场景1: 服装搭配

创建分类：
- 上衣: T恤, 衬衫, 毛衣
- 裤子: 牛仔裤, 休闲裤, 短裤
- 鞋子: 运动鞋, 皮鞋, 帆布鞋

生成组合可以得到 3×3×3 = 27 种不同的搭配方案

### 场景2: 餐饮套餐

创建分类：
- 主食: 米饭, 面条, 炒饭
- 主菜: 宫保鸡丁, 鱼香肉丝, 麻婆豆腐
- 饮料: 可乐, 雪碧, 果汁

生成组合可以得到 3×3×3 = 27 种不同的套餐组合

### 场景3: 测试用例

创建分类：
- 浏览器: Chrome, Firefox, Safari
- 操作系统: Windows, macOS, Linux
- 分辨率: 1920×1080, 1366×768

生成所有测试场景的排列组合

## 注意事项 ⚠️

1. **组合数量**: 组合数量 = 各分类选中项数量的乘积，选择过多项可能导致组合数量巨大
2. **性能考虑**: 当组合数量超过1000时，建议使用分页查看
3. **数据备份**: 定期备份 `backend/data` 目录下的JSON文件
4. **端口占用**: 确保 3002 和 5174 端口未被占用

## 故障排查 🔍

### 后端服务无法启动

1. 检查端口 3002 是否被占用
2. 确认 Node.js 版本 >= 14
3. 重新安装依赖: `npm install`

### 前端无法连接后端

1. 确认后端服务已启动
2. 检查浏览器控制台是否有CORS错误
3. 确认API地址配置正确（http://localhost:3002）

### 数据文件丢失

后端启动时会自动创建 `data` 目录和初始JSON文件

## 更新日志 📝

### v1.0.0 (2024-01-01)
- ✨ 首次发布
- ✅ 分类管理功能
- ✅ 排列组合生成
- ✅ 历史记录查看
- ✅ 数据导出功能

## 许可证 📄

MIT License

## 作者 👨‍💻

DHcoder Assistant

---

**享受排列组合的乐趣！** 🎉
