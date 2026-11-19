import { request } from '@/utils/request'
import type { Gun } from '@/types'

export class GunCodeRequest {
  /** 分类与枪械选项（页面左右导航用） */
  static getOptions(): Promise<Gun.TypeOption[]> {
    return request.get('/gun/code/options')
  }

  /** 分页查询改枪码 */
  static findList(params: Gun.CodeQuery): Promise<PaginationResult<Gun.CodeItem>> {
    return request.get('/gun/code/list', { params })
  }

  /** 提交改枪码 */
  static create(data: Gun.CodeForm): Promise<string> {
    return request.post('/gun/code/create', data)
  }

  /** 修改改枪码 */
  static update(data: Gun.CodeForm): Promise<string> {
    return request.put('/gun/code/update', data)
  }

  /** 删除改枪码（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/gun/code/delete', { params })
  }

  /** 精选 / 取消精选（仅超管） */
  static setFeatured(data: { id: string; isFeatured: string }): Promise<string> {
    return request.put('/gun/code/featured', data)
  }

  /** 反馈列表 */
  static findFeedbackList(params: Gun.FeedbackQuery): Promise<PaginationResult<Gun.FeedbackItem>> {
    return request.get('/gun/code/feedback/list', { params })
  }

  /** 处理反馈 */
  static handleFeedback(data: { id: string; status: string; remark?: string }): Promise<string> {
    return request.put('/gun/code/feedback/handle', data)
  }

  /** 公开数据概览（无需登录） */
  static findStatistics(): Promise<Gun.Statistics> {
    return request.get('/gun/code/statistics')
  }

  /** 公开精选列表（无需登录） */
  static findFeatured(): Promise<Gun.FeaturedGroup[]> {
    return request.get('/gun/code/featured')
  }
}
