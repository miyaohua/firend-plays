import { BaseEntity } from '../base.entity'
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 改枪码收藏实体
 * @description 记录「用户 - 改枪码」的收藏关系，同一用户对同一改枪码只允许一条记录
 */
@Entity({ name: 'gun_code_favorite' })
@Index('uk_gun_code_favorite_user_code', ['userId', 'codeId'], { unique: true })
@Index('idx_gun_code_favorite_code', ['codeId'])
export class GunCodeFavoriteEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'varchar', length: 36, comment: '收藏人 ID' })
  userId: string

  @Column({ name: 'code_id', type: 'varchar', length: 36, comment: '被收藏的改枪码 ID' })
  codeId: string
}
