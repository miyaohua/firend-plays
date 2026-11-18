/** 改枪码列表项 */
export interface CodeItem extends BaseEntity {
  id: string
  /** 武器分类编码 */
  dictType: string
  /** 枪械字典值 */
  gunValue: string
  /** 枪械名称快照 */
  gunLabel: string
  /** 改枪码 */
  code: string
  /** 备注 */
  remark: string | null
  /** 提交人账号（非本人且非超管时为打码值） */
  username: string
  /** 是否为当前登录人提交 */
  isMine: boolean
  /** 是否精选（1 是 / 0 否） */
  isFeatured: string
  /** 精选时间 */
  featuredTime: string | null
  createTime: string
}

/** 改枪码分页查询参数 */
export interface CodeQuery {
  pageNo: number
  pageSize: number
  dictType?: string
  gunValue?: string
  /** 查看范围：mine 我的 / featured 精选 / all 全部（仅超管生效） */
  scope?: string
  /** 关键词：匹配改枪码或备注 */
  keyword?: string
}

/** 改枪码表单 */
export interface CodeForm {
  id?: string
  dictType?: string
  gunValue?: string
  code?: string
  remark?: string
}

/** 单个枪械选项 */
export interface GunOption {
  label: string
  value: string
}

/** 武器分类 + 其下枪械选项 */
export interface TypeOption {
  dictType: string
  dictName: string
  guns: GunOption[]
}

/** 公开精选：单条改枪码 */
export interface FeaturedCode {
  id: string
  code: string
  remark: string | null
  /** 提交人（已打码） */
  author: string
  featuredTime: string | null
}

/** 公开精选：按枪械聚合 */
export interface FeaturedGun {
  gunValue: string
  gunLabel: string
  codes: FeaturedCode[]
}

/** 公开精选：按分类聚合 */
export interface FeaturedGroup {
  dictType: string
  dictName: string
  guns: FeaturedGun[]
}

/** 公开统计：单个武器分类 */
export interface StatisticsType {
  dictType: string
  dictName: string
  /** 该分类下的枪械数量 */
  gunCount: number
  /** 该分类下的精选码数量 */
  featuredCount: number
}

/** 公开统计数据概览（首页与精选页共用） */
export interface Statistics {
  /** 改枪码总数 */
  totalCodes: number
  /** 精选码总数 */
  featuredCodes: number
  /** 武器分类数量 */
  typeCount: number
  /** 枪械数量 */
  gunCount: number
  types: StatisticsType[]
}

