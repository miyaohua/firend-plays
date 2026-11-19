import { BaseEntity } from '../base.entity'
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 改枪码无效反馈
 * @description 用户对精选改枪码提交的「无效」反馈，管理端处理；快照枪械与内容，避免码被删除后无法追溯
 */
@Entity({ name: 'gun_code_feedback' })
@Index('uk_gun_code_feedback_user_code', ['userId', 'codeId'], { unique: true })
@Index('idx_gun_code_feedback_status', ['status'])
export class GunCodeFeedbackEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'code_id', type: 'varchar', length: 36, comment: '改枪码 ID' })
  codeId: string

  @Column({ name: 'user_id', type: 'varchar', length: 36, comment: '反馈用户 ID' })
  userId: string

  @Column({ name: 'username', type: 'varchar', length: 20, nullable: true, comment: '反馈用户账号快照' })
  username: string

  @Column({ name: 'gun_label', type: 'varchar', length: 100, nullable: true, comment: '枪械名称快照' })
  gunLabel: string

  @Column({ name: 'code', type: 'varchar', length: 500, nullable: true, comment: '改枪码内容快照' })
  code: string

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '反馈说明' })
  reason: string

  @Column({ type: 'char', length: 1, default: '0', comment: '状态（0 待处理 / 1 已处理 / 2 已忽略）' })
  status: string

  @Column({ name: 'handle_by', type: 'varchar', length: 36, nullable: true, comment: '处理人' })
  handleBy: string

  @Column({ name: 'handle_time', type: 'datetime', nullable: true, comment: '处理时间' })
  handleTime: Date

  @Column({ name: 'handle_remark', type: 'varchar', length: 200, nullable: true, comment: '处理备注' })
  handleRemark: string
}
