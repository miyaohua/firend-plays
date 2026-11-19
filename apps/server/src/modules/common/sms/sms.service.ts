import crypto from 'node:crypto'
import dayjs from 'dayjs'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BusinessException } from '@/common'
import { RedisService } from '@/shared/redis.service'

/** 短信验证码使用场景 */
export type SmsScene = 'register' | 'login' | 'reset' | 'bind' | 'bindOld'

/**
 * 阿里云短信服务
 * @description 负责验证码的发送、校验与频控；未配置密钥时可通过 SMS_MOCK=true 在本地模拟
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name)

  /** 验证码有效期（秒） */
  private readonly CODE_TTL = 300

  /** 同一场景 + 手机号的重发冷却（秒） */
  private readonly COOLDOWN_TTL = 60

  /** 单条验证码允许的错误次数 */
  private readonly MAX_ATTEMPTS = 5

  /** 单手机号每日发送上限 */
  private readonly DAILY_LIMIT = 10

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /** 发送验证码：频控 → 生成 → 落缓存 → 调用阿里云（或 Mock） */
  public async send(scene: SmsScene, phone: string) {
    const cooldownKey = `sms:cooldown:${scene}:${phone}`
    const allowed = await this.redisService.setnx(cooldownKey, '1')
    if (!allowed) throw new BusinessException('验证码发送过于频繁，请稍后再试')
    await this.redisService.expire(cooldownKey, this.COOLDOWN_TTL)

    const dailyKey = `sms:daily:${phone}:${dayjs().format('YYYYMMDD')}`
    const dailyCount = await this.redisService.incrWithExpire(dailyKey, 86400)
    if (dailyCount > this.DAILY_LIMIT) throw new BusinessException('今日验证码发送次数已达上限，请明天再试')

    const code = String(crypto.randomInt(100000, 1000000))
    await this.redisService.set(`sms:code:${scene}:${phone}`, code, 'EX', this.CODE_TTL)

    if (this.configService.get<boolean>('sms.mock')) {
      this.logger.warn(`[SMS Mock] scene=${scene} phone=${phone} code=${code}`)
      return { mock: true, mockCode: code }
    }

    try {
      await this.sendByAliyun(phone, this.templateOf(scene), code)
    } catch (error) {
      await this.redisService.del(`sms:code:${scene}:${phone}`)
      throw error
    }
    return { mock: false }
  }

  /** 校验验证码：错误计数达上限后作废验证码 */
  public async verify(scene: SmsScene, phone: string, code: string): Promise<void> {
    const codeKey = `sms:code:${scene}:${phone}`
    const failKey = `sms:fail:${scene}:${phone}`
    const stored = await this.redisService.get(codeKey)
    if (!stored) throw new BusinessException('验证码已过期，请重新获取')

    if (stored !== String(code)) {
      const attempts = await this.redisService.incrWithExpire(failKey, this.CODE_TTL)
      if (attempts >= this.MAX_ATTEMPTS) {
        await this.redisService.del(codeKey)
        throw new BusinessException('验证码错误次数过多，请重新获取')
      }
      throw new BusinessException('验证码错误')
    }

    await this.redisService.del(codeKey, failKey)
  }

  private templateOf(scene: SmsScene): string {
    const templates: Record<SmsScene, string> = {
      register: this.configService.get<string>('sms.templateRegister'),
      login: this.configService.get<string>('sms.templateLogin'),
      reset: this.configService.get<string>('sms.templateReset'),
      // 更换手机：新号使用专用模板，原号使用「身份验证」模板
      bind: this.configService.get<string>('sms.templateBind'),
      bindOld: this.configService.get<string>('sms.templateBindOld') || this.configService.get<string>('sms.templateLogin'),
    }
    const template = templates[scene]
    if (!template) throw new BusinessException('短信模板未配置，请联系管理员')
    return template
  }

  /** 调用阿里云短信 RPC 接口（2017-05-25，HMAC-SHA1 签名，无需额外 SDK） */
  private async sendByAliyun(phone: string, templateCode: string, code: string) {
    const accessKeyId = this.configService.get<string>('sms.accessKeyId')
    const accessKeySecret = this.configService.get<string>('sms.accessKeySecret')
    const signName = this.configService.get<string>('sms.signName')
    if (!accessKeyId || !accessKeySecret || !signName) throw new BusinessException('短信服务未配置，请联系管理员')

    const params: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: 'SendSms',
      Format: 'JSON',
      RegionId: this.configService.get<string>('sms.regionId') || 'cn-hangzhou',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: crypto.randomUUID(),
      SignatureVersion: '1.0',
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      Version: '2017-05-25',
      PhoneNumbers: phone,
      SignName: signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify({ code }),
    }

    const canonicalQuery = Object.keys(params)
      .sort()
      .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
      .join('&')
    const stringToSign = `GET&${percentEncode('/')}&${percentEncode(canonicalQuery)}`
    const signature = crypto.createHmac('sha1', `${accessKeySecret}&`).update(stringToSign).digest('base64')

    const endpoint = this.configService.get<string>('sms.endpoint') || 'dysmsapi.aliyuncs.com'
    const response = await fetch(`https://${endpoint}/?${canonicalQuery}&Signature=${percentEncode(signature)}`)
    const payload = (await response.json().catch(() => ({}))) as { Code?: string; Message?: string }

    if (payload.Code !== 'OK') {
      this.logger.error(`阿里云短信发送失败: ${payload.Code} ${payload.Message}`)
      throw new BusinessException(`短信发送失败：${payload.Message || payload.Code || '未知错误'}`)
    }
    return payload
  }
}

/** 阿里云 RPC 签名要求的 RFC3986 编码 */
function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}
