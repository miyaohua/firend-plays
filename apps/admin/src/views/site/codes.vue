<template>
  <div class="codes-page">
    <header class="codes-head">
      <p class="codes-head__crumb">
        <router-link to="/" class="codes-head__link">首页</router-link>
        <span class="codes-head__sep">/</span>
        <span>精选改枪码</span>
      </p>
      <p class="codes-head__desc">按「武器分类 → 枪械 → 改枪码」浏览，支持复制与收藏。</p>
    </header>

    <div v-if="!isLoggedIn" class="codes-tip">
      <span>登录后可以在这里看到自己提交的改枪码，并收藏喜欢的方案</span>
      <router-link :to="{ path: '/login', query: { redirect: '/codes' } }" class="codes-tip__link">去登录 →</router-link>
    </div>

    <div class="codes-body">
      <aside class="codes-types">
        <p class="codes-types__title">武器分类</p>
        <button
          v-for="typeItem in typeList"
          :key="typeItem.dictType"
          type="button"
          class="codes-types__item"
          :class="{ 'is-active': selectedType === typeItem.dictType, 'is-empty': typeItem.count === 0 }"
          @click="selectType(typeItem.dictType)"
        >
          <span class="codes-types__name">{{ typeItem.dictName }}</span>
          <span class="codes-types__count">{{ typeItem.count }}</span>
        </button>
        <el-empty v-if="!typeList.length" :image-size="60" description="暂无分类" />
      </aside>

      <section class="codes-content">
        <div v-if="gunList.length" class="codes-guns">
          <button type="button" class="codes-guns__item" :class="{ 'is-active': selectedGun === '' }" @click="selectGun('')">全部</button>
          <button
            v-for="gunItem in gunList"
            :key="gunItem.value"
            type="button"
            class="codes-guns__item"
            :class="{ 'is-active': selectedGun === gunItem.value }"
            @click="selectGun(gunItem.value)"
          >
            {{ gunItem.label }}
          </button>
        </div>

        <div v-if="isLoggedIn" class="codes-filter">
          <button
            v-for="option in filterOptions"
            :key="option.value"
            type="button"
            class="codes-filter__item"
            :class="{ 'is-active': codeFilter === option.value }"
            @click="codeFilter = option.value"
          >
            {{ option.label }}
            <span class="codes-filter__count">{{ option.count }}</span>
          </button>
        </div>

        <div v-if="sections.length" class="codes-groups">
          <section v-for="section in sections" :key="section.key" class="codes-group">
            <div class="codes-group__head">
              <span class="codes-group__dot" :class="`codes-group__dot--${section.key}`"></span>
              <span class="codes-group__title">{{ section.title }}</span>
              <span class="codes-group__count">{{ section.codes.length }}</span>
              <span class="codes-group__hint">{{ section.hint }}</span>
            </div>

            <div class="codes-list">
              <CodeCard
                v-for="item in section.codes"
                :key="item.id"
                :item="item"
                :tone="section.key as 'featured' | 'mine' | 'favorite'"
                :favorited="favoriteIdSet.has(item.id)"
                @favorite="toggleFavorite"
              />
            </div>
          </section>
        </div>

        <el-empty v-else :image-size="100" :description="emptyDescription">
          <el-button type="primary" @click="router.push('/')">回到首页</el-button>
        </el-empty>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SiteCodes' })
import type { Gun } from '@/types'
import { TipModal, getAccessToken } from '@/utils'
import { GunCodeRequest } from '@/api/gun/code.request'
import CodeCard from './components/CodeCard.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/** 全部分类与枪械（公开选项接口，含某分类下全部枪械） */
const options = ref<Gun.TypeOption[]>([])
const featuredGroups = ref<Gun.FeaturedGroup[]>([])
/** 当前登录用户自己提交的码（未登录为空） */
const myRecords = ref<Gun.CodeItem[]>([])
/** 当前登录用户的收藏（用于「我的收藏」筛选与收藏态标记） */
const favoriteRecords = ref<Gun.FavoriteItem[]>([])
const favoriteIds = ref<string[]>([])
const selectedType = ref('')
/** 空字符串表示「全部枪械」，默认展示该分类下所有改枪码 */
const selectedGun = ref('')
/** 快速筛选：全部 / 社区精选 / 我的提交 / 我的收藏 */
const codeFilter = ref<'all' | 'featured' | 'mine' | 'favorites'>('all')

const isLoggedIn = computed(() => Boolean(getAccessToken()))
const favoriteIdSet = computed(() => new Set(favoriteIds.value))

/** 合并「精选」「我的」「收藏」：收藏单独并入，避免取消精选后收藏项消失 */
const displayCodes = computed<Gun.CodeView[]>(() => {
  const codes: Gun.CodeView[] = []

  const pushCode = (code: Gun.CodeView) => {
    const existingCode = codes.find((codeItem) => codeItem.id === code.id)
    if (existingCode) {
      existingCode.isMine = existingCode.isMine || code.isMine
      existingCode.isFeatured = existingCode.isFeatured || code.isFeatured
      return
    }
    codes.push({ ...code })
  }

  for (const group of featuredGroups.value) {
    for (const gunItem of group.guns) {
      for (const item of gunItem.codes) {
        pushCode({ id: item.id, code: item.code, remark: item.remark, isMine: false, isFeatured: true, dictType: group.dictType, gunValue: gunItem.gunValue, gunLabel: gunItem.gunLabel })
      }
    }
  }

  for (const record of myRecords.value) {
    if (!record.isMine) continue
    pushCode({
      id: record.id,
      code: record.code,
      remark: record.remark,
      isMine: true,
      isFeatured: record.isFeatured === '1',
      dictType: record.dictType,
      gunValue: record.gunValue,
      gunLabel: record.gunLabel,
    })
  }

  // 收藏里可能包含「已被取消精选且非本人」的历史码，单独并进来
  for (const record of favoriteRecords.value) {
    pushCode({
      id: record.id,
      code: record.code,
      remark: record.remark,
      isMine: record.isMine,
      isFeatured: record.isFeatured === '1',
      dictType: record.dictType,
      gunValue: record.gunValue,
      gunLabel: record.gunLabel,
    })
  }

  return codes
})

/** 左侧分类：展示全部武器分类，数量为当前可展示的码总数 */
const typeList = computed(() =>
  options.value.map((typeItem) => ({
    dictType: typeItem.dictType,
    dictName: typeItem.dictName,
    count: displayCodes.value.filter((codeItem) => codeItem.dictType === typeItem.dictType).length,
  }))
)

/** 当前分类下的全部枪械（不只有码的枪械） */
const gunList = computed(() => options.value.find((typeItem) => typeItem.dictType === selectedType.value)?.guns ?? [])

const codeList = computed(() => {
  const typeCodes = displayCodes.value.filter((codeItem) => codeItem.dictType === selectedType.value)
  const filteredCodes = selectedGun.value ? typeCodes.filter((codeItem) => codeItem.gunValue === selectedGun.value) : typeCodes
  const gunOrderMap = new Map(gunList.value.map((gunItem, index) => [gunItem.value, index]))
  return [...filteredCodes].sort((left, right) => {
    const orderDiff = (gunOrderMap.get(left.gunValue) ?? Number.MAX_SAFE_INTEGER) - (gunOrderMap.get(right.gunValue) ?? Number.MAX_SAFE_INTEGER)
    if (orderDiff !== 0) return orderDiff
    return Number(right.isFeatured) - Number(left.isFeatured)
  })
})

/** 分区：社区精选 / 我的提交 / 我的收藏 */
const featuredCodes = computed(() => codeList.value.filter((item) => item.isFeatured))
const mineCodes = computed(() => codeList.value.filter((item) => item.isMine && !item.isFeatured))
const favoriteCodes = computed(() => codeList.value.filter((item) => favoriteIdSet.value.has(item.id)))

const filterOptions = computed(() => [
  { value: 'all' as const, label: '全部', count: featuredCodes.value.length + mineCodes.value.length },
  { value: 'featured' as const, label: '社区精选', count: featuredCodes.value.length },
  { value: 'mine' as const, label: '我的提交', count: mineCodes.value.length },
  { value: 'favorites' as const, label: '我的收藏', count: favoriteCodes.value.length },
])

const sections = computed(() => {
  const allSections = [
    { key: 'featured', title: '社区精选', hint: '管理员挑选的推荐方案', codes: featuredCodes.value },
    { key: 'mine', title: '我的提交', hint: '未精选的方案仅自己可见', codes: mineCodes.value },
    { key: 'favorite', title: '我的收藏', hint: '你收藏的方案', codes: favoriteCodes.value },
  ].filter((section) => section.codes.length > 0)

  if (codeFilter.value === 'favorites') return allSections.filter((section) => section.key === 'favorite')
  if (codeFilter.value === 'featured') return allSections.filter((section) => section.key === 'featured')
  if (codeFilter.value === 'mine') return allSections.filter((section) => section.key === 'mine')
  return allSections.filter((section) => section.key !== 'favorite')
})

const emptyDescription = computed(() => {
  if (!selectedType.value) return '暂无改枪码'
  if (codeFilter.value === 'favorites') return '该分类下还没有收藏的改枪码'
  if (codeFilter.value === 'mine') return '该分类下你还没有提交改枪码'
  if (codeFilter.value === 'featured') return '该分类暂无精选方案'
  if (selectedGun.value) return isLoggedIn.value ? '该枪械暂无精选或你提交的改枪码' : '该枪械暂无精选方案'
  return isLoggedIn.value ? '该分类暂无精选或你提交的改枪码' : '该分类暂无精选方案'
})

/** 切换分类：默认「全部枪械」 */
function selectType(dictType: string) {
  selectedType.value = dictType
  selectedGun.value = ''
  router.replace({ path: '/codes', query: { dictType } })
}

function selectGun(gunValue: string) {
  selectedGun.value = gunValue
}

/** 收藏 / 取消收藏；未登录时引导登录 */
async function toggleFavorite(item: Gun.CodeView) {
  if (!isLoggedIn.value) {
    TipModal.msgWarning('登录后才能收藏改枪码')
    router.push({ path: '/login', query: { redirect: `/codes?dictType=${item.dictType}` } })
    return
  }

  const result = await GunCodeRequest.toggleFavorite({ codeId: item.id })
  favoriteIds.value = result.favorited ? [...favoriteIds.value, item.id] : favoriteIds.value.filter((id) => id !== item.id)
  TipModal.msgSuccess(result.favorited ? '已加入收藏' : '已取消收藏')
}

onMounted(async () => {
  const [optionsResult, featuredResult] = await Promise.allSettled([GunCodeRequest.getOptions(), GunCodeRequest.findFeatured()])
  if (optionsResult.status === 'fulfilled') options.value = optionsResult.value
  if (featuredResult.status === 'fulfilled') featuredGroups.value = featuredResult.value

  // 已登录时额外拉取自己的改枪码与收藏（失败不影响公开精选展示）
  if (isLoggedIn.value) {
    try {
      // 公开页不会走路由守卫，需先拉一次用户信息以预热角色/权限缓存，否则列表接口会因缓存缺失 fail-closed
      await userStore.getInfo()
      const [ownList, favoriteList] = await Promise.all([GunCodeRequest.findList({ pageNo: 1, pageSize: 200, scope: 'mine' }), GunCodeRequest.findFavorites()])
      myRecords.value = ownList.records
      favoriteRecords.value = favoriteList
      favoriteIds.value = favoriteList.map((record) => record.id)
    } catch {
      myRecords.value = []
      favoriteRecords.value = []
      favoriteIds.value = []
    }
  }

  const queryType = typeof route.query.dictType === 'string' ? route.query.dictType : ''
  const queryTypeExists = typeList.value.some((typeItem) => typeItem.dictType === queryType)
  const defaultType = queryTypeExists ? queryType : options.value[0]?.dictType ?? ''
  if (defaultType) selectType(defaultType)
})
</script>

<style lang="scss" scoped>
.codes-page {
  max-width: 1160px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.codes-head {
  margin-bottom: 24px;

  &__crumb {
    margin: 0 0 12px;
    font-size: 13px;
    color: #9ca3af;
  }

  &__link {
    color: #6b7280;
    text-decoration: none;

    &:hover {
      color: #2563eb;
    }
  }

  &__sep {
    margin: 0 6px;
  }

  &__desc {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }
}

.codes-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #4b5563;
  background: rgba(37, 99, 235, 0.06);
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 10px;

  &__link {
    flex-shrink: 0;
    color: #2563eb;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.codes-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.codes-types {
  width: 200px;
  flex-shrink: 0;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 12px;

  &__title {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 12px;
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background: #f3f4f6;
    }

    &.is-active {
      color: #ffffff;
      background: #2563eb;

      .codes-types__count {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.24);
      }
    }

    /* 未选中且无数据：略淡但保持可读；排除选中态，避免覆盖白字 */
    &.is-empty:not(.is-active) {
      color: #6b7280;
    }
  }

  &__count {
    min-width: 22px;
    padding: 1px 7px;
    font-size: 12px;
    text-align: center;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
  }
}

.codes-content {
  flex: 1;
  min-width: 0;
}

.codes-guns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;

  &__item {
    padding: 7px 14px;
    font-size: 13px;
    color: #4b5563;
    background: #f3f4f6;
    border: 1px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;

    &:hover {
      background: #e5e7eb;
    }

    &.is-active {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.4);
    }
  }
}

.codes-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef0f4;

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    color: #4b5563;
    background: #f3f4f6;
    border: 1px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;

    &:hover {
      background: #e5e7eb;
    }

    &.is-active {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.4);
    }
  }

  &__count {
    min-width: 18px;
    padding: 0 5px;
    font-size: 11px;
    line-height: 16px;
    text-align: center;
    color: #6b7280;
    background: #ffffff;
    border-radius: 999px;
  }
}

.codes-groups {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.codes-group {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--featured {
      background: #f59e0b;
    }

    &--mine {
      background: #2563eb;
    }

    &--favorite {
      background: #7c3aed;
    }
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }

  &__count {
    min-width: 20px;
    padding: 0 6px;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
  }

  &__hint {
    font-size: 12px;
    color: #9ca3af;
  }
}

.codes-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (max-width: 900px) {
  .codes-body {
    flex-direction: column;
  }

  .codes-types {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    &__title {
      width: 100%;
      margin-bottom: 4px;
    }

    &__item {
      width: auto;
      margin-bottom: 0;
    }
  }
}
</style>
