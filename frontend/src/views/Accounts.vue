<template>
  <div class="accounts-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>账号管理</h1>
        <p>管理小红书账号，支持批量操作</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><plus /></el-icon>
          添加账号
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
        <el-form-item label="搜索">
          <el-input 
            v-model="filterForm.search" 
            placeholder="账号昵称/用户名"
            @keyup.enter="loadAccounts"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAccounts">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作栏 -->
    <div class="batch-actions" v-show="selectedAccounts.length > 0">
      <div class="selected-info">
        已选择 {{ selectedAccounts.length }} 个账号
      </div>
      <div class="actions">
        <el-button size="small" @click="batchSync">同步数据</el-button>
        <el-button size="small" type="warning" @click="batchDisable">批量禁用</el-button>
        <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 账号列表 -->
    <el-card class="table-card">
      <div class="table-wrapper">
        <el-table 
          :data="accounts" 
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          table-layout="fixed"
        >
        <el-table-column type="selection" width="55" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :alt="row.nickname" />
          </template>
        </el-table-column>
        <el-table-column label="账号信息" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="account-info">
              <div class="nickname">{{ row.nickname }}</div>
              <div class="username">@{{ row.username }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="粉丝数" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.followersCount) }}
          </template>
        </el-table-column>
        <el-table-column label="笔记数" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.notesCount) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="viewAccount(row)">详情</el-button>
            <el-button link size="small" @click="editAccount(row)">编辑</el-button>
            <el-button link size="small" type="danger" @click="deleteAccount(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadAccounts"
          @current-change="loadAccounts"
        />
      </div>
    </el-card>

    <!-- 添加账号对话框 -->
    <el-dialog v-model="showAddDialog" title="添加账号" width="500px">
      <el-form :model="accountForm" :rules="accountRules" ref="accountFormRef" label-width="80px">
        <el-form-item label="账号ID" prop="accountId">
          <el-input v-model="accountForm.accountId" placeholder="请输入小红书账号ID" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="accountForm.nickname" placeholder="请输入账号昵称" />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <div class="avatar-upload">
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              action="#"
              :auto-upload="false"
              :on-change="handleAvatarChange"
            >
              <img v-if="accountForm.avatar" :src="accountForm.avatar" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="avatar-input">
              <el-input 
                v-model="accountForm.avatar" 
                placeholder="或直接输入头像URL" 
                @input="updateAvatarPreview"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddAccount">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="showImportDialog" title="批量导入账号" width="600px">
      <div class="import-section">
        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls,.csv"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .xlsx/.xls/.csv 格式文件，<el-link @click="downloadTemplate">下载模板</el-link>
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary" @click="handleImport">开始导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, onUpdated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, UploadFilled } from '@element-plus/icons-vue'
import * as accountAPI from '@/api/account'
import type { Account, AccountQuery } from '@/api/account'

const router = useRouter()

// 数据状态
const loading = ref(false)
const accounts = ref<any[]>([])
const selectedAccounts = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 对话框状态
const showAddDialog = ref(false)
const showImportDialog = ref(false)

// 筛选表单
const filterForm = reactive({
  search: ''
})

// 账号表单
const accountForm = reactive({
  accountId: '',
  nickname: '',
  avatar: ''
})

const accountRules = {
  accountId: [{ required: true, message: '请输入账号ID', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入账号昵称', trigger: 'blur' }],
  avatar: [{ required: true, message: '请输入或上传头像', trigger: 'blur' }]
}

// 模拟数据
const mockAccounts = [
  {
    id: 1,
    nickname: '美妆达人小仙女',
    username: 'beauty_girl_123',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    followersCount: 15620,
    notesCount: 256
  },
  {
    id: 2,
    nickname: '穿搭博主',
    username: 'fashion_blogger',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    followersCount: 8943,
    notesCount: 189
  },
  {
    id: 3,
    nickname: '生活记录者',
    username: 'life_recorder',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    followersCount: 3256,
    notesCount: 98
  }
]

// 方法
const loadAccounts = async () => {
  loading.value = true
  try {
    const params: AccountQuery = {
      page: currentPage.value,
      limit: pageSize.value,
      search: filterForm.search || undefined
    }
    
    console.log('加载账号列表参数:', params)
    
    const response = await accountAPI.getAccounts(params)
    console.log('账号列表API响应:', response)
    
    if (response.success) {
      accounts.value = response.data.accounts || []
      total.value = response.data.pagination?.total || 0
      console.log('账号列表已更新:', accounts.value.length, '个账号')
    } else {
      accounts.value = []
      total.value = 0
      ElMessage.error(response.message || '获取账号列表失败')
    }
  } catch (error: any) {
    console.error('获取账号列表失败:', error)
    accounts.value = []
    total.value = 0
    ElMessage.error('连接后端失败，请检查网络连接或联系管理员')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  Object.assign(filterForm, {
    search: ''
  })
  loadAccounts()
}

const handleSelectionChange = (selection: any[]) => {
  selectedAccounts.value = selection
}


const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}


const viewAccount = (account: any) => {
  router.push(`/accounts/${account.id}/content`)
}

const editAccount = (account: any) => {
  ElMessage.info(`编辑账号: ${account.nickname}`)
}


const deleteAccount = async (account: any) => {
  try {
    await ElMessageBox.confirm(`确认删除账号 "${account.nickname}" 吗？`, '删除确认', {
      type: 'warning'
    })
    ElMessage.success(`账号 "${account.nickname}" 删除成功`)
    loadAccounts()
  } catch {
    // 用户取消
  }
}


const batchSync = async () => {
  ElMessage.success('批量同步任务已启动')
}

const batchDisable = async () => {
  try {
    await ElMessageBox.confirm(`确认批量禁用 ${selectedAccounts.value.length} 个账号吗？`, '批量禁用', {
      type: 'warning'
    })
    ElMessage.success('批量禁用成功')
  } catch {
    // 用户取消
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedAccounts.value.length} 个账号吗？`, '批量删除', {
      type: 'warning'
    })
    ElMessage.success('批量删除成功')
    loadAccounts()
  } catch {
    // 用户取消
  }
}

const handleAddAccount = async () => {
  try {
    const accountData: Account = {
      accountId: accountForm.accountId,
      nickname: accountForm.nickname,
      avatar: accountForm.avatar
    }
    
    console.log('提交的账号数据:', accountData)
    
    const response = await accountAPI.createAccount(accountData)
    console.log('API响应:', response)
    
    if (response.success) {
      ElMessage.success('账号添加成功')
      showAddDialog.value = false
      
      // 重置表单
      Object.assign(accountForm, {
        accountId: '',
        nickname: '',
        avatar: ''
      })
      
      // 重置到第一页并重新加载数据
      currentPage.value = 1
      
      // 添加小延迟确保数据库操作完成
      setTimeout(() => {
        loadAccounts()
      }, 100)
    } else {
      ElMessage.error(response.message || '账号添加失败')
    }
  } catch (error: any) {
    console.error('账号添加失败详情:', {
      error,
      message: error.message,
      response: error.response,
      config: error.config
    })
    
    // 如果是网络连接问题，提供更具体的提示
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      ElMessage.error('无法连接到后端服务器，请确保：\\n1. 后端服务已启动\\n2. 服务运行在端口5001\\n3. 数据库连接正常')
    } else if (error.response) {
      // 服务器返回了错误响应
      ElMessage.error(`服务器错误: ${error.response.data?.message || error.message}`)
    } else {
      ElMessage.error(`账号添加失败: ${error.message}`)
    }
  }
}

// 头像上传相关方法
const handleAvatarSuccess = (response: any, file: any) => {
  accountForm.avatar = URL.createObjectURL(file.raw)
}

const beforeAvatarUpload = (file: any) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

const handleAvatarChange = (file: any) => {
  if (file.raw) {
    accountForm.avatar = URL.createObjectURL(file.raw)
  }
}

const updateAvatarPreview = () => {
  // URL输入时的头像预览更新
}

const handleFileChange = (file: any) => {
  console.log('选择文件:', file)
}

const downloadTemplate = () => {
  ElMessage.info('模板下载中...')
}

const handleImport = () => {
  ElMessage.success('导入成功')
  showImportDialog.value = false
  loadAccounts()
}

onMounted(() => {
  console.log('Accounts组件已挂载')
  loadAccounts()
})

onActivated(() => {
  console.log('Accounts组件已激活')
  loadAccounts()
})

onUpdated(() => {
  console.log('Accounts组件已更新')
})
</script>

<style scoped>
.accounts-page {
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
  margin-bottom: 16px;
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

.table-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  min-width: 695px; /* 表格最小宽度 */
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

.pagination {
  margin-top: 16px;
  text-align: right;
}

.import-section {
  margin: 20px 0;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

.avatar-upload {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: .3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  border-radius: 6px;
  object-fit: cover;
}

.avatar-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-input .el-input {
  min-width: 250px;
}
</style>