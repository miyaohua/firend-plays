import dayjs from 'dayjs'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Equal, In, Repository } from 'typeorm'
import { RedisService } from '@/shared/redis.service'
import { AdEntity, BusinessException, CommonConstant } from '@/common'
import { CreateAdDto, QueryAdDto, UpdateAdDto } from './ad.dto'

@Injectable()
export class AdService {
  /** 公开广告列表缓存前缀（按位置区分） */
  private readonly CACHE_PREFIX = 'response:cache:ad:current:'

  /** 公开广告缓存时长（秒） */
  private readonly CACHE_TTL_SECONDS = 60

  constructor(
    @InjectRepository(AdEntity) private readonly adRepository: Repository<AdEntity>,
    private readonly redisService: RedisService,
  ) {}

  /** 公开接口：按位置取当前生效的广告（启用 + 在排期内 + 排序升序） */
  public async findCurrent(position: string) {
    const cacheKey = `${this.CACHE_PREFIX}${position}`
    const cached = await this.redisService.get(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // 缓存损坏则回源
      }
    }

    const now = new Date()
    const ads = await this.adRepository
      .createQueryBuilder('ad')
      .where('ad.position = :position', { position })
      .andWhere('ad.status = :status', { status: CommonConstant.STATUS_NORMAL })
      .andWhere('(ad.startTime IS NULL OR ad.startTime <= :now)', { now })
      .andWhere('(ad.endTime IS NULL OR ad.endTime >= :now)', { now })
      .orderBy('ad.sort', 'ASC')
      .addOrderBy('ad.createTime', 'DESC')
      .getMany()

    const result = ads.map((ad) => ({
      id: ad.id,
      contentType: ad.contentType,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      text: ad.text,
      sort: ad.sort,
    }))

    await this.redisService.set(cacheKey, JSON.stringify(result), 'EX', this.CACHE_TTL_SECONDS)
    return result
  }

  /** 管理端分页列表 */
  public async findList(queryParams: QueryAdDto) {
    const queryBuilder = this.adRepository.createQueryBuilder('ad')
    if (queryParams.title) queryBuilder.andWhere('ad.title LIKE :title', { title: `%${queryParams.title}%` })
    if (queryParams.position) queryBuilder.andWhere('ad.position = :position', { position: queryParams.position })
    if (queryParams.status) queryBuilder.andWhere('ad.status = :status', { status: queryParams.status })

    const [records, total] = await queryBuilder
      .orderBy('ad.sort', 'ASC')
      .addOrderBy('ad.createTime', 'DESC')
      .skip(queryParams.skip)
      .take(queryParams.take)
      .getManyAndCount()

    return { total, records: records.map((record) => this.toView(record)) }
  }

  /** 新增广告 */
  public async create(createDto: CreateAdDto): Promise<string> {
    this.assertContentValid(createDto.contentType, createDto.imageUrl, createDto.text)

    const entity = new AdEntity()
    Object.assign(entity, createDto)
    entity.position = createDto.position || 'desktop-slot'
    entity.startTime = this.parseTime(createDto.startTime)
    entity.endTime = this.parseTime(createDto.endTime)
    await this.adRepository.save(entity)

    await this.invalidateCache()
    return '新增成功'
  }

  /** 编辑广告 */
  public async update(updateDto: UpdateAdDto): Promise<string> {
    const entity = await this.adRepository.findOneBy({ id: Equal(updateDto.id) })
    if (!entity) throw new BusinessException('广告不存在')

    const contentType = updateDto.contentType ?? entity.contentType
    const imageUrl = updateDto.imageUrl ?? entity.imageUrl
    const text = updateDto.text ?? entity.text
    this.assertContentValid(contentType, imageUrl, text)

    const { startTime, endTime, id: _id, ...rest } = updateDto
    Object.assign(entity, rest)
    if (startTime !== undefined) entity.startTime = this.parseTime(startTime)
    if (endTime !== undefined) entity.endTime = this.parseTime(endTime)
    await this.adRepository.save(entity)

    await this.invalidateCache()
    return '修改成功'
  }

  /** 删除广告（软删除） */
  public async delete(ids: string[]): Promise<string> {
    const records = await this.adRepository.find({ where: { id: In(ids) } })
    if (records.length !== new Set(ids).size) throw new BusinessException('广告不存在')

    await this.adRepository.softDelete({ id: In(ids) })
    await this.invalidateCache()
    return '删除成功'
  }

  /** 曝光上报：只累加计数，不影响公开列表缓存 */
  public async recordView(id: string): Promise<boolean> {
    await this.adRepository.increment({ id: Equal(id) }, 'viewCount', 1)
    return true
  }

  /** 点击上报 */
  public async recordClick(id: string): Promise<boolean> {
    await this.adRepository.increment({ id: Equal(id) }, 'clickCount', 1)
    return true
  }

  /** 图片广告必须有图片，文字广告必须有文案 */
  private assertContentValid(contentType: string, imageUrl?: string, text?: string): void {
    if (contentType === 'I' && !imageUrl) throw new BusinessException('图片广告必须上传图片')
    if (contentType === 'T' && !text) throw new BusinessException('文字广告必须填写文案')
  }

  private parseTime(value?: string): Date {
    if (!value) return null
    const parsed = dayjs(value)
    return parsed.isValid() ? parsed.toDate() : null
  }

  private toView(record: AdEntity) {
    return {
      id: record.id,
      title: record.title,
      position: record.position,
      contentType: record.contentType,
      imageUrl: record.imageUrl,
      linkUrl: record.linkUrl,
      text: record.text,
      sort: record.sort,
      status: record.status,
      startTime: record.startTime ? dayjs(record.startTime).format('YYYY-MM-DD HH:mm:ss') : null,
      endTime: record.endTime ? dayjs(record.endTime).format('YYYY-MM-DD HH:mm:ss') : null,
      remark: record.remark,
      viewCount: record.viewCount,
      clickCount: record.clickCount,
      createTime: dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss'),
    }
  }

  /** 写操作后失效全部位置的公开广告缓存 */
  private async invalidateCache(): Promise<void> {
    const keys = await this.redisService.scan(`${this.CACHE_PREFIX}*`)
    if (keys.length) await this.redisService.del(...keys)
  }
}
