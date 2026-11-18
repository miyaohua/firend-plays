import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 广告实体
 * @description 桌面端广告位内容，支持图片/文字两种形式、多条轮播、排期与曝光点击统计
 */
@Entity({ name: 'sys_ad' })
@Index('idx_sys_ad_position', ['position', 'status', 'sort'])
export class AdEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100, comment: '广告标题' })
  title: string

  @Column({ type: 'varchar', length: 50, default: 'desktop-slot', comment: '展示位置标识' })
  position: string

  @Column({ name: 'content_type', type: 'char', length: 1, default: 'I', comment: '内容类型（I 图片 / T 文字）' })
  contentType: string

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true, comment: '图片地址（相对 uploads 路径）' })
  imageUrl: string

  @Column({ name: 'link_url', type: 'varchar', length: 500, nullable: true, comment: '点击跳转地址，为空则不可点击' })
  linkUrl: string

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '文字广告内容' })
  text: string

  @Column({ type: 'int', default: 1, comment: '排序（越小越靠前）' })
  sort: number

  @Column({ type: 'char', length: 1, default: CommonConstant.STATUS_NORMAL, comment: '状态（1 启用 / 0 停用）' })
  status: string

  @Column({ name: 'start_time', type: 'datetime', nullable: true, comment: '展示开始时间，为空表示不限' })
  startTime: Date

  @Column({ name: 'end_time', type: 'datetime', nullable: true, comment: '展示结束时间，为空表示不限' })
  endTime: Date

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '备注' })
  remark: string

  @Column({ name: 'view_count', type: 'int', default: 0, comment: '曝光次数' })
  viewCount: number

  @Column({ name: 'click_count', type: 'int', default: 0, comment: '点击次数' })
  clickCount: number
}
