<template>
  <div class="tasks-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>任务中心</h1>
        <p>管理自动化任务，监控执行状态</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><plus /></el-icon>
          创建任务
        </el-button>
        <el-button @click="loadTasks">
          <el-icon><refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 任务分类Tab -->
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="创作任务" name="create">
          <template #label>
            <span class="tab-label">
              <el-icon><edit /></el-icon>
              创作任务
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="发布任务" name="publish">
          <template #label>
            <span class="tab-label">
              <el-icon><upload /></el-icon>
              发布任务
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="装修任务" name="decoration">
          <template #label>
            <span class="tab-label">
              <el-icon><picture /></el-icon>
              装修任务
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="等待中" value="pending" />
            <el-option label="运行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="已暂停" value="paused" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input 
            v-model="filterForm.search" 
            placeholder="任务名称"
            @keyup.enter="loadTasks"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTasks">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="table-card">
      <el-table :data="tasks" v-loading="loading" style="width: 100%">
        <el-table-column label="任务信息" min-width="250">
          <template #default="{ row }">
            <div class="task-info">
              <div class="task-name">{{ row.name }}</div>
              <div class="task-desc">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTaskTypeColor(row.type)">
              {{ getTaskTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <div class="progress-info">
              <el-progress 
                :percentage="row.progress.percentage" 
                :status="getProgressStatus(row.status)"
                :stroke-width="6"
              />
              <div class="progress-text">{{ row.progress.message }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="执行时间" width="200">
          <template #default="{ row }">
            <div class="time-info">
              <div v-if="row.startTime">开始: {{ formatTime(row.startTime) }}</div>
              <div v-if="row.endTime">结束: {{ formatTime(row.endTime) }}</div>
              <div v-if="row.duration">耗时: {{ formatDuration(row.duration) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              size="small" 
              @click="viewTask(row)"
            >
              详情
            </el-button>
            <el-button 
              link 
              size="small" 
              v-if="row.status === 'pending'"
              @click="startTask(row)"
            >
              启动
            </el-button>
            <el-button 
              link 
              size="small" 
              v-if="row.status === 'running'"
              @click="pauseTask(row)"
            >
              暂停
            </el-button>
            <el-button 
              link 
              size="small" 
              v-if="row.status === 'paused'"
              @click="resumeTask(row)"
            >
              继续
            </el-button>
            <el-button 
              link 
              size="small" 
              v-if="row.status === 'failed'"
              @click="retryTask(row)"
            >
              重试
            </el-button>
            <el-button 
              link 
              size="small" 
              type="danger"
              @click="deleteTask(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadTasks"
          @current-change="loadTasks"
        />
      </div>
    </el-card>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建任务" width="600px">
      <el-form :model="taskForm" :rules="taskRules" ref="taskFormRef" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="taskForm.type" placeholder="选择任务类型" @change="onTaskTypeChange">
            <el-option label="创作任务" value="create" />
            <el-option label="发布任务" value="publish" />
            <el-option label="装修任务" value="decoration" />
          </el-select>
        </el-form-item>
        
        <!-- 创作任务配置 -->
        <template v-if="taskForm.type === 'create'">
          <el-form-item label="创作类型">
            <el-select v-model="taskForm.config.contentType" placeholder="选择创作类型">
              <el-option label="图文笔记" value="note" />
              <el-option label="视频内容" value="video" />
              <el-option label="直播脚本" value="live" />
            </el-select>
          </el-form-item>
          <el-form-item label="主题方向">
            <el-input v-model="taskForm.config.topic" placeholder="请输入创作主题" />
          </el-form-item>
          <el-form-item label="目标人设">
            <el-select v-model="taskForm.config.personaId" placeholder="选择适用人设">
              <el-option label="甜心小仙女" value="1" />
              <el-option label="知性姐姐" value="2" />
              <el-option label="酷girl" value="3" />
            </el-select>
          </el-form-item>
        </template>

        <!-- 发布任务配置 -->
        <template v-if="taskForm.type === 'publish'">
          <el-form-item label="选择内容">
            <el-select v-model="taskForm.config.contentIds" multiple placeholder="选择要发布的内容">
              <el-option label="夏日防晒攻略" value="1" />
              <el-option label="穿搭分享" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="选择账号">
            <el-select v-model="taskForm.config.accountIds" multiple placeholder="选择发布账号">
              <el-option label="美妆达人小仙女" value="1" />
              <el-option label="穿搭博主" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="发布时间">
            <el-date-picker
              v-model="taskForm.config.scheduledTime"
              type="datetime"
              placeholder="选择发布时间"
            />
          </el-form-item>
        </template>

        <!-- 装修任务配置 -->
        <template v-if="taskForm.type === 'decoration'">
          <el-form-item label="装修类型">
            <el-select v-model="taskForm.config.decorationType" placeholder="选择装修类型">
              <el-option label="主页装修" value="profile" />
              <el-option label="背景图更换" value="background" />
              <el-option label="头像更新" value="avatar" />
            </el-select>
          </el-form-item>
          <el-form-item label="选择账号">
            <el-select v-model="taskForm.config.accountIds" multiple placeholder="选择要装修的账号">
              <el-option label="美妆达人小仙女" value="1" />
              <el-option label="穿搭博主" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="装修模板">
            <el-select v-model="taskForm.config.templateId" placeholder="选择装修模板">
              <el-option label="清新自然风" value="1" />
              <el-option label="时尚潮流风" value="2" />
              <el-option label="温馨简约风" value="3" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item label="计划执行">
          <el-switch v-model="taskForm.isScheduled" />
        </el-form-item>
        <el-form-item v-if="taskForm.isScheduled" label="执行时间">
          <el-date-picker
            v-model="taskForm.scheduledTime"
            type="datetime"
            placeholder="选择执行时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateTask">创建任务</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="任务详情" width="800px">
      <div v-if="selectedTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">{{ selectedTask.name }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ getTaskTypeText(selectedTask.type) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusColor(selectedTask.status)">
              {{ getStatusText(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(selectedTask.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ selectedTask.startTime ? formatDateTime(selectedTask.startTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ selectedTask.endTime ? formatDateTime(selectedTask.endTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行时长">{{ selectedTask.duration ? formatDuration(selectedTask.duration) : '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="progress-section">
          <h4>执行进度</h4>
          <el-progress 
            :percentage="selectedTask.progress.percentage" 
            :status="getProgressStatus(selectedTask.status)"
          />
          <p>{{ selectedTask.progress.message }}</p>
        </div>

        <div v-if="selectedTask.logs && selectedTask.logs.length > 0" class="logs-section">
          <h4>执行日志</h4>
          <div class="logs-container">
            <div 
              v-for="log in selectedTask.logs" 
              :key="log.timestamp"
              :class="['log-item', log.level]"
            >
              <span class="log-time">{{ formatDateTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Refresh, 
  Edit,
  Upload, 
  Picture
} from '@element-plus/icons-vue'

// 数据状态
const loading = ref(false)
const tasks = ref([])
const selectedTask = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const activeTab = ref('create')

// 对话框状态
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)

// 筛选表单
const filterForm = reactive({
  status: '',
  search: ''
})

// 任务表单
const taskForm = reactive({
  name: '',
  type: '',
  config: {
    contentType: '',
    topic: '',
    personaId: '',
    contentIds: [],
    accountIds: [],
    scheduledTime: null,
    decorationType: '',
    templateId: ''
  },
  isScheduled: false,
  scheduledTime: null
})

const taskRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择任务类型', trigger: 'change' }]
}

// 模拟数据
const mockTasks = [
  {
    id: 1,
    name: '夏日美妆内容创作',
    description: '创作5篇夏日美妆相关图文笔记',
    type: 'create',
    status: 'running',
    progress: {
      percentage: 60,
      message: '正在创作第3篇内容...'
    },
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    duration: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    logs: [
      { timestamp: new Date(), level: 'info', message: '任务开始执行' },
      { timestamp: new Date(), level: 'info', message: '成功创作内容: 夏日防晒攻略' },
      { timestamp: new Date(), level: 'info', message: '正在创作: 清爽底妆教程' }
    ]
  },
  {
    id: 2,
    name: '批量发布夏日内容',
    description: '发布3篇夏日相关内容到10个账号',
    type: 'publish',
    status: 'completed',
    progress: {
      percentage: 100,
      message: '发布完成'
    },
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
    duration: 3600000,
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    logs: []
  },
  {
    id: 3,
    name: '主页背景装修',
    description: '为5个账号更换夏日主题背景图',
    type: 'decoration',
    status: 'pending',
    progress: {
      percentage: 0,
      message: '等待执行'
    },
    startTime: null,
    endTime: null,
    duration: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    logs: []
  }
]

// 方法
const loadTasks = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 根据当前Tab过滤任务
    const filteredTasks = mockTasks.filter(task => task.type === activeTab.value)
    tasks.value = filteredTasks
    total.value = filteredTasks.length
  } finally {
    loading.value = false
  }
}

// Tab切换处理
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  currentPage.value = 1
  loadTasks()
}

const resetFilter = () => {
  Object.assign(filterForm, {
    status: '',
    search: ''
  })
  loadTasks()
}

const getTaskTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    create: 'info',
    publish: 'success',
    decoration: 'warning'
  }
  return colorMap[type] || ''
}

const getTaskTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    create: '创作任务',
    publish: '发布任务',
    decoration: '装修任务'
  }
  return textMap[type] || type
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    paused: 'info'
  }
  return colorMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    paused: '已暂停'
  }
  return textMap[status] || status
}


const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  return undefined
}

const formatTime = (time: Date) => {
  return time.toLocaleTimeString('zh-CN')
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((duration % (1000 * 60)) / 1000)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
}

const onTaskTypeChange = () => {
  // 重置配置
  taskForm.config = {
    contentType: '',
    topic: '',
    personaId: '',
    contentIds: [],
    accountIds: [],
    scheduledTime: null,
    decorationType: '',
    templateId: ''
  }
}

const viewTask = (task: any) => {
  selectedTask.value = task
  showDetailDialog.value = true
}

const startTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(`确认启动任务 "${task.name}" 吗？`, '启动任务')
    ElMessage.success('任务启动成功')
    loadTasks()
  } catch {
    // 用户取消
  }
}

const pauseTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(`确认暂停任务 "${task.name}" 吗？`, '暂停任务')
    ElMessage.success('任务暂停成功')
    loadTasks()
  } catch {
    // 用户取消
  }
}

const resumeTask = async (task: any) => {
  ElMessage.success('任务继续执行')
  loadTasks()
}

const retryTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(`确认重试任务 "${task.name}" 吗？`, '重试任务')
    ElMessage.success('任务重试中')
    loadTasks()
  } catch {
    // 用户取消
  }
}

const deleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(`确认删除任务 "${task.name}" 吗？`, '删除任务', {
      type: 'warning'
    })
    ElMessage.success('任务删除成功')
    loadTasks()
  } catch {
    // 用户取消
  }
}

const handleCreateTask = () => {
  ElMessage.success('任务创建成功')
  showCreateDialog.value = false
  loadTasks()
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.tasks-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h1 {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.header-left p {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tabs-card {
  margin-bottom: 16px;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-card {
  margin-bottom: 16px;
}

.table-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.task-info .task-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.task-info .task-desc {
  font-size: 12px;
  color: #909399;
}

.progress-info {
  width: 100%;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.time-info {
  font-size: 12px;
  color: #606266;
}

.time-info > div {
  margin-bottom: 2px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.task-detail {
  padding: 16px 0;
}

.progress-section {
  margin: 24px 0;
}

.progress-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.logs-section {
  margin-top: 24px;
}

.logs-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.log-item {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-time {
  color: #909399;
  min-width: 150px;
}

.log-item.info .log-message { color: #606266; }
.log-item.warn .log-message { color: #e6a23c; }
.log-item.error .log-message { color: #f56c6c; }

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>