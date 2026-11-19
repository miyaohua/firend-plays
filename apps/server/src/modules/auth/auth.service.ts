import { BindPhoneDto, ChangePasswordDto, LoginDto, RegisterDto, ResetPasswordDto, SmsLoginDto, VerifyBindOldDto } from './auth.dto'
import type { AuthType } from '@/types'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '@/shared/redis.service'
import { LogService } from '../monitor/log/log.service'
import { CaptchaService } from '@/shared/captcha.service'
import { LoginLockService } from '@/shared/login-lock.service'
import { UserService } from '../system/user/user.service'
import { MenuService } from '../system/menu/menu.service'
import { RoleService } from '../system/role/role.service'
import { ConfigService as SysConfigService } from '../system/config/config.service'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { verifyPassword, encryptPassword, formatTime, randomUUID, getRequestIp } from '@/utils'
import { CommonConstant, BusinessException, RedisConstant, ConfigConstant, RbacConstant } from '@/common'
import { SmsService } from '../common/sms/sms.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly logService: LogService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly menuService: MenuService,
    private readonly roleService: RoleService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly captchaService: CaptchaService,
    private readonly loginLockService: LoginLockService,
    private readonly sysConfigService: SysConfigService,
    private readonly smsService: SmsService,
  ) {}

  /** 获取验证码（实时读取参数开关，缺失默认开启；关闭时不生成图片，仅返回 enabled 标识） */
  public async getCaptcha() {
    const enabled = await this.sysConfigService.getBooleanConfig(CommonConstant.CAPTCHA_ENABLED_CONFIG_KEY, true)
    if (!enabled) return { enabled, uuid: '', captcha: '' }
    return { enabled, ...(await this.captchaService.create()) }
  }

  /** 用户登录 */
  public async login(loginDto: LoginDto, request: ExpressRequest) {
    try {
      const { username, password, uuid, captcha } = loginDto
      const ip = getRequestIp(request)
      // 1. 账号锁定校验（锁定中直接拒绝，不再消耗验证码校验）
      await this.loginLockService.assertNotLocked(username, ip)
      // 2. 校验验证码是否正确（参数开关关闭时跳过；开关状态与登录页读同一参数，缺失默认开启）
      const captchaEnabled = await this.sysConfigService.getBooleanConfig(CommonConstant.CAPTCHA_ENABLED_CONFIG_KEY, true)
      if (captchaEnabled) await this.captchaService.validate(uuid, captcha)
      // 3. 查询用户：支持「账号」或「手机号」作为登录标识
      const isPhoneLogin = /^1[3-9]\d{9}$/.test(username)
      const user = await this.userService.getRepository().findOneBy(isPhoneLogin ? { phone: username, status: CommonConstant.STATUS_NORMAL } : { username, status: CommonConstant.STATUS_NORMAL })
      if (!user) throw new BusinessException('账号或密码错误')
      const { id: userId, password: hashPassword } = user
      // 4. 校验密码是否正确（错误计入失败次数，达阈值锁定账号）
      if (!(await verifyPassword(password, hashPassword))) {
        const remainingCount = await this.loginLockService.recordFailure(username, ip)
        throw new BusinessException(`账号或密码错误，还可尝试 ${remainingCount} 次`)
      }
      await this.loginLockService.clearFailCount(username, ip)
      // 5. 生成令牌对
      const { accessTokenKey, accessToken, refreshToken } = await this.generateTokenPair(user)
      // 6. 更新登录时间
      this.userService.getRepository().update(userId, { loginTime: formatTime() })
      this.logService.createLoginlog(request, '登录成功', userId, accessTokenKey)
      // 7. 记录日志
      return { accessToken, refreshToken, expiresIn: this.expiresIn }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : '登录失败'
      this.logService.createLoginlog(request, errorMsg)
      throw error
    }
  }

  /** 自助注册：校验开关与短信验证码后建号，并直接签发令牌实现自动登录 */
  public async register(registerDto: RegisterDto, request: ExpressRequest) {
    const registerEnabled = await this.sysConfigService.getBooleanConfig(CommonConstant.REGISTER_ENABLED_CONFIG_KEY, true)
    if (!registerEnabled) throw new BusinessException('当前暂未开放注册')

    await this.smsService.verify('register', registerDto.phone, registerDto.smsCode)

    const user = await this.userService.registerUser(registerDto)
    const { accessTokenKey, accessToken, refreshToken } = await this.generateTokenPair(user)

    this.userService.getRepository().update(user.id, { loginTime: formatTime() })
    this.logService.createLoginlog(request, '注册成功', user.id, accessTokenKey)

    return { accessToken, refreshToken, expiresIn: this.expiresIn }
  }

  /** 发送短信验证码（注册 / 登录 / 重置密码） */
  public async sendSms(scene: 'register' | 'login' | 'reset' | 'bind' | 'bindOld', phone: string) {
    return this.smsService.send(scene, phone)
  }

  /** 短信验证码登录：手机号 + 验证码，成功即签发令牌 */
  public async loginBySms(loginDto: SmsLoginDto, request: ExpressRequest) {
    const { phone, code } = loginDto
    await this.smsService.verify('login', phone, code)

    const user = await this.userService.getRepository().findOneBy({ phone, status: CommonConstant.STATUS_NORMAL })
    if (!user) throw new BusinessException('手机号或验证码错误')

    const { accessTokenKey, accessToken, refreshToken } = await this.generateTokenPair(user)
    this.userService.getRepository().update(user.id, { loginTime: formatTime() })
    this.logService.createLoginlog(request, '短信登录成功', user.id, accessTokenKey)

    return { accessToken, refreshToken, expiresIn: this.expiresIn }
  }

  /** 通过短信验证码重置密码：重置后该账号所有在线会话立即失效 */
  public async resetPassword(resetDto: ResetPasswordDto, request: ExpressRequest) {
    const { phone, code, password } = resetDto
    await this.smsService.verify('reset', phone, code)

    const user = await this.userService.getRepository().findOneBy({ phone, status: CommonConstant.STATUS_NORMAL })
    if (!user) throw new BusinessException('手机号或验证码错误')

    user.password = await encryptPassword(password)
    await this.userService.getRepository().save(user)
    await this.revokeUserSessions(user.id)
    await this.loginLockService.clearFailCount(user.username, getRequestIp(request))
    this.logService.createLoginlog(request, '重置密码成功', user.id)

    return '密码重置成功，请使用新密码登录'
  }

  /** 修改密码：已绑手机仅需手机验证码；未绑定手机的老账号降级为校验原密码。成功后其他设备下线 */
  public async changePassword(userId: string, currentUuid: string, changeDto: ChangePasswordDto) {
    const user = await this.userService.findOneById(userId)

    if (user.phone) {
      // 已绑定手机：短信验证即身份证明，不再要求原密码
      if (!changeDto.code) throw new BusinessException('请输入手机验证码')
      await this.smsService.verify('reset', user.phone, changeDto.code)
    } else {
      if (!changeDto.oldPassword) throw new BusinessException('请输入原密码')
      if (!(await verifyPassword(changeDto.oldPassword, user.password))) throw new BusinessException('原密码不正确')
    }
    if (changeDto.oldPassword && changeDto.oldPassword === changeDto.newPassword) throw new BusinessException('新密码不能与原密码相同')

    user.password = await encryptPassword(changeDto.newPassword)
    await this.userService.getRepository().save(user)
    await this.revokeUserSessions(userId, currentUuid)
    return '密码修改成功'
  }

  /** 换绑第一步：验证原手机号，成功后签发 10 分钟有效的一次性票据 */
  public async verifyBindOld(userId: string, code: string) {
    const user = await this.userService.findOneById(userId)
    if (!user.phone) throw new BusinessException('当前账号未绑定手机号')

    await this.smsService.verify('bindOld', user.phone, code)

    const ticket = randomUUID()
    await this.redisService.set(`user:bind:ticket:${userId}`, ticket, 'EX', 600)
    return { ticket }
  }

  /** 换绑第二步：凭原手机验证票据 + 新手机验证码完成换绑，24 小时内只能更换一次 */
  public async bindPhone(userId: string, currentUuid: string, bindDto: BindPhoneDto) {
    const user = await this.userService.findOneById(userId)
    if (user.phone === bindDto.phone) throw new BusinessException('新手机号不能与原手机号相同')

    // 已绑定旧手机：必须持有原手机验证票据，防止跳过旧号直接验证新号
    if (user.phone) {
      if (!bindDto.ticket) throw new BusinessException('请先验证原手机号')
      const storedTicket = await this.redisService.get(`user:bind:ticket:${userId}`)
      if (!storedTicket || storedTicket !== bindDto.ticket) throw new BusinessException('原手机验证已失效，请重新验证')

      const changedRecently = await this.redisService.get(`user:phone:changed:${userId}`)
      if (changedRecently) throw new BusinessException('24 小时内只能更换一次手机号，请稍后再试')
    }

    await this.smsService.verify('bind', bindDto.phone, bindDto.code)

    const occupied = await this.userService.getRepository().findOneBy({ phone: bindDto.phone })
    if (occupied && occupied.id !== userId) throw new BusinessException('该手机号已被其他账号绑定')

    await this.userService.getRepository().update(userId, { phone: bindDto.phone })
    if (user.phone) {
      await this.redisService.del(`user:bind:ticket:${userId}`)
      await this.redisService.set(`user:phone:changed:${userId}`, '1', 'EX', 86400)
    }
    await this.revokeUserSessions(userId, currentUuid)
    return '手机号更换成功'
  }

  /** 清空指定用户的其他会话（keepUuid 为当前会话，传空表示全部下线） */
  private async revokeUserSessions(userId: string, keepUuid?: string): Promise<void> {
    const patterns = [`${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:*`, `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:*`, `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:*`]
    for (const pattern of patterns) {
      const keys = await this.redisService.scan(pattern)
      const removable = keepUuid ? keys.filter((key) => !key.endsWith(`:${keepUuid}`)) : keys
      if (removable.length) await this.redisService.del(...removable)
    }
  }

  /** 获取登录用户信息（每次调用都重建角色/部门缓存与角色级权限缓存，权限变更刷新即生效） */
  public async getInfo(userId: string) {
    // 1. 重建鉴权缓存并取用户与角色
    const { user, activeRoles, permissions } = await this.warmAuthCaches(userId)
    const roleCodeList = [...new Set(activeRoles.map((role) => role.roleCode))]

    // 2. 剔除敏感字段后返回
    const safeUser: Record<string, unknown> = { ...user }
    delete safeUser.password
    delete safeUser.deleteTime
    delete safeUser.roles
    if (roleCodeList.length === 0) throw new BusinessException('请先联系管理员分配角色')
    return { user: safeUser, roles: roleCodeList, permissions }
  }

  /** 获取登录用户可访问的路由菜单（扁平列表，前端 generateRoutes 建树） */
  public async getRoutes(userId: string) {
    const roles = await this.userService.getUserRoles(userId)
    if (!roles) throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    const isAdmin = roles.some((role) => role.roleCode === RbacConstant.SUPER_ROLE_CODE)
    const roleIds = roles.map((role) => role.id)
    return this.menuService.findRoutesByRoleIds(roleIds, isAdmin)
  }

  /** 刷新令牌：校验并轮换 refreshToken，重发 accessToken（滑动续期，每次刷新重置 7 天），并重建鉴权缓存 */
  public async refreshToken(refreshToken: string, request: ExpressRequest) {
    let payload: AuthType.JwtPayload
    try {
      payload = this.jwtService.verify(refreshToken)
    } catch {
      throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    }
    const { userId, username, uuid, type } = payload
    if (type !== 'refresh') throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    // 值比对防「已轮换的旧刷新令牌重放」
    const refreshTokenKey = `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:${uuid}`
    const storedToken = await this.redisService.get(refreshTokenKey)
    if (storedToken !== refreshToken) throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    // 重建鉴权守卫依赖的缓存（离开期间角色/权限缓存已随 TTL 过期，不重建则重放请求仍被守卫 401 拒绝）
    const { activeRoles } = await this.warmAuthCaches(userId)
    if (activeRoles.length === 0) throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    // 轮换：签发新 refreshToken（新 jti）并重置 TTL，旧令牌随之作废
    const newRefreshToken = this.jwtService.sign({ userId, username, uuid, type: 'refresh', jti: randomUUID() })
    await this.redisService.set(refreshTokenKey, newRefreshToken, 'EX', this.refreshExpiresIn)
    // 重发 accessToken（同 uuid，签名结果确定）并重置访问 key TTL
    const accessToken = this.jwtService.sign({ userId, username, uuid })
    await this.redisService.set(`${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`, accessToken, 'EX', this.expiresIn)
    // 在线记录覆盖重建（原记录可能已过期，EXPIRE 对缺失键无效）
    await this.logService.saveOnlineRecord(request, userId, username, uuid)
    return { accessToken, refreshToken: newRefreshToken, expiresIn: this.expiresIn }
  }

  /** 退出登录 */
  public async logout(token: string) {
    try {
      const { userId, uuid }: AuthType.JwtPayload = this.jwtService.verify(token)
      const tokenKey = `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`
      const refreshTokenKey = `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:${uuid}`
      const onlineKey = `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:${uuid}`
      await this.redisService.del(tokenKey, refreshTokenKey, onlineKey)
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : '退出登录失败'
      this.logger.error(errorMsg)
    }
    return `退出登录成功`
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */
  /** 获取 AccessToken 的过期时间 */
  private get expiresIn() {
    return this.configService.getOrThrow<number>(ConfigConstant.JWT_EXPIRES_IN)
  }

  /** 获取 RefreshToken 的过期时间（秒，默认 7 天） */
  private get refreshExpiresIn() {
    return this.configService.get<number>(ConfigConstant.JWT_REFRESH_EXPIRES_IN, 604800)
  }

  /**
   * 重建鉴权体系依赖的全部缓存（getInfo 与 refreshToken 共用；角色为空时照常返回，由调用方决定如何拒绝）
   * 权限缓存每次强制回源重算并覆盖写回（force），新增菜单/按钮后刷新页面或刷新令牌即生效（守卫高频读仍走缓存）
   */
  private async warmAuthCaches(userId: string) {
    // 1. 查询用户信息（含角色关联）
    const user = await this.userService.findOneById(userId)
    const activeRoles = (user.roles ?? []).filter((role) => role.status === CommonConstant.STATUS_NORMAL)
    const adminRole = activeRoles.find((role) => role.roleCode === RbacConstant.SUPER_ROLE_CODE)

    // 2. 用户级缓存（角色 + 可见部门；角色守卫与权限守卫读前者，数据权限拦截器读后者）
    await Promise.all([
      this.redisService.set(`${RedisConstant.ADMIN_USER_ROLES}:${userId}`, JSON.stringify(activeRoles.map((role) => ({ id: role.id, roleCode: role.roleCode }))), 'EX', this.expiresIn),
      this.userService.getVisibleDeptIds(userId),
    ])

    // 3. 角色级权限缓存：超管读全量权限（内容为菜单表全部启用按钮权限串，权限守卫依赖此缓存做严格匹配），普通用户按角色聚合
    const permissions = adminRole
      ? await this.menuService.getPermsCacheByRoleId(adminRole.id, true, true)
      : [...new Set((await Promise.all(activeRoles.map((role) => this.menuService.getPermsCacheByRoleId(role.id, false, true)))).flat())]

    // 4. 预热角色数据范围缓存（数据权限拦截器只读缓存，缺失时 fail-closed 按 1=0 查空；超管不再短路，同样需要预热）
    await Promise.all(activeRoles.map((role) => this.roleService.getRoleScopeCache(role.id)))

    return { user, activeRoles, permissions }
  }

  /** 生成访问/刷新令牌对并存入 Redis（共用同一 uuid，刷新令牌载荷带 type 与 jti） */
  private async generateTokenPair(user: { id: string; username: string }) {
    const { id: userId, username } = user
    const uuid = randomUUID()
    const accessTokenKey = `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`
    const refreshTokenKey = `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:${uuid}`
    const accessToken = this.jwtService.sign({ userId, username, uuid })
    const refreshToken = this.jwtService.sign({ userId, username, uuid, type: 'refresh', jti: randomUUID() })
    await this.redisService.set(accessTokenKey, accessToken, 'EX', this.expiresIn)
    await this.redisService.set(refreshTokenKey, refreshToken, 'EX', this.refreshExpiresIn)
    return { accessToken, accessTokenKey, refreshToken }
  }
}
