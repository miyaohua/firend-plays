import { IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator'

export class LoginDto {
  @IsNotEmpty({ message: '参数 $property  不能为空' })
  @IsString({ message: '参数 $property  必须是字符串' })
  username: string

  @IsNotEmpty({ message: '参数 $property  不能为空' })
  @IsString({ message: '参数 $property  必须是字符串' })
  password: string

  /** 验证码与唯一标识：开关关闭时前端不传，服务端按开关决定是否校验 */
  @IsOptional()
  @IsString({ message: '参数 $property  必须是字符串' })
  captcha: string

  @IsOptional()
  @IsString({ message: '参数 $property  必须是字符串' })
  uuid: string
}

export class RefreshTokenDto {
  @IsNotEmpty({ message: '参数 $property  不能为空' })
  @IsString({ message: '参数 $property  必须是字符串' })
  refreshToken: string
}

/** 自助注册（公开接口，验证码按系统参数开关校验） */
export class RegisterDto {
  @IsNotEmpty({ message: '账号不能为空' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9]{2,19}$/, { message: '账号需以字母开头，3-20 位字母或数字' })
  username: string

  @IsNotEmpty({ message: '密码不能为空' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/, { message: '密码需 6-20 位且同时包含字母与数字' })
  password: string

  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @Length(1, 20, { message: '昵称长度不能超过 20 个字符' })
  nickname: string

  @IsNotEmpty({ message: '短信验证码不能为空' })
  @Matches(/^\d{6}$/, { message: '短信验证码为 6 位数字' })
  smsCode: string
}

/** 发送短信验证码 */
export class SmsSendDto {
  @IsIn(['register', 'login', 'reset', 'bind'], { message: '验证码场景不合法' })
  scene: 'register' | 'login' | 'reset' | 'bind'

  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string
}

/** 短信验证码登录 */
export class SmsLoginDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string

  @IsNotEmpty({ message: '短信验证码不能为空' })
  @Matches(/^\d{6}$/, { message: '短信验证码为 6 位数字' })
  code: string
}

/** 通过短信验证码重置密码 */
export class ResetPasswordDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string

  @IsNotEmpty({ message: '短信验证码不能为空' })
  @Matches(/^\d{6}$/, { message: '短信验证码为 6 位数字' })
  code: string

  @IsNotEmpty({ message: '新密码不能为空' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/, { message: '密码需 6-20 位且同时包含字母与数字' })
  password: string
}

/** 修改密码（登录态） */
export class ChangePasswordDto {
  @IsNotEmpty({ message: '原密码不能为空' })
  oldPassword: string

  @IsNotEmpty({ message: '新密码不能为空' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/, { message: '密码需 6-20 位且同时包含字母与数字' })
  newPassword: string
}

/** 绑定手机号（登录态，需短信验证码） */
export class BindPhoneDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string

  @IsNotEmpty({ message: '短信验证码不能为空' })
  @Matches(/^\d{6}$/, { message: '短信验证码为 6 位数字' })
  code: string
}
