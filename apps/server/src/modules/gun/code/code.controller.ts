import type { AuthType } from '@/types'
import { GunCodeService } from './code.service'
import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query, Req } from '@nestjs/common'
import { BusinessType, CurrentUser, Operlog, PaginationPipe, Public, RepeatSubmit, RequirePermissions, ResponseCache } from '@/common'
import { getRequestIp } from '@/utils'
import { CreateFeedbackDto, CreateGunCodeDto, FavoriteGunCodeDto, FeaturedGunCodeDto, HandleFeedbackDto, QueryFeedbackDto, QueryGunCodeDto, UpdateGunCodeDto } from './code.dto'

@Controller('gun/code')
export class GunCodeController {
  constructor(private readonly gunCodeService: GunCodeService) {}

  /** 公开精选改枪码：无需登录，带响应缓存；精选变更时服务端主动失效缓存 */
  @Public()
  @Get('featured')
  @ResponseCache({ key: 'gun:code:featured', ttl: 120 })
  public findFeatured() {
    return this.gunCodeService.findFeaturedPublic()
  }

  /** 公开精选用户列表 */
  @Public()
  @Get('featured-users')
  public findFeaturedUsers() {
    return this.gunCodeService.findFeaturedUsers()
  }

  /** 公开精选用户详情与其改枪码 */
  @Public()
  @Get('by-user')
  public findUserCodes(@Query('userId') userId: string) {
    return this.gunCodeService.findUserCodes(userId)
  }

  /** 公开数据概览：改枪码总数、精选数、武器分类与枪械数量（首页使用） */
  @Public()
  @Get('statistics')
  @ResponseCache({ key: 'gun:code:statistics', ttl: 300 })
  public getStatistics() {
    return this.gunCodeService.getStatistics()
  }

  /** 收藏 / 取消收藏（登录即可，无需额外权限点；同一请求体代表相反动作，不能挂防重复提交） */
  @Post('favorite/toggle')
  public toggleFavorite(@Body() favoriteDto: FavoriteGunCodeDto, @CurrentUser('userId') userId: string) {
    return this.gunCodeService.toggleFavorite(favoriteDto.codeId, userId)
  }

  /** 当前用户收藏的改枪码 ID 列表 */
  @Get('favorite/ids')
  public findFavoriteIds(@CurrentUser('userId') userId: string) {
    return this.gunCodeService.findFavoriteIds(userId)
  }

  /** 我的收藏列表 */
  @Get('favorite/list')
  public findFavorites(@CurrentUser('userId') userId: string) {
    return this.gunCodeService.findMyFavorites(userId)
  }

  /** 分类与枪械选项（公开：官网精选页需要展示全部分类下的全部枪械） */
  @Public()
  @Get('options')
  public getOptions() {
    return this.gunCodeService.getOptions()
  }

  /** 分页查询改枪码 */
  @Get('list')
  @RequirePermissions(['gun:code:query'])
  public findList(@Query(PaginationPipe) queryParams: QueryGunCodeDto, @CurrentUser() currentUser: AuthType.JwtPayload) {
    return this.gunCodeService.findList(queryParams, currentUser)
  }

  /** 提交自己的改枪码 */
  @Post('create')
  @RequirePermissions(['gun:code:create'])
  @RepeatSubmit()
  @Operlog({ title: '改枪码', businessType: BusinessType.INSERT })
  public create(@Body() createDto: CreateGunCodeDto, @CurrentUser() currentUser: AuthType.JwtPayload) {
    return this.gunCodeService.create(createDto, currentUser)
  }

  /** 修改自己的改枪码 */
  @Put('update')
  @RequirePermissions(['gun:code:update'])
  @Operlog({ title: '改枪码', businessType: BusinessType.UPDATE })
  public update(@Body() updateDto: UpdateGunCodeDto, @CurrentUser() currentUser: AuthType.JwtPayload) {
    return this.gunCodeService.update(updateDto, currentUser)
  }

  /** 删除改枪码（本人或超管） */
  @Delete('delete')
  @RequirePermissions(['gun:code:delete'])
  @Operlog({ title: '改枪码', businessType: BusinessType.DELETE })
  public delete(@Query('ids', new ParseArrayPipe()) ids: string[], @CurrentUser() currentUser: AuthType.JwtPayload) {
    return this.gunCodeService.delete(ids, currentUser)
  }

  /** 提交「改枪码无效」反馈（登录即可） */
  @Post('feedback')
  public createFeedback(@Body() createDto: CreateFeedbackDto, @CurrentUser() currentUser: AuthType.JwtPayload) {
    return this.gunCodeService.createFeedback(createDto, currentUser)
  }

  /** 匿名反馈改枪码无效（未登录可用，按 IP 去重） */
  @Public()
  @Post('feedback/anonymous')
  public createAnonymousFeedback(@Body() createDto: CreateFeedbackDto, @Req() request: ExpressRequest) {
    return this.gunCodeService.createAnonymousFeedback(createDto, getRequestIp(request))
  }

  /** 管理端反馈列表 */
  @Get('feedback/list')
  @RequirePermissions(['gun:feedback:query'])
  public findFeedbackList(@Query(PaginationPipe) queryParams: QueryFeedbackDto) {
    return this.gunCodeService.findFeedbackList(queryParams)
  }

  /** 处理反馈 */
  @Put('feedback/handle')
  @RequirePermissions(['gun:feedback:handle'])
  @Operlog({ title: '改枪码反馈', businessType: BusinessType.UPDATE })
  public handleFeedback(@Body() handleDto: HandleFeedbackDto, @CurrentUser() currentUser: AuthType.JwtPayload) {
    return this.gunCodeService.handleFeedback(handleDto, currentUser)
  }

  /** 精选 / 取消精选（仅超管） */
  @Put('featured')
  @RequirePermissions(['gun:code:feature'])
  @Operlog({ title: '改枪码', businessType: BusinessType.UPDATE })
  public setFeatured(@Body() featuredDto: FeaturedGunCodeDto, @CurrentUser('userId') operatorId: string) {
    return this.gunCodeService.setFeatured(featuredDto, operatorId)
  }
}
