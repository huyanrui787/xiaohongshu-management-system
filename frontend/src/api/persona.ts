import request from '@/utils/request'

export interface Persona {
  id?: number
  nickname: string
  avatar?: string
  brief: string
  description: string
  platform: string
  category: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PersonaQuery {
  page?: number
  limit?: number
  platform?: string
  category?: string
  search?: string
  sortBy?: string
  sortOrder?: string
}

// 获取人设列表
export function getPersonas(params: PersonaQuery) {
  return request({
    url: '/personas',
    method: 'get',
    params
  })
}

// 获取单个人设详情
export function getPersona(id: number) {
  return request({
    url: `/personas/${id}`,
    method: 'get'
  })
}

// 创建人设
export function createPersona(data: Persona) {
  return request({
    url: '/personas',
    method: 'post',
    data
  })
}

// 更新人设
export function updatePersona(id: number, data: Partial<Persona>) {
  return request({
    url: `/personas/${id}`,
    method: 'put',
    data
  })
}

// 删除人设
export function deletePersona(id: number) {
  return request({
    url: `/personas/${id}`,
    method: 'delete'
  })
}

// 复制人设
export function duplicatePersona(id: number) {
  return request({
    url: `/personas/${id}/duplicate`,
    method: 'post'
  })
}

// AI生成人设
export function generatePersona(data: {
  category: string
  platform?: string
  style?: string
  targetAudience?: string
  characteristics?: string[]
}) {
  return request({
    url: '/personas/generate',
    method: 'post',
    data
  })
}

// 获取人设模板
export function getPersonaTemplates(params?: {
  platform?: string
  category?: string
}) {
  return request({
    url: '/personas/templates',
    method: 'get',
    params
  })
}

// 从模板创建人设
export function createFromTemplate(data: {
  templateId: string
  customizations?: Partial<Persona>
}) {
  return request({
    url: '/personas/from-template',
    method: 'post',
    data
  })
}

// 批量操作
export function batchOperation(data: {
  personaIds: number[]
  operation: string
  data?: any
}) {
  return request({
    url: '/personas/batch',
    method: 'post',
    data
  })
}

// 获取人设统计
export function getPersonaStats() {
  return request({
    url: '/personas/stats',
    method: 'get'
  })
}