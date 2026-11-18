import { PartialType } from '@nestjs/mapped-types'
import { PaginationDto } from '@/common'
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength, Min } from 'class-validator'

/** 新增广告 */
export class CreateAdDto {
  @IsNotEmpty({ message: '广告标题不能为空' })
  @Length(1, 100, { message: '广告标题长度不能超过 100 个字符' })
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '展示位置长度不能超过 50 个字符' })
  position: string

  @IsIn(['I', 'T'], { message: '内容类型仅支持 I（图片）或 T（文字）' })
  contentType: string

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '图片地址长度不能超过 255 个字符' })
  imageUrl: string

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '跳转地址长度不能超过 500 个字符' })
  linkUrl: string

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '文字内容长度不能超过 200 个字符' })
  text: string

  @IsOptional()
  @IsInt({ message: '排序必须是整数' })
  @Min(1, { message: '排序不能小于 1' })
  sort: number

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string

  @IsOptional()
  @IsString()
  startTime: string

  @IsOptional()
  @IsString()
  endTime: string

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '备注长度不能超过 200 个字符' })
  remark: string
}

/** 编辑广告 */
export class UpdateAdDto extends PartialType(CreateAdDto) {
  @IsNotEmpty({ message: '广告 ID 不能为空' })
  id: string
}

/** 广告分页查询 */
export class QueryAdDto extends PaginationDto {
  @IsOptional()
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  position: string

  // 前端未选择时传空字符串，不能用正则强校验，服务端只对非空值过滤
  @IsOptional()
  @IsString()
  status: string
}

/** 曝光 / 点击上报 */
export class ReportAdDto {
  @IsNotEmpty({ message: '广告 ID 不能为空' })
  @Length(1, 36, { message: '广告 ID 长度不能超过 36 个字符' })
  id: string
}
