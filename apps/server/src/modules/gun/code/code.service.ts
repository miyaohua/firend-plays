import dayjs from 'dayjs'
import { Injectable } from '@nestjs/common'
import { Equal, In, Repository } from 'typeorm'
import type { AuthType } from '@/types'
import { RedisService } from '@/shared/redis.service'
import { InjectRepository } from '@nestjs/typeorm'
import { UserService } from '../../system/user/user.service'
import { BusinessException, CommonConstant, DictDataEntity, DictTypeEntity, GunCodeEntity, RbacConstant, RedisConstant } from '@/common'
import { CreateGunCodeDto, FeaturedGunCodeDto, QueryGunCodeDto, UpdateGunCodeDto } from './code.dto'

/** 公开精选接口返回的分组结构 */
export interface FeaturedGroupView {
  dictType: string
  dictName: string
  guns: Array<{ gunValue: string; gunLabel: string; codes: FeaturedCodeView[] }>
}

/** 公开精选分组内部的枪械聚合结构 */
interface FeaturedGunGroup {
  gunValue: string
  gunLabel: string
  gunSort: number
  codes: FeaturedCodeView[]
}

/** 公开精选分组内部的分类聚合结构 */
interface FeaturedTypeGroup {
  dictType: string
  dictName: string
  gunMap: Map<string, FeaturedGunGroup>
}

/** 公开精选接口的单条改枪码（不含任何用户标识字段） */
export interface FeaturedCodeView {
  id: string
  code: string
  remark: string | null
  author: string
  featuredTime: string | null
}

@Injectable()
export class GunCodeService {
  /** 公开精选列表的响应缓存键，须与控制器 @ResponseCache 的 key 保持一致 */
  private readonly FEATURED_CACHE_KEY = `${RedisConstant.RESPONSE_CACHE}:gun:code:featured`

  /** 公开统计接口的响应缓存键，须与控制器 @ResponseCache 的 key 保持一致 */
  private readonly STATISTICS_CACHE_KEY = `${RedisConstant.RESPONSE_CACHE}:gun:code:statistics`

  /** 参与改枪码功能的字典类型前缀（只取武器分类，避免评审、性别等字典混入） */
  private readonly WEAPON_TYPE_PREFIX = 'weapon_'

  /** 武器分类展示顺序：字典类型表没有排序字段，用固定顺序保证「默认展示第一个分类」稳定 */
  private readonly WEAPON_TYPE_ORDER = ['weapon_rifle', 'weapon_smg', 'weapon_shotgun', 'weapon_lmg', 'weapon_dmr', 'weapon_sniper', 'weapon_pistol', 'weapon_special']

  /** 公开接口返回上限，避免精选无上限增长拖垮匿名请求 */
  private readonly FEATURED_LIMIT = 100

  constructor(
    @InjectRepository(GunCodeEntity) private readonly gunCodeRepository: Repository<GunCodeEntity>,
    @InjectRepository(DictTypeEntity) private readonly dictTypeRepository: Repository<DictTypeEntity>,
    @InjectRepository(DictDataEntity) private readonly dictDataRepository: Repository<DictDataEntity>,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  /** 提交自己的改枪码（服务端校验分类与枪械的合法性，并写入提交人信息） */
  public async create(createDto: CreateGunCodeDto, currentUser: AuthType.JwtPayload): Promise<string> {
    const weapon = await this.dictDataRepository.findOneBy({
      dictType: Equal(createDto.dictType),
      dictValue: Equal(createDto.gunValue),
      status: Equal(CommonConstant.STATUS_NORMAL),
    })
    if (!weapon) throw new BusinessException('所选枪械不存在或已停用')

    const isDuplicated = await this.gunCodeRepository.existsBy({
      userId: Equal(currentUser.userId),
      gunValue: Equal(createDto.gunValue),
      code: Equal(createDto.code),
    })
    if (isDuplicated) throw new BusinessException('该枪械下你已提交过完全相同的改枪码')

    const entity = new GunCodeEntity()
    Object.assign(entity, {
      dictType: createDto.dictType,
      gunValue: createDto.gunValue,
      gunLabel: weapon.dictLabel,
      code: createDto.code,
      remark: createDto.remark || null,
      userId: currentUser.userId,
      username: currentUser.username,
      isFeatured: CommonConstant.STATUS_DISABLE,
    })
    await this.gunCodeRepository.save(entity)
    await this.invalidatePublicCaches()
    return '提交成功'
  }

  /** 分页查询改枪码：普通用户固定看「我的 ∨ 精选」，超管可切换查看范围 */
  public async findList(queryParams: QueryGunCodeDto, currentUser: AuthType.JwtPayload) {
    const isSuperAdmin = await this.isSuperAdmin(currentUser.userId)
    const queryBuilder = this.gunCodeRepository.createQueryBuilder('gunCode')

    if (queryParams.dictType) queryBuilder.andWhere('gunCode.dictType = :dictType', { dictType: queryParams.dictType })
    if (queryParams.gunValue) queryBuilder.andWhere('gunCode.gunValue = :gunValue', { gunValue: queryParams.gunValue })
    if (queryParams.keyword) {
      queryBuilder.andWhere('(gunCode.code LIKE :keyword OR gunCode.remark LIKE :keyword)', { keyword: `%${queryParams.keyword}%` })
    }

    if (isSuperAdmin) {
      if (queryParams.scope === 'mine') queryBuilder.andWhere('gunCode.userId = :userId', { userId: currentUser.userId })
      if (queryParams.scope === 'featured') queryBuilder.andWhere('gunCode.isFeatured = :isFeatured', { isFeatured: CommonConstant.STATUS_NORMAL })
    } else {
      queryBuilder.andWhere('(gunCode.userId = :userId OR gunCode.isFeatured = :isFeatured)', { userId: currentUser.userId, isFeatured: CommonConstant.STATUS_NORMAL })
    }

    const [records, total] = await queryBuilder
      .orderBy('gunCode.isFeatured', 'DESC')
      .addOrderBy('gunCode.createTime', 'DESC')
      .skip(queryParams.skip)
      .take(queryParams.take)
      .getManyAndCount()

    return { total, records: records.map((record) => this.toListView(record, currentUser.userId, isSuperAdmin)) }
  }

  /** 修改自己的改枪码：仅内容与备注可改；精选记录改动后刷新公开缓存 */
  public async update(updateDto: UpdateGunCodeDto, currentUser: AuthType.JwtPayload): Promise<string> {
    const record = await this.gunCodeRepository.findOneBy({ id: Equal(updateDto.id) })
    if (!record) throw new BusinessException('改枪码不存在')
    if (record.userId !== currentUser.userId && !(await this.isSuperAdmin(currentUser.userId))) {
      throw new BusinessException('只能修改自己提交的改枪码')
    }

    record.code = updateDto.code ?? record.code
    record.remark = updateDto.remark ?? record.remark
    await this.gunCodeRepository.save(record)

    if (record.isFeatured === CommonConstant.STATUS_NORMAL) await this.invalidatePublicCaches()
    return '修改成功'
  }

  /** 删除改枪码：本人或超管可删；命中精选时同步失效公开缓存 */
  public async delete(ids: string[], currentUser: AuthType.JwtPayload): Promise<string> {
    const records = await this.gunCodeRepository.find({ where: { id: In(ids) } })
    if (records.length !== new Set(ids).size) throw new BusinessException('改枪码不存在')
    if (!(await this.isSuperAdmin(currentUser.userId)) && records.some((record) => record.userId !== currentUser.userId)) {
      throw new BusinessException('只能删除自己提交的改枪码')
    }

    await this.gunCodeRepository.softDelete({ id: In(ids) })
    await this.invalidatePublicCaches()
    return '删除成功'
  }

  /** 精选 / 取消精选（仅超管可用），写后立刻失效公开缓存 */
  public async setFeatured(featuredDto: FeaturedGunCodeDto, operatorId: string): Promise<string> {
    const record = await this.gunCodeRepository.findOneBy({ id: Equal(featuredDto.id) })
    if (!record) throw new BusinessException('改枪码不存在')

    const isFeatured = featuredDto.isFeatured === CommonConstant.STATUS_NORMAL
    record.isFeatured = featuredDto.isFeatured
    record.featuredBy = isFeatured ? operatorId : null
    record.featuredTime = isFeatured ? new Date() : null
    await this.gunCodeRepository.save(record)

    await this.invalidatePublicCaches()
    return isFeatured ? '已设为精选' : '已取消精选'
  }

  /** 公开精选列表：无需登录，按分类 → 枪械分组返回，不含用户 ID 等敏感字段 */
  public async findFeaturedPublic(): Promise<FeaturedGroupView[]> {
    const records = await this.gunCodeRepository.find({
      where: { isFeatured: CommonConstant.STATUS_NORMAL },
      order: { createTime: 'DESC' },
      take: this.FEATURED_LIMIT,
    })
    if (!records.length) return []

    const typeCodes = [...new Set(records.map((record) => record.dictType))]
    const [dictTypes, dictDataList] = await Promise.all([
      this.dictTypeRepository.find({ where: { dictType: In(typeCodes), status: CommonConstant.STATUS_NORMAL } }),
      this.dictDataRepository.find({ where: { dictType: In(typeCodes), status: CommonConstant.STATUS_NORMAL } }),
    ])
    const typeNameMap = new Map(dictTypes.map((dictType) => [dictType.dictType, dictType.dictName]))
    const gunSortMap = new Map(dictDataList.map((dictData) => [`${dictData.dictType}:${dictData.dictValue}`, dictData.dictSort]))

    const groupMap = new Map<string, FeaturedTypeGroup>()
    for (const record of records) {
      if (!typeNameMap.has(record.dictType)) continue
      if (!groupMap.has(record.dictType)) {
        groupMap.set(record.dictType, { dictType: record.dictType, dictName: typeNameMap.get(record.dictType) ?? '', gunMap: new Map() })
      }
      const group = groupMap.get(record.dictType)!
      if (!group.gunMap.has(record.gunValue)) {
        group.gunMap.set(record.gunValue, {
          gunValue: record.gunValue,
          gunLabel: record.gunLabel,
          gunSort: gunSortMap.get(`${record.dictType}:${record.gunValue}`) ?? Number.MAX_SAFE_INTEGER,
          codes: [],
        })
      }
      group.gunMap.get(record.gunValue)!.codes.push({
        id: record.id,
        code: record.code,
        remark: record.remark || null,
        author: this.maskUsername(record.username),
        featuredTime: this.formatTime(record.featuredTime),
      })
    }

    return [...groupMap.values()]
      .sort((left, right) => this.typeOrderIndex(left.dictType) - this.typeOrderIndex(right.dictType))
      .map((group) => ({
        dictType: group.dictType,
        dictName: group.dictName,
        guns: [...group.gunMap.values()]
          .sort((left, right) => left.gunSort - right.gunSort)
          .map((gun) => ({ gunValue: gun.gunValue, gunLabel: gun.gunLabel, codes: gun.codes })),
      }))
  }

  /** 分类 + 枪械选项（供页面左右导航，按固定业务顺序输出） */
  public async getOptions(): Promise<Array<{ dictType: string; dictName: string; guns: Array<{ label: string; value: string }> }>> {
    const dictTypes = await this.dictTypeRepository.find({ where: { status: CommonConstant.STATUS_NORMAL } })
    const weaponTypes = dictTypes
      .filter((dictType) => dictType.dictType.startsWith(this.WEAPON_TYPE_PREFIX))
      .sort((left, right) => this.typeOrderIndex(left.dictType) - this.typeOrderIndex(right.dictType))
    if (!weaponTypes.length) return []

    const dictDataList = await this.dictDataRepository.find({
      where: { dictType: In(weaponTypes.map((dictType) => dictType.dictType)), status: CommonConstant.STATUS_NORMAL },
      order: { dictSort: 'ASC' },
    })

    return weaponTypes.map((dictType) => ({
      dictType: dictType.dictType,
      dictName: dictType.dictName,
      guns: dictDataList.filter((dictData) => dictData.dictType === dictType.dictType).map((dictData) => ({ label: dictData.dictLabel, value: dictData.dictValue })),
    }))
  }

  /** 列表视图：本人或超管看到完整账号，其余精选记录对账号打码 */
  private toListView(record: GunCodeEntity, currentUserId: string, isSuperAdmin: boolean) {
    const isMine = record.userId === currentUserId
    return {
      id: record.id,
      dictType: record.dictType,
      gunValue: record.gunValue,
      gunLabel: record.gunLabel,
      code: record.code,
      remark: record.remark,
      username: isSuperAdmin || isMine ? record.username : this.maskUsername(record.username),
      isMine,
      isFeatured: record.isFeatured,
      featuredTime: this.formatTime(record.featuredTime),
      createTime: this.formatTime(record.createTime),
    }
  }

  /** 判定是否超管（与权限守卫同一套角色缓存） */
  private async isSuperAdmin(userId: string): Promise<boolean> {
    const roles = await this.userService.getUserRoles(userId)
    return (roles ?? []).some((role) => role.roleCode === RbacConstant.SUPER_ROLE_CODE)
  }

  /** 首页数据概览：公开接口使用，统计数据量与前端的武器分类入口 */
  public async getStatistics() {
    const [totalCodes, featuredRecords, options] = await Promise.all([
      this.gunCodeRepository.count(),
      this.gunCodeRepository.find({ where: { isFeatured: CommonConstant.STATUS_NORMAL }, select: { dictType: true } }),
      this.getOptions(),
    ])

    const featuredCountMap = new Map<string, number>()
    for (const record of featuredRecords) featuredCountMap.set(record.dictType, (featuredCountMap.get(record.dictType) ?? 0) + 1)

    return {
      totalCodes,
      featuredCodes: featuredRecords.length,
      typeCount: options.length,
      gunCount: options.reduce((sum, type) => sum + type.guns.length, 0),
      types: options.map((type) => ({
        dictType: type.dictType,
        dictName: type.dictName,
        gunCount: type.guns.length,
        featuredCount: featuredCountMap.get(type.dictType) ?? 0,
      })),
    }
  }

  /** 失效公开接口缓存（精选列表 + 首页统计）：数据变更后官网需立即看到新数据 */
  private async invalidatePublicCaches(): Promise<void> {
    await this.redisService.del(this.FEATURED_CACHE_KEY, this.STATISTICS_CACHE_KEY)
  }

  /** 账号打码（保留首字符），避免公开接口泄露完整账号 */
  private maskUsername(username: string): string {
    if (!username) return '匿名'
    if (username.length === 1) return `${username}**`
    return `${username.slice(0, 1)}${'*'.repeat(Math.min(3, username.length - 1))}`
  }

  /** 分类排序权重：固定顺序之外的分类排在最后 */
  private typeOrderIndex(dictType: string): number {
    const index = this.WEAPON_TYPE_ORDER.indexOf(dictType)
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }

  private formatTime(time: Date | null): string | null {
    return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : null
  }
}
