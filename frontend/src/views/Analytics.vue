<template>
  <div class="analytics-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>数据分析</h1>
        <p>全面的数据分析和运营洞察</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAnalysisDialog = true">
          <el-icon><data-analysis /></el-icon>
          新建分析
        </el-button>
        <el-button @click="exportReport">
          <el-icon><download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 时间范围选择 -->
    <el-card class="time-range-card">
      <el-radio-group v-model="timeRange" @change="onTimeRangeChange">
        <el-radio-button value="1d">今天</el-radio-button>
        <el-radio-button value="7d">最近7天</el-radio-button>
        <el-radio-button value="30d">最近30天</el-radio-button>
        <el-radio-button value="90d">最近90天</el-radio-button>
        <el-radio-button value="custom">自定义</el-radio-button>
      </el-radio-group>
      <el-date-picker
        v-if="timeRange === 'custom'"
        v-model="customDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="margin-left: 16px;"
        @change="loadAnalytics"
      />
    </el-card>

    <!-- 概览数据 -->
    <div class="overview-grid">
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.totalViews }}</div>
          <div class="overview-label">总曝光量</div>
          <div class="overview-trend">
            <el-icon class="trend-up"><trend-charts /></el-icon>
            <span>+12.5%</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.totalLikes }}</div>
          <div class="overview-label">总点赞数</div>
          <div class="overview-trend">
            <el-icon class="trend-up"><trend-charts /></el-icon>
            <span>+8.3%</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.totalComments }}</div>
          <div class="overview-label">总评论数</div>
          <div class="overview-trend">
            <el-icon class="trend-down"><bottom /></el-icon>
            <span>-2.1%</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.avgEngagement }}%</div>
          <div class="overview-label">平均互动率</div>
          <div class="overview-trend">
            <el-icon class="trend-up"><trend-charts /></el-icon>
            <span>+5.7%</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="charts-left">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>数据趋势</span>
              <el-select v-model="trendMetric" style="width: 120px;">
                <el-option label="曝光量" value="views" />
                <el-option label="点赞数" value="likes" />
                <el-option label="评论数" value="comments" />
                <el-option label="互动率" value="engagement" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div id="trendChart" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <span>内容类型分布</span>
          </template>
          <div class="chart-container">
            <div id="contentTypeChart" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </div>

      <div class="charts-right">
        <el-card class="chart-card">
          <template #header>
            <span>发布时间热力图</span>
          </template>
          <div class="chart-container">
            <div id="heatmapChart" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <span>热门话题Top10</span>
          </template>
          <div class="topics-list">
            <div 
              v-for="(topic, index) in topTopics" 
              :key="topic.name"
              class="topic-item"
            >
              <div class="topic-rank">{{ index + 1 }}</div>
              <div class="topic-info">
                <div class="topic-name">#{{ topic.name }}</div>
                <div class="topic-count">{{ topic.count }}次使用</div>
              </div>
              <div class="topic-trend">
                <el-icon :class="topic.trend === 'up' ? 'trend-up' : 'trend-down'">
                  <component :is="topic.trend === 'up' ? 'TrendCharts' : 'Bottom'" />
                </el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 账号表现排行 -->
    <el-card class="ranking-card">
      <template #header>
        <div class="card-header">
          <span>账号表现排行</span>
          <el-select v-model="rankingMetric" style="width: 120px;">
            <el-option label="曝光量" value="views" />
            <el-option label="点赞数" value="likes" />
            <el-option label="互动率" value="engagement" />
            <el-option label="涨粉数" value="followers" />
          </el-select>
        </div>
      </template>
      <el-table :data="accountRanking" style="width: 100%">
        <el-table-column label="排名" width="80">
          <template #default="{ $index }">
            <div class="rank-number" :class="getRankClass($index)">
              {{ $index + 1 }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账号" min-width="200">
          <template #default="{ row }">
            <div class="account-cell">
              <el-avatar :src="row.avatar" :alt="row.nickname" size="small" />
              <div class="account-info">
                <div class="nickname">{{ row.nickname }}</div>
                <div class="username">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="曝光量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.views) }}
          </template>
        </el-table-column>
        <el-table-column label="点赞数" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.likes) }}
          </template>
        </el-table-column>
        <el-table-column label="评论数" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.comments) }}
          </template>
        </el-table-column>
        <el-table-column label="互动率" width="120">
          <template #default="{ row }">
            {{ row.engagement }}%
          </template>
        </el-table-column>
        <el-table-column label="涨粉数" width="120">
          <template #default="{ row }">
            +{{ formatNumber(row.followerGrowth) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link size="small" @click="viewAccountDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>


    <!-- 新建分析对话框 -->
    <el-dialog v-model="showAnalysisDialog" title="新建分析" width="600px">
      <el-form :model="analysisForm" label-width="100px">
        <el-form-item label="分析类型">
          <el-select v-model="analysisForm.type" placeholder="选择分析类型">
            <el-option label="趋势分析" value="trend" />
            <el-option label="竞品分析" value="competitor" />
            <el-option label="受众分析" value="audience" />
            <el-option label="内容分析" value="content" />
          </el-select>
        </el-form-item>
        
        <template v-if="analysisForm.type === 'trend'">
          <el-form-item label="关键词">
            <el-input v-model="analysisForm.keyword" placeholder="输入分析关键词" />
          </el-form-item>
          <el-form-item label="平台">
            <el-select v-model="analysisForm.platform" placeholder="选择平台">
              <el-option label="小红书" value="xiaohongshu" />
              <el-option label="抖音" value="douyin" />
              <el-option label="微博" value="weibo" />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="analysisForm.type === 'competitor'">
          <el-form-item label="竞品账号">
            <el-input v-model="analysisForm.competitorId" placeholder="输入竞品账号ID" />
          </el-form-item>
        </template>

        <template v-if="analysisForm.type === 'audience'">
          <el-form-item label="分析账号">
            <el-select v-model="analysisForm.accountIds" multiple placeholder="选择分析账号">
              <el-option label="美妆达人小仙女" value="1" />
              <el-option label="穿搭博主" value="2" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item label="分析周期">
          <el-date-picker
            v-model="analysisForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAnalysisDialog = false">取消</el-button>
          <el-button type="primary" :loading="analysisLoading" @click="startAnalysis">
            {{ analysisLoading ? '分析中...' : '开始分析' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  DataAnalysis, 
  Download, 
  TrendCharts, 
  Bottom
} from '@element-plus/icons-vue'

// 数据状态
const timeRange = ref('7d')
const customDateRange = ref([])
const trendMetric = ref('views')
const rankingMetric = ref('views')
const showAnalysisDialog = ref(false)
const analysisLoading = ref(false)

// 概览数据
const overview = ref({
  totalViews: '156.2万',
  totalLikes: '8.5万',
  totalComments: '1.2万',
  avgEngagement: '5.4'
})

// 分析表单
const analysisForm = reactive({
  type: '',
  keyword: '',
  platform: 'xiaohongshu',
  competitorId: '',
  accountIds: [],
  dateRange: []
})

// 热门话题
const topTopics = ref([
  { name: '夏日穿搭', count: 156, trend: 'up' },
  { name: '防晒攻略', count: 142, trend: 'up' },
  { name: '减肥日记', count: 128, trend: 'down' },
  { name: '护肤心得', count: 119, trend: 'up' },
  { name: '美妆教程', count: 98, trend: 'up' }
])

// 账号排行
const accountRanking = ref([
  {
    id: 1,
    nickname: '美妆达人小仙女',
    username: 'beauty_girl_123',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    views: 85620,
    likes: 15620,
    comments: 2856,
    engagement: 6.8,
    followerGrowth: 892
  },
  {
    id: 2,
    nickname: '穿搭博主',
    username: 'fashion_blogger',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    views: 68943,
    likes: 12356,
    comments: 1984,
    engagement: 5.9,
    followerGrowth: 567
  },
  {
    id: 3,
    nickname: '生活记录者',
    username: 'life_recorder',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    views: 45621,
    likes: 8934,
    comments: 1247,
    engagement: 4.5,
    followerGrowth: 324
  }
])


// 方法
const onTimeRangeChange = () => {
  if (timeRange.value !== 'custom') {
    loadAnalytics()
  }
}

const loadAnalytics = async () => {
  // 模拟加载数据
  console.log('Loading analytics data...')
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

const viewAccountDetail = (account: any) => {
  ElMessage.info(`查看账号详情: ${account.nickname}`)
}


const exportReport = () => {
  ElMessage.success('报告导出中...')
}

const startAnalysis = async () => {
  analysisLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 3000))
    ElMessage.success('分析任务已启动，请在任务中心查看进度')
    showAnalysisDialog.value = false
  } finally {
    analysisLoading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  // 这里可以集成 ECharts 来显示真实图表
  // 由于没有引入 ECharts，这里只是占位
  console.log('Initializing charts...')
}

onMounted(() => {
  loadAnalytics()
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.analytics-page {
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

.time-range-card {
  margin-bottom: 24px;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.overview-content {
  text-align: center;
  padding: 8px 0;
}

.overview-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.charts-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.charts-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 6px;
  color: #909399;
  font-size: 14px;
}

.topics-list {
  max-height: 300px;
  overflow-y: auto;
}

.topic-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.topic-item:last-child {
  border-bottom: none;
}

.topic-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #606266;
  margin-right: 12px;
}

.topic-info {
  flex: 1;
}

.topic-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
}

.topic-count {
  font-size: 12px;
  color: #909399;
}

.topic-trend {
  font-size: 16px;
}

.ranking-card {
  margin-bottom: 24px;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background: #f0f0f0;
  color: #606266;
}

.rank-number.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
}

.rank-number.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #666;
}

.rank-number.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: #654321;
}

.account-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-info .nickname {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.account-info .username {
  font-size: 12px;
  color: #909399;
}


@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
}
</style>