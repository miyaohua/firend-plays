import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { BusinessType, Operlog, PaginationPipe, Public, RequirePermissions } from '@/common'
import { NoticeService } from './notice.service'
import { CreateNoticeDto, QueryNoticeDto, UpdateNoticeDto } from './notice.dto'

@Controller('notice')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  /** 公开：启用中的公告（桌面端公告区） */
  @Public()
  @Get('active')
  public findActive() {
    return this.noticeService.findActive()
  }

  /** 管理端分页列表 */
  @Get('list')
  @RequirePermissions(['notice:query'])
  public findList(@Query(PaginationPipe) queryParams: QueryNoticeDto) {
    return this.noticeService.findList(queryParams)
  }

  /** 新增公告 */
  @Post('create')
  @RequirePermissions(['notice:create'])
  @Operlog({ title: '公告管理', businessType: BusinessType.INSERT })
  public create(@Body() createDto: CreateNoticeDto) {
    return this.noticeService.create(createDto)
  }

  /** 编辑公告 */
  @Put('update')
  @RequirePermissions(['notice:update'])
  @Operlog({ title: '公告管理', businessType: BusinessType.UPDATE })
  public update(@Body() updateDto: UpdateNoticeDto) {
    return this.noticeService.update(updateDto)
  }

  /** 删除公告 */
  @Delete('delete')
  @RequirePermissions(['notice:delete'])
  @Operlog({ title: '公告管理', businessType: BusinessType.DELETE })
  public delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.noticeService.delete(ids)
  }
}
