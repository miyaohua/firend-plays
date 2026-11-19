import { BindPhoneDto, ChangePasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResetPasswordDto, SmsLoginDto, SmsSendDto } from './auth.dto'
import { AuthService } from './auth.service'
import { Body, Controller, Get, Post, Put, Req, Headers } from '@nestjs/common'
import { CommonConstant, CurrentUser, Public, RepeatSubmit, SkipThrottle } from '@/common'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 获取图片验证码 */
  @Public()
  @SkipThrottle()
  @Get('captcha')
  public getCaptcha() {
    return this.authService.getCaptcha()
  }

  /** 用户登录 */
  @Public()
  @RepeatSubmit()
  @Post('login')
  public login(@Body() loginDto: LoginDto, @Req() request: ExpressRequest) {
    return this.authService.login(loginDto, request)
  }

  /** 发送短信验证码（公开，注册 / 登录 / 重置密码） */
  @Public()
  @Post('sms/send')
  public sendSms(@Body() smsSendDto: SmsSendDto) {
    return this.authService.sendSms(smsSendDto.scene, smsSendDto.phone)
  }

  /** 短信验证码登录（公开） */
  @Public()
  @RepeatSubmit()
  @Post('login/sms')
  public loginBySms(@Body() smsLoginDto: SmsLoginDto, @Req() request: ExpressRequest) {
    return this.authService.loginBySms(smsLoginDto, request)
  }

  /** 修改密码（登录态） */
  @Put('changePassword')
  public changePassword(@CurrentUser('userId') userId: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(userId, changePasswordDto)
  }

  /** 绑定手机号（登录态，需短信验证码） */
  @Post('bindPhone')
  public bindPhone(@CurrentUser('userId') userId: string, @Body() bindPhoneDto: BindPhoneDto) {
    return this.authService.bindPhone(userId, bindPhoneDto)
  }

  /** 短信验证码重置密码（公开） */
  @Public()
  @RepeatSubmit()
  @Post('resetPassword')
  public resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() request: ExpressRequest) {
    return this.authService.resetPassword(resetPasswordDto, request)
  }

  /** 自助注册（公开，验证码按系统参数开关校验） */
  @Public()
  @RepeatSubmit()
  @Post('register')
  public register(@Body() registerDto: RegisterDto, @Req() request: ExpressRequest) {
    return this.authService.register(registerDto, request)
  }

  /** 刷新令牌（无感续期，不挂防重复提交：并发 401 排队重放时 body 相同会被误拦） */
  @Public()
  @SkipThrottle()
  @Post('refreshToken')
  public refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: ExpressRequest) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, request)
  }

  /* 获取登录用户信息 */
  @Get('getInfo')
  @SkipThrottle()
  public getInfo(@CurrentUser('userId') userId: string) {
    return this.authService.getInfo(userId)
  }

  /* 获取登录用户可访问的路由菜单 */
  @Get('getRoutes')
  public getRoutes(@CurrentUser('userId') userId: string) {
    return this.authService.getRoutes(userId)
  }

  /* 退出登录 */
  @Public()
  @Post('logout')
  public logout(@Headers(CommonConstant.AUTHORIZATION) authorization: string) {
    if (!authorization) return '退出成功'
    const token = authorization.split(' ')[1]
    return this.authService.logout(token)
  }
}
