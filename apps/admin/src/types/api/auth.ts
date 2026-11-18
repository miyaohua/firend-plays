import type { SysUser } from '@/types/api/system/user'

/** 验证码响应数据 */
export interface CaptchaResult {
  /** 验证码开关（false 时登录页隐藏验证码输入框） */
  enabled: boolean
  /** 验证码唯一标识（关闭时为空字符串） */
  uuid: string
  /** 验证码图片（关闭时为空字符串） */
  captcha: string
}

export interface LoginParams {
  /** 登录账号 */
  username: string
  /** 登录密码 */
  password: string
  /** 验证码 */
  captcha: string
  /** 验证码唯一标识 */
  uuid: string
}

/** 自助注册参数 */
export interface RegisterParams {
  /** 账号 */
  username: string
  /** 密码 */
  password: string
  /** 手机号 */
  phone: string
  /** 昵称（可选） */
  nickname?: string
  /** 短信验证码 */
  smsCode: string
}

/** 登录响应数据 */
export interface LoginResult {
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌（长时凭证，用于向服务端换取新的访问令牌） */
  refreshToken: string
  /** 过期时间 */
  expiresIn: number
}

/** 刷新令牌请求参数 */
export interface RefreshTokenParams {
  /** 刷新令牌 */
  refreshToken: string
}

/** 获取登录者信息 */
export interface CurrentUserInfo {
  user: SysUser
  roles: string[]
  permissions: string[]
}

/** 短信验证码场景 */
export type SmsScene = 'register' | 'login' | 'reset'

/** 发送短信验证码参数 */
export interface SmsSendParams {
  scene: SmsScene
  phone: string
}

/** 发送短信验证码结果（Mock 模式会返回验证码，便于本地联调） */
export interface SmsSendResult {
  mock: boolean
  mockCode?: string
}

/** 短信验证码登录参数 */
export interface SmsLoginParams {
  phone: string
  code: string
}

/** 短信验证码重置密码参数 */
export interface ResetPasswordParams {
  phone: string
  code: string
  password: string
}
