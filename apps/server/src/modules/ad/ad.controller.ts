import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { AdService } from './ad.service'
import { BusinessType, Operlog, PaginationPipe, Public, RequirePermissions } from '@/common'
import { CreateAdDto, QueryAdDto, ReportAdDto, UpdateAdDto } from './ad.dto'

@Controller('ad')
export class AdController {
  constructor(private readonly adService: AdService) {}

  /** 公开：按位置取当前生效的广告（客户端轮播用） */
  @Public()
  @Get('current')
  public findCurrent(@Query('position') position = 'desktop-slot') {
    return this.adService.findCurrent(position)
  }

  /** 公开：曝光上报 */
  @Public()
  @Post('view')
  public recordView(@Body() reportDto: ReportAdDto) {
    return this.adService.recordView(reportDto.id)
  }

  /** 公开：点击上报 */
  @Public()
  @Post('click')
  public recordClick(@Body() reportDto: ReportAdDto) {
    return this.adService.recordClick(reportDto.id)
  }

  /** 管理端分页列表 */
  @Get('list')
  @RequirePermissions(['ad:query'])
  public findList(@Query(PaginationPipe) queryParams: QueryAdDto) {
    return this.adService.findList(queryParams)
  }

  /** 新增广告 */
  @Post('create')
  @RequirePermissions(['ad:create'])
  @Operlog({ title: '广告管理', businessType: BusinessType.INSERT })
  public create(@Body() createDto: CreateAdDto) {
    return this.adService.create(createDto)
  }

  /** 编辑广告 */
  @Put('update')
  @RequirePermissions(['ad:update'])
  @Operlog({ title: '广告管理', businessType: BusinessType.UPDATE })
  public update(@Body() updateDto: UpdateAdDto) {
    return this.adService.update(updateDto)
  }

  /** 删除广告 */
  @Delete('delete')
  @RequirePermissions(['ad:delete'])
  @Operlog({ title: '广告管理', businessType: BusinessType.DELETE })
  public delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.adService.delete(ids)
  }
}
