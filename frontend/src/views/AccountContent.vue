<template>
  <div class="account-content-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button 
          link 
          @click="router.go(-1)"
          style="color: #409eff; margin-right: 12px;"
        >
          <el-icon><arrow-left /></el-icon>
          返回账号列表
        </el-button>
        <div>
          <h1>{{ accountInfo.nickname }} - 内容管理</h1>
          <p>管理该账号的所有内容，支持AI生成</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><edit /></el-icon>
          创建内容
        </el-button>
        <el-button type="success" @click="showAIDialog = true">
          <el-icon><magic-stick /></el-icon>
          AI生成
        </el-button>
      </div>
    </div>

    <!-- 账号信息卡片 -->
    <el-card class="account-info-card">
      <div class="account-summary">
        <el-avatar :size="60" :src="accountInfo.avatar" />
        <div class="info">
          <div class="nickname">{{ accountInfo.nickname }}</div>
          <div class="username">@{{ accountInfo.username }}</div>
          <div class="stats">
            <span>粉丝: {{ formatNumber(accountInfo.followersCount) }}</span>
            <span>笔记: {{ formatNumber(accountInfo.notesCount) }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 内容状态Tab -->
    <el-card class="content-tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="已发布-成功" name="published">
          <template #label>
            <span class="tab-label">
              <el-icon><circle-check /></el-icon>
              已发布-成功 ({{ publishedCount }})
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已发布-失败" name="failed">
          <template #label>
            <span class="tab-label">
              <el-icon><circle-close /></el-icon>
              已发布-失败 ({{ failedCount }})
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="待发布" name="pending">
          <template #label>
            <span class="tab-label">
              <el-icon><clock /></el-icon>
              待发布 ({{ pendingCount }})
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :model="filterForm" inline>
          <el-form-item label="搜索">
            <el-input 
              v-model="filterForm.search" 
              placeholder="标题/内容关键词"
              @keyup.enter="loadContents"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadContents">搜索</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 批量操作栏 -->
    <div class="batch-actions" v-show="selectedContents.length > 0">
      <div class="selected-info">
        已选择 {{ selectedContents.length }} 个内容
      </div>
      <div class="actions">
        <el-button size="small" @click="batchApprove">批量通过</el-button>
        <el-button size="small" @click="batchSchedule">批量安排</el-button>
        <el-button size="small" type="warning" @click="batchPublish">批量发布</el-button>
        <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="content-grid">
      <div v-if="contents.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无内容">
          <el-button type="primary" @click="showCreateDialog = true">创建第一个内容</el-button>
        </el-empty>
      </div>
      
      <div v-loading="loading" class="content-list">
        <el-card
          v-for="content in contents"
          :key="content.id"
          class="content-card"
          shadow="hover"
        >
          <div class="content-card-body">
            <!-- 左侧内容区域 -->
            <div class="content-left">
              <!-- 笔记图片区域 -->
              <div class="note-images">
                <div class="image-count">{{ content.images?.length || 1 }} / 18</div>
                <div class="images-container">
                  <!-- 图片滚动容器 -->
                  <div class="images-scroll" ref="imagesScrollRef">
                    <div 
                      class="image-item"
                      v-for="(image, index) in content.images || [content.cover]"
                      :key="index"
                      :draggable="true"
                      @dragstart="handleDragStart(index, $event)"
                      @dragover="handleDragOver($event)"
                      @drop="handleDrop(index, $event)"
                    >
                      <el-image
                        :src="image"
                        fit="cover"
                        class="drag-image"
                        @click="openImagePreview(content.images || [content.cover], index)"
                      />
                      <div class="image-overlay">
                        <el-icon class="drag-icon"><rank /></el-icon>
                      </div>
                    </div>
                    <!-- 添加按钮 -->
                    <div class="add-image-btn" @click="addNewImage(content)">
                      <el-icon><plus /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 正文内容 -->
              <div class="content-text">
                <div class="content-section">
                  <h4>正文内容</h4>
                  <div class="content-field">
                    <label>标题：</label>
                    <span>{{ content.title }}</span>
                  </div>
                  <div class="content-field">
                    <label>正文：</label>
                    <p>{{ content.content }}</p>
                  </div>
                </div>
                
                <!-- 笔记话题 -->
                <div class="content-section">
                  <h4>笔记话题</h4>
                  <div class="hashtags">
                    <el-tag
                      v-for="tag in content.hashtags"
                      :key="tag"
                      size="small"
                      type="primary"
                      effect="light"
                      class="hashtag-item"
                    >
                      {{ tag }}
                    </el-tag>
                    <el-button size="small" text>+ New Tag</el-button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧数据统计区域 -->
            <div class="content-right">
              <div class="stats-section">
                <div class="stat-item">
                  <label>浏览数：</label>
                  <span class="stat-value">{{ formatNumber(content.performance.views) }}</span>
                </div>
                <div class="stat-item">
                  <label>点赞数：</label>
                  <span class="stat-value">{{ formatNumber(content.performance.likes) }}</span>
                </div>
                <div class="stat-item">
                  <label>评论数：</label>
                  <span class="stat-value">{{ formatNumber(content.performance.comments) }}</span>
                </div>
                <div class="stat-item">
                  <label>创建时间：</label>
                  <span class="stat-value">{{ formatDateTime(content.createdAt) }}</span>
                </div>
                
                <!-- 操作按钮 -->
                <div class="actions-section">
                  <label>操作：</label>
                  <div class="action-buttons">
                    <!-- 待发布状态：显示全部操作 -->
                    <template v-if="activeTab === 'pending'">
                      <el-button size="small" @click="viewContent(content)">预览</el-button>
                      <el-button size="small" type="primary" @click="editContent(content)">修改</el-button>
                      <el-button size="small" type="success" @click="publishContent(content)">发布</el-button>
                      <el-button size="small" type="danger" @click="deleteContent(content)">删除</el-button>
                    </template>
                    
                    <!-- 已发布失败状态：只显示重新发布 -->
                    <template v-else-if="activeTab === 'failed'">
                      <el-button size="small" type="warning" @click="republishContent(content)">重新发布</el-button>
                    </template>
                    
                    <!-- 已发布成功状态：只显示修改 -->
                    <template v-else-if="activeTab === 'published'">
                      <el-button size="small" type="primary" @click="editContent(content)">修改</el-button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 选择框 -->
          <el-checkbox 
            v-model="content.selected"
            @change="handleContentSelection(content)"
            class="content-checkbox"
          />
        </el-card>
      </div>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadContents"
          @current-change="loadContents"
        />
      </div>
    </div>

    <!-- 创建内容对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建内容" width="800px">
      <el-form :model="contentForm" :rules="contentRules" ref="contentFormRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="contentForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容类型" prop="contentType">
          <el-radio-group v-model="contentForm.contentType">
            <el-radio value="note">图文笔记</el-radio>
            <el-radio value="video">视频</el-radio>
            <el-radio value="image">图片</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="contentForm.category" placeholder="选择分类">
            <el-option label="美妆" value="beauty" />
            <el-option label="穿搭" value="fashion" />
            <el-option label="生活" value="lifestyle" />
            <el-option label="美食" value="food" />
          </el-select>
        </el-form-item>
        <el-form-item label="正文内容" prop="content">
          <el-input 
            v-model="contentForm.content" 
            type="textarea" 
            :rows="6"
            placeholder="请输入内容..."
          />
        </el-form-item>
        <el-form-item label="话题标签">
          <el-input 
            v-model="hashtagInput" 
            placeholder="输入话题标签，按回车添加"
            @keyup.enter="addHashtag"
          />
          <div class="hashtag-list">
            <el-tag
              v-for="(tag, index) in contentForm.hashtags"
              :key="tag"
              closable
              @close="removeHashtag(index)"
              style="margin: 4px 4px 0 0;"
            >
              #{{ tag }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            class="upload-demo"
            :auto-upload="false"
            :file-list="contentForm.images"
            list-type="picture-card"
            accept="image/*"
            multiple
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button @click="saveAsDraft">保存草稿</el-button>
          <el-button type="primary" @click="submitForReview">提交审核</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- AI生成对话框 -->
    <el-dialog v-model="showAIDialog" title="AI智能生成内容" width="600px">
      <el-form :model="aiForm" label-width="100px">
        <el-form-item label="主题">
          <el-input v-model="aiForm.topic" placeholder="请输入内容主题，如：夏日防晒攻略" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="aiForm.category" placeholder="选择分类">
            <el-option label="美妆" value="beauty" />
            <el-option label="穿搭" value="fashion" />
            <el-option label="生活" value="lifestyle" />
            <el-option label="美食" value="food" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标受众">
          <el-checkbox-group v-model="aiForm.targetAudience">
            <el-checkbox value="年轻女性">年轻女性</el-checkbox>
            <el-checkbox value="都市白领">都市白领</el-checkbox>
            <el-checkbox value="学生群体">学生群体</el-checkbox>
            <el-checkbox value="宝妈群体">宝妈群体</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="内容风格">
          <el-select v-model="aiForm.mood" placeholder="选择风格">
            <el-option label="轻松愉快" value="happy" />
            <el-option label="激励向上" value="inspirational" />
            <el-option label="幽默风趣" value="humorous" />
            <el-option label="温馨治愈" value="calm" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容长度">
          <el-radio-group v-model="aiForm.length">
            <el-radio value="short">简短（100字内）</el-radio>
            <el-radio value="medium">中等（100-300字）</el-radio>
            <el-radio value="long">详细（300字以上）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="aiForm.keywords" 
            placeholder="输入相关关键词，用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAIDialog = false">取消</el-button>
          <el-button type="primary" :loading="aiGenerating" @click="generateAIContent">
            {{ aiGenerating ? 'AI生成中...' : '开始生成' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="showImagePreview"
      :show-close="false"
      :modal="true"
      width="90%"
      style="max-width: 1200px;"
      class="image-preview-dialog"
      @close="closeImagePreview"
    >
      <div class="image-preview-container">
        <div class="preview-header">
          <span class="image-counter">{{ currentPreviewIndex + 1 }} / {{ previewImages.length }}</span>
          <el-button @click="closeImagePreview" size="large" circle>
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <div class="preview-body">
          <el-button 
            v-show="currentPreviewIndex > 0"
            @click="previousImage"
            class="nav-btn prev-btn"
            size="large"
            circle
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          
          <div class="preview-image-wrapper">
            <el-image
              :src="previewImages[currentPreviewIndex]"
              fit="contain"
              class="preview-image"
            />
          </div>
          
          <el-button 
            v-show="currentPreviewIndex < previewImages.length - 1"
            @click="nextImage"
            class="nav-btn next-btn"
            size="large"
            circle
          >
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, MagicStick, Plus, ArrowLeft, CircleCheck, CircleClose, Clock, Rank, Close, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 账号信息
const accountInfo = ref({
  id: 1,
  nickname: '美妆达人小仙女',
  username: 'beauty_girl_123',
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  followersCount: 15620,
  notesCount: 256
})

// 数据状态
const loading = ref(false)
const contents = ref<any[]>([])
const selectedContents = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const activeTab = ref('published')

// 统计数据
const publishedCount = ref(0)
const failedCount = ref(0)
const pendingCount = ref(0)

// 对话框状态
const showCreateDialog = ref(false)
const showAIDialog = ref(false)
const aiGenerating = ref(false)

// 图片预览状态
const showImagePreview = ref(false)
const previewImages = ref<string[]>([])
const currentPreviewIndex = ref(0)

// 表单数据
const filterForm = reactive({
  search: ''
})

const contentForm = reactive({
  title: '',
  contentType: 'note',
  category: '',
  content: '',
  hashtags: [] as string[],
  images: [] as string[]
})

const aiForm = reactive({
  topic: '',
  category: '',
  targetAudience: [],
  mood: 'happy',
  length: 'medium',
  keywords: ''
})

const hashtagInput = ref('')

const contentRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 模拟数据
const allMockContents = [
  // 已发布-成功
  {
    id: 1,
    title: '夏日防晒攻略｜这些防晒霜真的好用！',
    content: '夏天到了，防晒是护肤的重中之重！今天来分享几款我用过觉得很不错的防晒霜...',
    contentType: 'note',
    category: '美妆',
    hashtags: ['防晒攻略', '夏日护肤', '防晒霜推荐'],
    cover: 'https://picsum.photos/300/300?random=1',
    images: [
      'https://picsum.photos/300/300?random=1',
      'https://picsum.photos/300/300?random=11',
      'https://picsum.photos/300/300?random=21'
    ],
    reviewStatus: 'approved',
    publishStatus: 'published',
    performance: {
      views: 15620,
      likes: 892,
      comments: 156
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    selected: false
  },
  {
    id: 2,
    title: '秋冬穿搭指南｜温暖又时髦',
    content: '秋冬季节如何穿得既温暖又时髦？分享我的私藏穿搭技巧...',
    contentType: 'note',
    category: '穿搭',
    hashtags: ['秋冬穿搭', '保暖搭配', '时髦穿搭'],
    cover: 'https://picsum.photos/300/300?random=3',
    images: [
      'https://picsum.photos/300/300?random=3',
      'https://picsum.photos/300/300?random=13'
    ],
    reviewStatus: 'approved',
    publishStatus: 'published',
    performance: {
      views: 8900,
      likes: 567,
      comments: 89
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    selected: false
  },
  // 已发布-失败
  {
    id: 3,
    title: '居家健身｜在家也能练出好身材',
    content: '不想去健身房？在家也能锻炼出好身材！分享几个简单有效的居家健身动作...',
    contentType: 'video',
    category: '生活',
    hashtags: ['居家健身', '减肥瘦身', '健身教程'],
    cover: 'https://picsum.photos/300/300?random=4',
    images: [
      'https://picsum.photos/300/300?random=4',
      'https://picsum.photos/300/300?random=14',
      'https://picsum.photos/300/300?random=24',
      'https://picsum.photos/300/300?random=34'
    ],
    reviewStatus: 'approved',
    publishStatus: 'failed',
    performance: {
      views: 0,
      likes: 0,
      comments: 0
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    failReason: '视频格式不支持',
    selected: false
  },
  {
    id: 4,
    title: '网红咖啡店探店｜这家店真的值得打卡',
    content: '最近发现了一家超棒的咖啡店，环境和咖啡都很赞！赶紧来分享给大家...',
    contentType: 'note',
    category: '美食',
    hashtags: ['咖啡店', '探店', '网红店'],
    cover: 'https://picsum.photos/300/300?random=5',
    images: [
      'https://picsum.photos/300/300?random=5',
      'https://picsum.photos/300/300?random=15',
      'https://picsum.photos/300/300?random=25'
    ],
    reviewStatus: 'approved',
    publishStatus: 'failed',
    performance: {
      views: 0,
      likes: 0,
      comments: 0
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    failReason: '图片审核不通过',
    selected: false
  },
  // 待发布
  {
    id: 5,
    title: '新品彩妆测评｜这些产品值得入手吗？',
    content: '最近收到了几款新品彩妆，试用了一段时间后来给大家做个详细测评...',
    contentType: 'note',
    category: '美妆',
    hashtags: ['彩妆测评', '新品推荐', '美妆种草'],
    cover: 'https://picsum.photos/300/300?random=6',
    images: [
      'https://picsum.photos/300/300?random=6',
      'https://picsum.photos/300/300?random=16'
    ],
    reviewStatus: 'approved',
    publishStatus: 'draft',
    performance: {
      views: 0,
      likes: 0,
      comments: 0
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    selected: false
  },
  {
    id: 6,
    title: '周末一日游｜城市周边好去处推荐',
    content: '周末不知道去哪里？推荐几个城市周边的好去处，适合一日游放松心情...',
    contentType: 'note',
    category: '生活',
    hashtags: ['周末游', '一日游', '旅行推荐'],
    cover: 'https://picsum.photos/300/300?random=7',
    images: [
      'https://picsum.photos/300/300?random=7',
      'https://picsum.photos/300/300?random=17',
      'https://picsum.photos/300/300?random=27',
      'https://picsum.photos/300/300?random=37',
      'https://picsum.photos/300/300?random=47'
    ],
    reviewStatus: 'pending',
    publishStatus: 'draft',
    performance: {
      views: 0,
      likes: 0,
      comments: 0
    },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    selected: false
  }
]

// 获取账号信息
const loadAccountInfo = () => {
  const accountId = route.params.id
  // 这里应该根据accountId从API获取账号信息
  // 现在使用模拟数据
}

// 获取当前Tab对应的发布状态
const getPublishStatusByTab = (tab: string) => {
  switch (tab) {
    case 'published':
      return 'published'
    case 'failed':
      return 'failed'
    case 'pending':
      return ['draft', 'scheduled']
    default:
      return 'published'
  }
}

// 方法
const loadContents = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 根据当前Tab过滤内容
    const statusFilter = getPublishStatusByTab(activeTab.value)
    let filteredContents = allMockContents.filter(content => {
      if (Array.isArray(statusFilter)) {
        return statusFilter.includes(content.publishStatus)
      }
      return content.publishStatus === statusFilter
    })
    
    // 应用搜索筛选条件
    if (filterForm.search) {
      filteredContents = filteredContents.filter(content => 
        content.title.includes(filterForm.search) || content.content.includes(filterForm.search)
      )
    }
    
    contents.value = filteredContents
    total.value = filteredContents.length
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadCounts = () => {
  publishedCount.value = allMockContents.filter(c => c.publishStatus === 'published').length
  failedCount.value = allMockContents.filter(c => c.publishStatus === 'failed').length
  pendingCount.value = allMockContents.filter(c => ['draft', 'scheduled'].includes(c.publishStatus)).length
}

// Tab切换处理
const handleTabChange = (tabName: any) => {
  activeTab.value = tabName as string
  currentPage.value = 1
  loadContents()
}

const resetFilter = () => {
  Object.assign(filterForm, {
    search: ''
  })
  loadContents()
}

const handleSelectionChange = (selection: any[]) => {
  selectedContents.value = selection
}


const getReviewStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return colorMap[status] || 'info'
}

const getReviewStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return textMap[status] || status
}

const getPublishStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    draft: 'info',
    scheduled: 'warning',
    publishing: 'warning',
    published: 'success',
    failed: 'danger'
  }
  return colorMap[status] || 'info'
}

const getPublishStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    draft: '草稿',
    scheduled: '已安排',
    publishing: '发布中',
    published: '已发布',
    failed: '失败'
  }
  return textMap[status] || status
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

const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleContentSelection = (content: any) => {
  if (content.selected) {
    if (!selectedContents.value.find(c => c.id === content.id)) {
      selectedContents.value.push(content)
    }
  } else {
    selectedContents.value = selectedContents.value.filter(c => c.id !== content.id)
  }
}

const addHashtag = () => {
  const tag = hashtagInput.value.trim()
  if (tag && !contentForm.hashtags.includes(tag)) {
    contentForm.hashtags.push(tag)
    hashtagInput.value = ''
  }
}

const removeHashtag = (index: number) => {
  contentForm.hashtags.splice(index, 1)
}

const viewContent = (content: any) => {
  ElMessage.info(`预览内容: ${content.title}`)
}

const editContent = (content: any) => {
  ElMessage.info(`编辑内容: ${content.title}`)
}

const publishContent = (content: any) => {
  ElMessage.success(`发布内容: ${content.title}`)
}

const republishContent = (content: any) => {
  ElMessage.success(`重新发布内容: ${content.title}`)
}

const deleteContent = async (content: any) => {
  try {
    await ElMessageBox.confirm(`确认删除内容 "${content.title}" 吗？`, '删除确认', {
      type: 'warning'
    })
    ElMessage.success('删除成功')
    loadContents()
  } catch {
    // 用户取消
  }
}

// 图片拖拽相关变量
const draggedIndex = ref<number | null>(null)
const imagesScrollRef = ref<HTMLElement>()

// 图片拖拽方法
const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
  // 添加拖拽样式
  if (event.target instanceof HTMLElement) {
    event.target.closest('.image-item')?.classList.add('dragging')
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDrop = (dropIndex: number, event: DragEvent) => {
  event.preventDefault()
  
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    return
  }

  // 找到对应的内容项
  const targetContent = contents.value.find(content => {
    const images = content.images || [content.cover]
    return images.length > Math.max(draggedIndex.value!, dropIndex)
  })

  if (targetContent && targetContent.images) {
    const images = [...targetContent.images]
    const draggedItem = images[draggedIndex.value]
    
    // 移除拖拽项
    images.splice(draggedIndex.value, 1)
    
    // 在新位置插入
    const insertIndex = draggedIndex.value < dropIndex ? dropIndex - 1 : dropIndex
    images.splice(insertIndex, 0, draggedItem)
    
    // 更新数组
    targetContent.images = images
    
    ElMessage.success('图片顺序已更新')
  }
  
  // 清除拖拽状态
  draggedIndex.value = null
  document.querySelectorAll('.image-item.dragging').forEach(el => {
    el.classList.remove('dragging')
  })
}

// 图片预览方法
const openImagePreview = (images: string[], index: number) => {
  previewImages.value = images
  currentPreviewIndex.value = index
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
}

const previousImage = () => {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--
  }
}

const nextImage = () => {
  if (currentPreviewIndex.value < previewImages.value.length - 1) {
    currentPreviewIndex.value++
  }
}

// 添加新图片方法
const addNewImage = (content: any) => {
  ElMessage.info(`为内容 "${content.title}" 添加新图片`)
  // 这里可以打开图片上传对话框
  // 暂时添加一个随机图片作为演示
  if (!content.images) {
    content.images = [content.cover]
  }
  const newImageUrl = `https://picsum.photos/300/300?random=${Date.now()}`
  content.images.push(newImageUrl)
  ElMessage.success('图片添加成功')
}

const batchApprove = () => {
  ElMessage.success('批量审核通过')
}

const batchSchedule = () => {
  ElMessage.info('请设置发布时间')
}

const batchPublish = () => {
  ElMessage.success('批量发布任务已启动')
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedContents.value.length} 个内容吗？`, '批量删除', {
      type: 'warning'
    })
    ElMessage.success('批量删除成功')
    loadContents()
  } catch {
    // 用户取消
  }
}

const saveAsDraft = () => {
  ElMessage.success('保存草稿成功')
  showCreateDialog.value = false
}

const submitForReview = () => {
  ElMessage.success('提交审核成功')
  showCreateDialog.value = false
}

const generateAIContent = async () => {
  aiGenerating.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 3000))
    ElMessage.success('AI内容生成成功！')
    showAIDialog.value = false
    
    // 打开创建对话框并填入生成的内容
    Object.assign(contentForm, {
      title: `${aiForm.topic} - AI生成内容`,
      category: aiForm.category,
      content: `这是根据主题"${aiForm.topic}"生成的内容...\n\n适合${aiForm.targetAudience.join('、')}群体阅读。`,
      hashtags: aiForm.keywords.split(',').map(k => k.trim()).filter(Boolean)
    })
    showCreateDialog.value = true
  } finally {
    aiGenerating.value = false
  }
}

onMounted(() => {
  loadAccountInfo()
  loadCounts()
  loadContents()
})
</script>

<style scoped>
.account-content-page {
  padding: 24px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
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

.account-info-card {
  margin-bottom: 16px;
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info .nickname {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.info .username {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.info .stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.content-tabs-card {
  margin-bottom: 16px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.no-actions {
  color: #909399;
  font-size: 12px;
  padding: 4px 8px;
}

.batch-actions {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-info {
  color: #1d4ed8;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

/* 内容网格布局 */
.content-grid {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-card {
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #ffffff;
  transition: box-shadow 0.3s;
}

.content-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.content-card-body {
  display: flex;
  min-height: 400px;
}

/* 左侧内容区域 */
.content-left {
  flex: 1;
  padding: 20px;
  border-right: 1px solid #e4e7ed;
}

/* 笔记图片区域 */
.note-images {
  position: relative;
  margin-bottom: 20px;
}

.image-count {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  z-index: 10;
}

.images-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.images-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 120px;
  align-items: center;
}

.images-scroll::-webkit-scrollbar {
  height: 6px;
}

.images-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.images-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.images-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.image-item {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.image-item:hover {
  transform: scale(1.05);
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.image-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.drag-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.image-overlay::before {
  content: "点击预览";
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.drag-icon {
  color: white;
  font-size: 20px;
}

.add-image-btn {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  transition: all 0.3s;
  background: white;
}

.add-image-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f9ff;
}

/* 正文内容区域 */
.content-text {
  flex: 1;
}

.content-section {
  margin-bottom: 20px;
}

.content-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.content-field {
  margin-bottom: 10px;
  line-height: 1.6;
}

.content-field label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.content-field span, .content-field p {
  color: #303133;
  word-break: break-word;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.hashtag-item {
  margin: 0;
}

/* 右侧数据统计区域 */
.content-right {
  width: 300px;
  padding: 20px;
  background: #fafafa;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-item label {
  font-weight: 500;
  color: #606266;
}

.stat-value {
  font-weight: 600;
  color: #303133;
}

.actions-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.actions-section label {
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
  display: block;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .el-button {
  justify-content: flex-start;
  width: 100%;
}

/* 选择框 */
.content-checkbox {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}


.pagination {
  margin-top: 16px;
  text-align: right;
}

.hashtag-list {
  margin-top: 8px;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}

/* 图片预览对话框样式 */
.image-preview-dialog {
  --el-dialog-padding: 0;
}

.image-preview-container {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.image-counter {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: transparent;
}

.preview-image-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 1);
}
</style>