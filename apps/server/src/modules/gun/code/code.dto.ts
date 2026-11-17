import { PartialType } from '@nestjs/mapped-types'
import { PaginationDto } from '@/common'
import { IsIn, IsNotEmpty, IsOptional, Length } from 'class-validator'

/** 新增改枪码（分类与枪械由前端选择，服务端会校验其合法性） */
export class CreateGunCodeDto {
  @IsNotEmpty({ message: '武器分类不能为空' })
  @Length(1, 100, { message: '武器分类长度不能超过 100 个字符' })
  dictType: string

  @IsNotEmpty({ message: '枪械不能为空' })
  @Length(1, 100, { message: '枪械长度不能超过 100 个字符' })
  gunValue: string

  @IsNotEmpty({ message: '改枪码不能为空' })
  @Length(1, 500, { message: '改枪码长度不能超过 500 个字符' })
  code: string

  @IsOptional()
  @Length(1, 200, { message: '备注长度不能超过 200 个字符' })
  remark: string
}

/** 修改改枪码：仅允许改内容与备注，分类与枪械不可变更 */
export class UpdateGunCodeDto extends PartialType(CreateGunCodeDto) {
  @IsNotEmpty({ message: '改枪码 ID 不能为空' })
  id: string
}

/** 改枪码分页查询 */
export class QueryGunCodeDto extends PaginationDto {
  @IsOptional()
  dictType: string

  @IsOptional()
  gunValue: string

  /** 查看范围：mine 我的 / featured 精选 / all 全部（仅超管可用），普通用户固定为「我的 ∨ 精选」 */
  @IsOptional()
  @IsIn(['mine', 'featured', 'all'], { message: '查看范围取值仅限 mine / featured / all' })
  scope: string

  /** 关键词：匹配改枪码或备注 */
  @IsOptional()
  keyword: string
}

/** 精选 / 取消精选（仅超管可用） */
export class FeaturedGunCodeDto {
  @IsNotEmpty({ message: '改枪码 ID 不能为空' })
  id: string

  @IsIn(['0', '1'], { message: '精选标记仅支持 1 或 0' })
  isFeatured: string
}
