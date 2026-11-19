import { PartialType } from '@nestjs/mapped-types'
import { PaginationDto } from '@/common'
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Min } from 'class-validator'

/** 新增公告 */
export class CreateNoticeDto {
  @IsNotEmpty({ message: '公告标题不能为空' })
  @Length(1, 100, { message: '公告标题长度不能超过 100 个字符' })
  title: string

  @IsNotEmpty({ message: '公告内容不能为空' })
  @IsString()
  @Length(1, 20000, { message: '公告内容长度不能超过 20000 个字符' })
  content: string

  @IsOptional()
  @IsInt({ message: '排序必须是整数' })
  @Min(1, { message: '排序不能小于 1' })
  sort: number

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string
}

/** 编辑公告 */
export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {
  @IsNotEmpty({ message: '公告 ID 不能为空' })
  id: string
}

/** 公告分页查询 */
export class QueryNoticeDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword: string

  @IsOptional()
  @IsString()
  status: string
}
