<template>
  <div class="devices-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>设备管理</h1>
        <p>管理账号绑定设备，监控设备运行状态</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><plus /></el-icon>
          添加设备
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
        <el-form-item label="运行状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="异常" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定状态">
          <el-select v-model="filterForm.bindStatus" placeholder="全部状态" clearable>
            <el-option label="已绑定" value="bound" />
            <el-option label="未绑定" value="unbound" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input 
            v-model="filterForm.search" 
            placeholder="手机号/持卡人/序列号"
            @keyup.enter="loadDevices"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDevices">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作栏 -->
    <div class="batch-actions" v-show="selectedDevices.length > 0">
      <div class="selected-info">
        已选择 {{ selectedDevices.length }} 台设备
      </div>
      <div class="actions">
        <el-button size="small" @click="batchBind">批量绑定</el-button>
        <el-button size="small" @click="batchUnbind">批量解绑</el-button>
        <el-button size="small" type="warning" @click="batchDisable">批量禁用</el-button>
        <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 设备列表 -->
    <el-card class="table-card">
      <div class="table-wrapper">
        <el-table 
          :data="devices" 
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          table-layout="fixed"
        >
        <template #empty>
          <el-empty description="暂无设备数据" />
        </template>
        <el-table-column type="selection" width="55" />
        <el-table-column label="设备运行状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              <el-icon style="margin-right: 4px;">
                <circle-check v-if="row.status === 'online'" />
                <circle-close v-else-if="row.status === 'offline'" />
                <warning-filled v-else />
              </el-icon>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="140">
          <template #default="{ row }">
            <span class="phone-number">{{ row.phone || row.phoneNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column label="持卡人" width="120">
          <template #default="{ row }">
            {{ row.cardHolder }}
          </template>
        </el-table-column>
        <el-table-column label="序列号" width="200">
          <template #default="{ row }">
            <span class="serial-number">{{ row.serialNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column label="绑定的账号" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.boundAccount">
              <div class="bound-account">
                <el-avatar :size="32" :src="row.boundAccount.avatar" />
                <div class="account-info">
                  <div class="nickname">{{ row.boundAccount.nickname }}</div>
                  <div class="username">@{{ row.boundAccount.username }}</div>
                </div>
              </div>
            </div>
            <el-tag v-else type="info" size="small">未绑定</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后上线时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.lastOnlineTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="viewDevice(row)">详情</el-button>
            <el-button link size="small" @click="editDevice(row)">编辑</el-button>
            <el-button 
              link 
              size="small" 
              @click="toggleBind(row)"
              :type="row.boundAccount ? 'warning' : 'primary'"
            >
              {{ row.boundAccount ? '解绑' : '绑定' }}
            </el-button>
            <el-button link size="small" type="danger" @click="deleteDevice(row)">删除</el-button>
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
          @size-change="loadDevices"
          @current-change="loadDevices"
        />
      </div>
    </el-card>

    <!-- 添加设备对话框 -->
    <el-dialog v-model="showAddDialog" title="添加设备" width="600px">
      <el-form :model="deviceForm" :rules="deviceRules" ref="deviceFormRef" label-width="100px">
        <el-form-item label="手机号" prop="phoneNumber">
          <el-input v-model="deviceForm.phoneNumber" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="持卡人" prop="cardHolder">
          <el-input v-model="deviceForm.cardHolder" placeholder="请输入持卡人姓名" />
        </el-form-item>
        <el-form-item label="序列号" prop="serialNumber">
          <el-input v-model="deviceForm.serialNumber" placeholder="请输入设备序列号" />
        </el-form-item>
        <el-form-item label="绑定账号">
          <el-select v-model="deviceForm.boundAccountId" placeholder="选择要绑定的账号" clearable>
            <el-option 
              v-for="account in availableAccounts" 
              :key="account.id"
              :label="`${account.nickname} (@${account.username})`"
              :value="account.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="deviceForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="设备备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddDevice">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="showImportDialog" title="批量导入设备" width="600px">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, UploadFilled, CircleCheck, CircleClose, WarningFilled } from '@element-plus/icons-vue'
import * as deviceAPI from '@/api/device'
import type { Device, DeviceQuery } from '@/api/device'

// 数据状态
const loading = ref(false)
const devices = ref<any[]>([])
const selectedDevices = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 可用账号列表 - 从API获取
const availableAccounts = ref([])

// 对话框状态
const showAddDialog = ref(false)
const showImportDialog = ref(false)

// 筛选表单
const filterForm = reactive({
  status: '',
  bindStatus: '',
  search: ''
})

// 设备表单
const deviceForm = reactive({
  phoneNumber: '',
  cardHolder: '',
  serialNumber: '',
  boundAccountId: null,
  remark: ''
})

const deviceRules = {
  phoneNumber: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  cardHolder: [{ required: true, message: '请输入持卡人姓名', trigger: 'blur' }],
  serialNumber: [{ required: true, message: '请输入设备序列号', trigger: 'blur' }]
}


// 方法
const loadAvailableAccounts = async () => {
  try {
    // 这里应该调用账号API来获取可用账号列表
    // 暂时先使用空数组，后续可以根据实际需求添加账号API调用
    availableAccounts.value = []
  } catch (error) {
    console.error('获取可用账号失败:', error)
    availableAccounts.value = []
  }
}

const loadDevices = async () => {
  loading.value = true
  try {
    const params: DeviceQuery = {
      page: currentPage.value,
      limit: pageSize.value,
      status: filterForm.status || undefined,
      search: filterForm.search || undefined
    }
    
    if (filterForm.bindStatus) {
      params.bindStatus = filterForm.bindStatus
    }
    
    console.log('加载设备列表参数:', params)
    
    const response = await deviceAPI.getDevices(params)
    console.log('设备列表API响应:', response)
    
    if (response.success) {
      devices.value = response.data.devices || []
      total.value = response.data.pagination?.total || 0
      console.log('设备列表已更新:', devices.value.length, '个设备')
    } else {
      devices.value = []
      total.value = 0
      ElMessage.error(response.message || '获取设备列表失败')
    }
  } catch (error: any) {
    console.error('获取设备列表失败:', error)
    devices.value = []
    total.value = 0
    ElMessage.error('连接后端失败，请检查网络连接或联系管理员')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  Object.assign(filterForm, {
    status: '',
    bindStatus: '',
    search: ''
  })
  loadDevices()
}

const handleSelectionChange = (selection: any[]) => {
  selectedDevices.value = selection
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    online: 'success',
    offline: 'info',
    error: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    error: '异常'
  }
  return statusMap[status] || status
}

const formatTime = (time: Date | string | null | undefined) => {
  if (!time) {
    return '从未上线'
  }
  
  try {
    const timeDate = new Date(time)
    if (isNaN(timeDate.getTime())) {
      return '时间格式错误'
    }
    
    const now = new Date()
    const diff = now.getTime() - timeDate.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else {
      return `${days}天前`
    }
  } catch (error) {
    console.error('时间格式化错误:', error, time)
    return '时间错误'
  }
}

const viewDevice = (device: any) => {
  ElMessage.info(`查看设备: ${device.serialNumber}`)
}

const editDevice = (device: any) => {
  ElMessage.info(`编辑设备: ${device.serialNumber}`)
}

const toggleBind = async (device: any) => {
  if (device.boundAccount) {
    // 解绑
    try {
      await ElMessageBox.confirm(`确认解绑设备 "${device.serialNumber}" 的账号绑定吗？`, '解绑确认', {
        type: 'warning'
      })
      // TODO: 调用真实的解绑API
      ElMessage.success('解绑成功')
      // 重新加载设备列表而不是直接修改数据
      loadDevices()
    } catch {
      // 用户取消
    }
  } else {
    // 绑定
    ElMessage.info('请选择要绑定的账号')
  }
}

const deleteDevice = async (device: any) => {
  try {
    await ElMessageBox.confirm(`确认删除设备 "${device.serialNumber}" 吗？`, '删除确认', {
      type: 'warning'
    })
    // TODO: 调用真实的删除API
    ElMessage.success('删除成功')
    loadDevices()
  } catch (error) {
    console.error('删除设备出错:', error)
    // 用户取消或其他错误
  }
}

const batchBind = () => {
  try {
    ElMessage.info('批量绑定功能')
  } catch (error) {
    console.error('批量绑定出错:', error)
  }
}

const batchUnbind = () => {
  try {
    ElMessage.info('批量解绑功能')
  } catch (error) {
    console.error('批量解绑出错:', error)
  }
}

const batchDisable = async () => {
  try {
    await ElMessageBox.confirm(`确认批量禁用 ${selectedDevices.value.length} 台设备吗？`, '批量禁用', {
      type: 'warning'
    })
    ElMessage.success('批量禁用成功')
  } catch (error) {
    console.error('批量禁用出错:', error)
    // 用户取消或其他错误
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认批量删除 ${selectedDevices.value.length} 台设备吗？`, '批量删除', {
      type: 'warning'
    })
    ElMessage.success('批量删除成功')
    loadDevices()
  } catch (error) {
    console.error('批量删除出错:', error)
    // 用户取消或其他错误
  }
}

const handleAddDevice = async () => {
  try {
    const deviceData: Device = {
      phone: deviceForm.phoneNumber,
      cardHolder: deviceForm.cardHolder,
      serialNumber: deviceForm.serialNumber,
      boundAccountId: deviceForm.boundAccountId || undefined,
      remark: deviceForm.remark
    }
    
    console.log('提交的设备数据:', deviceData)
    
    const response = await deviceAPI.createDevice(deviceData)
    console.log('API响应:', response)
    
    if (response.success) {
      ElMessage.success('设备添加成功')
      showAddDialog.value = false
      
      // 重置表单
      Object.assign(deviceForm, {
        phoneNumber: '',
        cardHolder: '',
        serialNumber: '',
        boundAccountId: null,
        remark: ''
      })
      
      // 重置到第一页并重新加载数据
      currentPage.value = 1
      
      // 添加小延迟确保数据库操作完成
      setTimeout(() => {
        loadDevices()
      }, 100)
    } else {
      ElMessage.error(response.message || '设备添加失败')
    }
  } catch (error: any) {
    console.error('设备添加失败详情:', {
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
      ElMessage.error(`设备添加失败: ${error.message}`)
    }
  }
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
  loadDevices()
}

onMounted(() => {
  console.log('Devices组件已挂载')
  loadDevices()
  loadAvailableAccounts()
})

onActivated(() => {
  console.log('Devices组件已激活')
  loadDevices()
  loadAvailableAccounts()
})

onUpdated(() => {
  console.log('Devices组件已更新')
})
</script>

<style scoped>
.devices-page {
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
  min-width: 1195px; /* 表格最小宽度 */
}

.phone-number {
  font-family: monospace;
  font-weight: 500;
}

.serial-number {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
}

.bound-account {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-info .nickname {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
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
</style>