import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 改枪码实体
 * @description 用户提交的枪械改装码，按「武器分类 + 枪械」归档，管理员可标记精选
 */
@Entity({ name: 'gun_code' })
@Index('idx_gun_code_type', ['dictType', 'gunValue'])
@Index('idx_gun_code_user', ['userId'])
@Index('idx_gun_code_featured', ['isFeatured'])
export class GunCodeEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'dict_type', type: 'varchar', length: 100, comment: '武器分类编码（sys_dict_type.dict_type）' })
  dictType: string

  @Column({ name: 'gun_value', type: 'varchar', length: 100, comment: '枪械字典值（sys_dict_data.dict_value）' })
  gunValue: string

  @Column({ name: 'gun_label', type: 'varchar', length: 100, comment: '枪械名称快照（字典改名前后的历史数据仍可正确展示）' })
  gunLabel: string

  @Column({ name: 'code', type: 'varchar', length: 500, comment: '改枪码' })
  code: string

  @Column({ name: 'remark', type: 'varchar', length: 200, comment: '备注', nullable: true })
  remark: string

  @Column({ name: 'user_id', type: 'varchar', length: 36, comment: '提交人 ID' })
  userId: string

  @Column({ name: 'username', type: 'varchar', length: 20, comment: '提交人账号快照' })
  username: string

  @Column({ name: 'is_featured', type: 'char', length: 1, comment: '是否精选（1 是 0 否）', default: CommonConstant.STATUS_DISABLE })
  isFeatured: string

  @Column({ name: 'featured_by', type: 'varchar', length: 36, comment: '精选操作人', nullable: true })
  featuredBy: string

  @Column({ name: 'featured_time', type: 'datetime', comment: '精选时间', nullable: true })
  featuredTime: Date
}
