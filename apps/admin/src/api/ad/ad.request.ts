import { request } from '@/utils/request'
import type { Ad } from '@/types'

export class AdRequest {
  /** 广告分页列表 */
  static findList(params: Ad.AdQuery): Promise<PaginationResult<Ad.AdItem>> {
    return request.get('/ad/list', { params })
  }

  /** 新增广告 */
  static create(data: Ad.AdForm): Promise<string> {
    return request.post('/ad/create', data)
  }

  /** 编辑广告 */
  static update(data: Ad.AdForm): Promise<string> {
    return request.put('/ad/update', data)
  }

  /** 删除广告（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/ad/delete', { params })
  }
}
