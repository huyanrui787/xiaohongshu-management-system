<template>
  <div class="personas-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>人设管理</h1>
        <p>管理预设账号人设，支持快速应用</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><plus /></el-icon>
          新建人设
        </el-button>
        <el-button @click="showImportDialog = true">
          <el-icon><upload /></el-icon>
          批量导入
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="平台">
          <el-select v-model="filterForm.platform" placeholder="全部平台" clearable>
            <el-option label="小红书" value="xiaohongshu" />
            <el-option label="抖音" value="douyin" />
            <el-option label="微博" value="weibo" />
            <el-option label="B站" value="bilibili" />
          </el-select>
        </el-form-item>
        <el-form-item label="类目">
          <el-select v-model="filterForm.category" placeholder="全部类目" clearable>
            <el-option label="美妆" value="beauty" />
            <el-option label="穿搭" value="fashion" />
            <el-option label="生活" value="lifestyle" />
            <el-option label="美食" value="food" />
            <el-option label="旅行" value="travel" />
            <el-option label="健身" value="fitness" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input 
            v-model="filterForm.search" 
            placeholder="昵称/描述关键词"
            @keyup.enter="loadPersonas"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPersonas">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 人设卡片网格 -->
    <div class="personas-grid" v-loading="loading">
      <div v-if="personas.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无人设数据">
          <el-button type="primary" @click="showCreateDialog = true">创建第一个人设</el-button>
        </el-empty>
      </div>
      <el-card 
        v-for="persona in personas" 
        :key="persona.id"
        class="persona-card"
        :body-style="{ padding: '16px' }"
        shadow="hover"
      >
        <div class="persona-content">
          <!-- 头像 -->
          <div class="avatar-section">
            <el-avatar :size="60" :src="persona.avatar" />
          </div>
          
          <!-- 昵称 -->
          <div class="nickname">{{ persona.nickname }}</div>
          
          <!-- 身份简介 -->
          <div class="brief">{{ persona.brief }}</div>
          
          <!-- 人设说明 -->
          <div class="description">{{ persona.description }}</div>
          
          <!-- 标签信息 -->
          <div class="tags-section">
            <div class="tag-group">
              <span class="tag-label">平台</span>
              <el-tag size="small">{{ getPlatformText(persona.platform) }}</el-tag>
            </div>
            <div class="tag-group">
              <span class="tag-label">类目</span>
              <el-tag size="small" type="success">{{ getCategoryText(persona.category) }}</el-tag>
            </div>
          </div>
          
          
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 36, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadPersonas"
        @current-change="loadPersonas"
      />
    </div>

    <!-- 新建人设对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建人设" width="600px">
      <el-form :model="personaForm" :rules="personaRules" ref="personaFormRef" label-width="100px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="personaForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
          >
            <img v-if="personaForm.avatar" :src="personaForm.avatar" class="avatar-preview" />
            <el-icon v-else class="avatar-uploader-icon"><plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="身份简介" prop="brief">
          <el-input v-model="personaForm.brief" placeholder="大约五十字的身份简介" />
        </el-form-item>
        <el-form-item label="人设说明" prop="description">
          <el-input 
            v-model="personaForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="大约一百字的详细人设说明"
          />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-select v-model="personaForm.platform" placeholder="选择平台">
            <el-option label="小红书" value="xiaohongshu" />
            <el-option label="抖音" value="douyin" />
            <el-option label="微博" value="weibo" />
            <el-option label="B站" value="bilibili" />
          </el-select>
        </el-form-item>
        <el-form-item label="类目" prop="category">
          <el-select v-model="personaForm.category" placeholder="选择类目">
            <el-option label="美妆" value="beauty" />
            <el-option label="穿搭" value="fashion" />
            <el-option label="生活" value="lifestyle" />
            <el-option label="美食" value="food" />
            <el-option label="旅行" value="travel" />
            <el-option label="健身" value="fitness" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreatePersona">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="showImportDialog" title="批量导入人设" width="600px">
      <div class="import-section">
        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          accept=".xlsx,.xls,.csv"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .xlsx/.xls/.csv 格式文件，<el-link>下载模板</el-link>
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary">开始导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, UploadFilled } from '@element-plus/icons-vue'
import * as personaAPI from '@/api/persona'
import type { Persona, PersonaQuery } from '@/api/persona'

// 数据状态
const loading = ref(false)
const personas = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 对话框状态
const showCreateDialog = ref(false)
const showImportDialog = ref(false)

// 表单引用
const personaFormRef = ref()

// 筛选表单
const filterForm = reactive({
  platform: '',
  category: '',
  search: ''
})

// 人设表单
const personaForm = reactive({
  nickname: '',
  avatar: '',
  brief: '',
  description: '',
  platform: '',
  category: ''
})

const personaRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  brief: [{ required: true, message: '请输入身份简介', trigger: 'blur' }],
  description: [{ required: true, message: '请输入人设说明', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  category: [{ required: true, message: '请选择类目', trigger: 'change' }]
}


// 方法
const loadPersonas = async () => {
  loading.value = true
  try {
    const params: PersonaQuery = {
      page: currentPage.value,
      limit: pageSize.value,
      platform: filterForm.platform || undefined,
      category: filterForm.category || undefined,
      search: filterForm.search || undefined
    }
    
    const response = await personaAPI.getPersonas(params)
    
    if (response.success) {
      personas.value = response.data.personas || []
      total.value = response.data.pagination?.total || 0
    } else {
      personas.value = []
      total.value = 0
      ElMessage.error(response.message || '获取人设列表失败')
    }
  } catch (error: any) {
    console.error('获取人设列表失败:', error)
    personas.value = []
    total.value = 0
    ElMessage.error('连接后端失败，请检查网络连接或联系管理员')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  Object.assign(filterForm, {
    platform: '',
    category: '',
    search: ''
  })
  loadPersonas()
}

const getPlatformText = (platform: string) => {
  const platformMap: Record<string, string> = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    weibo: '微博',
    bilibili: 'B站'
  }
  return platformMap[platform] || platform
}

const getCategoryText = (category: string) => {
  const categoryMap: Record<string, string> = {
    beauty: '美妆',
    fashion: '穿搭',
    lifestyle: '生活',
    food: '美食',
    travel: '旅行',
    fitness: '健身'
  }
  return categoryMap[category] || category
}



const handleCreatePersona = async () => {
  // 先进行表单验证
  if (!personaFormRef.value) return
  
  try {
    const valid = await personaFormRef.value.validate()
    if (!valid) {
      ElMessage.warning('请完整填写表单信息')
      return
    }
  } catch (error) {
    ElMessage.warning('请检查表单填写是否正确')
    return
  }
  
  try {
    const personaData: Persona = {
      nickname: personaForm.nickname,
      avatar: personaForm.avatar || undefined, // 如果为空字符串则传undefined
      brief: personaForm.brief,
      description: personaForm.description,
      platform: personaForm.platform,
      category: personaForm.category
    }
    
    console.log('提交的人设数据:', personaData)
    
    const response = await personaAPI.createPersona(personaData)
    console.log('API响应:', response)
    
    if (response.success) {
      ElMessage.success('人设创建成功')
      showCreateDialog.value = false
      
      // 重置表单
      Object.assign(personaForm, {
        nickname: '',
        avatar: '',
        brief: '',
        description: '',
        platform: '',
        category: ''
      })
      
      // 重置表单验证状态
      personaFormRef.value?.resetFields()
      
      loadPersonas()
    } else {
      ElMessage.error(response.message || '人设创建失败')
    }
  } catch (error: any) {
    console.error('人设创建失败详情:', {
      error,
      message: error.message,
      response: error.response,
      config: error.config
    })
    
    // 如果是网络连接问题，提供更具体的提示
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      ElMessage.error('无法连接到后端服务器，请确保：\n1. 后端服务已启动\n2. 服务运行在端口5001\n3. 数据库连接正常')
    } else if (error.response) {
      // 服务器返回了错误响应
      ElMessage.error(`服务器错误: ${error.response.data?.message || error.message}`)
    } else {
      ElMessage.error(`人设创建失败: ${error.message}`)
    }
  }
}

onMounted(() => {
  loadPersonas()
})
</script>

<style scoped>
.personas-page {
  padding: 0;
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: hidden;
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

.filter-card {
  margin-bottom: 24px;
}

.personas-grid {
  display: grid;
  grid-template-columns: repeat(6, 250px);
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
  margin-left: 0;
  padding-left: 0;
  min-height: 200px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.persona-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  width: 250px;
}

.persona-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.persona-content {
  text-align: center;
}

.avatar-section {
  margin-bottom: 12px;
}

.nickname {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.brief {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.description {
  font-size: 11px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.5;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tag-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-label {
  font-size: 11px;
  color: #909399;
}



.pagination {
  text-align: center;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  display: block;
}

.import-section {
  margin: 20px 0;
}

@media (max-width: 1200px) {
  .personas-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .personas-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .personas-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>