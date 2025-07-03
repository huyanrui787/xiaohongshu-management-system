import request from '@/utils/request'

export interface Device {
  id?: number
  phone?: string
  phoneNumber?: string // for display compatibility
  cardHolder: string
  serialNumber: string
  boundAccountId?: number
  remark?: string
  status?: string
  lastOnlineTime?: Date
  boundAccount?: any
}

export interface DeviceQuery {
  page?: number
  limit?: number
  status?: string
  bindStatus?: string
  search?: string
}

// 获取设备列表
export function getDevices(params: DeviceQuery) {
  return request({
    url: '/devices',
    method: 'get',
    params
  })
}

// 获取单个设备详情
export function getDevice(id: number) {
  return request({
    url: `/devices/${id}`,
    method: 'get'
  })
}

// 创建设备
export function createDevice(data: Device) {
  return request({
    url: '/devices',
    method: 'post',
    data
  })
}

// 更新设备
export function updateDevice(id: number, data: Partial<Device>) {
  return request({
    url: `/devices/${id}`,
    method: 'put',
    data
  })
}

// 删除设备
export function deleteDevice(id: number) {
  return request({
    url: `/devices/${id}`,
    method: 'delete'
  })
}

// 绑定账号
export function bindAccount(id: number, accountId: number) {
  return request({
    url: `/devices/${id}/bind`,
    method: 'post',
    data: { accountId }
  })
}

// 解绑账号
export function unbindAccount(id: number) {
  return request({
    url: `/devices/${id}/unbind`,
    method: 'post'
  })
}

// 控制设备状态
export function startDevice(id: number) {
  return request({
    url: `/devices/${id}/start`,
    method: 'post'
  })
}

export function stopDevice(id: number) {
  return request({
    url: `/devices/${id}/stop`,
    method: 'post'
  })
}

export function restartDevice(id: number) {
  return request({
    url: `/devices/${id}/restart`,
    method: 'post'
  })
}

// 批量操作
export function batchOperation(data: {
  deviceIds: number[]
  operation: string
  data?: any
}) {
  return request({
    url: '/devices/batch',
    method: 'post',
    data
  })
}

// 获取设备统计
export function getDeviceStats() {
  return request({
    url: '/devices/stats',
    method: 'get'
  })
}