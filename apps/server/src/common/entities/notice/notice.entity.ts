import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 公告实体
 * @description 运营公告，桌面端公告区展示启用中的公告
 */
@Entity({ name: 'sys_notice' })
@Index('idx_sys_notice_status', ['status', 'sort'])
export class NoticeEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100, comment: '公告标题' })
  title: string

  @Column({ type: 'text', comment: '公告内容' })
  content: string

  @Column({ type: 'int', default: 1, comment: '排序（越小越靠前）' })
  sort: number

  @Column({ type: 'char', length: 1, default: CommonConstant.STATUS_NORMAL, comment: '状态（1 启用 / 0 停用）' })
  status: string
}
