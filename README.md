# 小红书账号批量管理系统

一套基于Vue + Node.js的小红书账号批量管理系统，支持数据分析、内容创作和自动化发布。

## 项目结构

```
xiaohongshu-management-system/
├── backend/          # Node.js后端服务
├── frontend/         # Vue3前端项目
├── docs/            # 项目文档
└── README.md
```

## 核心功能

- 📊 **数据分析**: 热点追踪、竞品分析、用户画像
- 🤖 **内容创作**: AI生成文案、图片处理、视频编辑
- 📱 **账号管理**: 批量账号操作、代理管理、风控策略
- ⚡ **自动发布**: 定时发布、智能调度、异常处理
- 🎯 **运营面板**: 策略配置、效果监控、数据看板

## 技术栈

### 后端
- Node.js + Express + TypeScript
- MongoDB + Redis
- Bull队列 + Socket.io
- Playwright自动化

### 前端  
- Vue3 + TypeScript + Vite
- Element Plus UI
- Pinia状态管理
- ECharts数据可视化

## 快速开始

```bash
# 安装后端依赖
cd backend && npm install

# 安装前端依赖  
cd frontend && npm install

# 启动开发环境
npm run dev
```