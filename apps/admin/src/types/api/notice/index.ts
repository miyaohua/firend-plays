/** 公告列表项 */
export interface NoticeItem extends BaseEntity {
  id: string
  title: string
  content: string
  sort: number
  status: string
  createTime: string
}

/** 公告分页查询 */
export interface NoticeQuery {
  pageNo: number
  pageSize: number
  keyword?: string
  status?: string
}

/** 公告表单 */
export type NoticeForm = Partial<NoticeItem>
