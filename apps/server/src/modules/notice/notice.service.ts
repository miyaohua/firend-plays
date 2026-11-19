import dayjs from 'dayjs'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Equal, In, Repository } from 'typeorm'
import { RedisService } from '@/shared/redis.service'
import { BusinessException, CommonConstant, NoticeEntity } from '@/common'
import { CreateNoticeDto, QueryNoticeDto, UpdateNoticeDto } from './notice.dto'

@Injectable()
export class NoticeService {
  /** 公开公告列表缓存键 */
  private readonly CACHE_KEY = 'response:cache:notice:active'

  /** 公开公告缓存时长（秒） */
  private readonly CACHE_TTL_SECONDS = 60

  constructor(
    @InjectRepository(NoticeEntity) private readonly noticeRepository: Repository<NoticeEntity>,
    private readonly redisService: RedisService,
  ) {}

  /** 公开接口：启用中的公告（排序升序，最多 10 条） */
  public async findActive() {
    const cached = await this.redisService.get(this.CACHE_KEY)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // 缓存损坏则回源
      }
    }

    const notices = await this.noticeRepository.find({
      where: { status: CommonConstant.STATUS_NORMAL },
      order: { sort: 'ASC', createTime: 'DESC' },
      take: 10,
    })

    const result = notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      createTime: dayjs(notice.createTime).format('YYYY-MM-DD HH:mm:ss'),
    }))

    await this.redisService.set(this.CACHE_KEY, JSON.stringify(result), 'EX', this.CACHE_TTL_SECONDS)
    return result
  }

  /** 管理端分页列表 */
  public async findList(queryParams: QueryNoticeDto) {
    const queryBuilder = this.noticeRepository.createQueryBuilder('notice')
    if (queryParams.status) queryBuilder.andWhere('notice.status = :status', { status: queryParams.status })
    if (queryParams.keyword) {
      queryBuilder.andWhere('(notice.title LIKE :keyword OR notice.content LIKE :keyword)', { keyword: `%${queryParams.keyword}%` })
    }

    const [records, total] = await queryBuilder
      .orderBy('notice.sort', 'ASC')
      .addOrderBy('notice.createTime', 'DESC')
      .skip(queryParams.skip)
      .take(queryParams.take)
      .getManyAndCount()

    return { total, records: records.map((record) => this.toView(record)) }
  }

  /** 新增公告 */
  public async create(createDto: CreateNoticeDto): Promise<string> {
    const entity = new NoticeEntity()
    Object.assign(entity, createDto)
    await this.noticeRepository.save(entity)

    await this.invalidateCache()
    return '新增成功'
  }

  /** 编辑公告 */
  public async update(updateDto: UpdateNoticeDto): Promise<string> {
    const entity = await this.noticeRepository.findOneBy({ id: Equal(updateDto.id) })
    if (!entity) throw new BusinessException('公告不存在')

    Object.assign(entity, updateDto)
    await this.noticeRepository.save(entity)

    await this.invalidateCache()
    return '修改成功'
  }

  /** 删除公告（软删除） */
  public async delete(ids: string[]): Promise<string> {
    const records = await this.noticeRepository.find({ where: { id: In(ids) } })
    if (records.length !== new Set(ids).size) throw new BusinessException('公告不存在')

    await this.noticeRepository.softDelete({ id: In(ids) })
    await this.invalidateCache()
    return '删除成功'
  }

  private toView(record: NoticeEntity) {
    return {
      id: record.id,
      title: record.title,
      content: record.content,
      sort: record.sort,
      status: record.status,
      createTime: dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss'),
    }
  }

  /** 写操作后失效公开公告缓存 */
  private async invalidateCache(): Promise<void> {
    await this.redisService.del(this.CACHE_KEY)
  }
}
