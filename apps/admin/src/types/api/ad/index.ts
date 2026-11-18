/** 广告列表项 */
export interface AdItem extends BaseEntity {
  id: string
  title: string
  /** 展示位置标识 */
  position: string
  /** 内容类型：I 图片 / T 文字 */
  contentType: string
  imageUrl: string | null
  linkUrl: string | null
  text: string | null
  sort: number
  status: string
  startTime: string | null
  endTime: string | null
  remark: string | null
  /** 曝光次数 */
  viewCount: number
  /** 点击次数 */
  clickCount: number
}

/** 广告分页查询 */
export interface AdQuery {
  pageNo: number
  pageSize: number
  title?: string
  position?: string
  status?: string
}

/** 广告表单 */
export type AdForm = Partial<AdItem>
