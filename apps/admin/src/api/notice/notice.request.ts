import { request } from '@/utils/request'
import type { Notice } from '@/types'

export class NoticeRequest {
  /** 公告分页列表 */
  static findList(params: Notice.NoticeQuery): Promise<PaginationResult<Notice.NoticeItem>> {
    return request.get('/notice/list', { params })
  }

  /** 新增公告 */
  static create(data: Notice.NoticeForm): Promise<string> {
    return request.post('/notice/create', data)
  }

  /** 编辑公告 */
  static update(data: Notice.NoticeForm): Promise<string> {
    return request.put('/notice/update', data)
  }

  /** 删除公告 */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/notice/delete', { params })
  }
}
