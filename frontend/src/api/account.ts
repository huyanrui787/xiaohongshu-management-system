import request from '@/utils/request'

export interface Account {
  id?: number
  accountId: string
  nickname: string
  avatar: string
  username?: string
  followersCount?: number
  notesCount?: number
  platform?: string
  status?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AccountQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
}

// 获取账号列表
export function getAccounts(params: AccountQuery) {
  return request({
    url: '/accounts',
    method: 'get',
    params
  })
}

// 创建账号
export function createAccount(data: Account) {
  return request({
    url: '/accounts',
    method: 'post',
    data
  })
}

// 更新账号
export function updateAccount(id: number, data: Partial<Account>) {
  return request({
    url: `/accounts/${id}`,
    method: 'put',
    data
  })
}

// 删除账号
export function deleteAccount(id: number) {
  return request({
    url: `/accounts/${id}`,
    method: 'delete'
  })
}

// 获取账号详情
export function getAccountDetail(id: number) {
  return request({
    url: `/accounts/${id}`,
    method: 'get'
  })
}