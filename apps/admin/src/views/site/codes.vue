<template>
  <div class="codes-page">
    <header class="codes-head">
      <p class="codes-head__crumb">
        <router-link to="/" class="codes-head__link">首页</router-link>
        <span class="codes-head__sep">/</span>
        <span>精选改枪码</span>
      </p>
      <h1 class="codes-head__title">精选改枪码</h1>
      <p class="codes-head__desc">按「武器分类 → 枪械 → 改枪码」浏览，点击卡片右上角即可复制。</p>
    </header>

    <div v-if="!isLoggedIn" class="codes-tip">
      <span>登录后可以在这里看到自己提交的改枪码</span>
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
              <article v-for="item in section.codes" :key="item.id" class="codes-card" :class="`is-${section.key}`">
                <div class="codes-card__head">
                  <div class="codes-card__title">
                    <span class="codes-card__gun">{{ item.gunLabel }}</span>
                    <el-tag v-if="item.isFeatured" type="warning" size="small" effect="dark">精选</el-tag>
                    <el-tag v-if="item.isMine" type="primary" size="small" effect="plain">我的</el-tag>
                  </div>
                  <button type="button" class="codes-card__copy" @click="copyCode(item)">
                    {{ copiedId === item.id ? '已复制' : '复制' }}
                  </button>
                </div>
                <code class="codes-card__text">{{ item.code }}</code>
                <p class="codes-card__remark">
                  <span class="codes-card__label">备注</span>
                  <span class="codes-card__remark-text" :class="{ 'is-empty': !item.remark }">{{ item.remark || '暂无备注' }}</span>
                </p>
              </article>
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

/** 页面展示用的改枪码（合并「精选」与「我的」后统一结构） */
interface DisplayCode {
  id: string
  code: string
  remark: string | null
  isMine: boolean
  isFeatured: boolean
  dictType: string
  gunValue: string
  gunLabel: string
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/** 全部分类与枪械（公开选项接口，含某分类下全部枪械） */
const options = ref<Gun.TypeOption[]>([])
const featuredGroups = ref<Gun.FeaturedGroup[]>([])
/** 当前登录用户自己提交的码（未登录为空） */
const myRecords = ref<Gun.CodeItem[]>([])
const selectedType = ref('')
/** 空字符串表示「全部枪械」，默认展示该分类下所有改枪码 */
const selectedGun = ref('')
const copiedId = ref('')
/** 快速筛选：全部 / 只看社区精选 / 只看我的提交 */
const codeFilter = ref<'all' | 'featured' | 'mine'>('all')

const isLoggedIn = computed(() => Boolean(getAccessToken()))

/** 合并「精选」与「我的」：精选来自公开接口，我的来自登录后的列表接口 */
const displayCodes = computed<DisplayCode[]>(() => {
  const codes: DisplayCode[] = []

  for (const group of featuredGroups.value) {
    for (const gunItem of group.guns) {
      for (const item of gunItem.codes) {
        codes.push({ id: item.id, code: item.code, remark: item.remark, isMine: false, isFeatured: true, dictType: group.dictType, gunValue: gunItem.gunValue, gunLabel: gunItem.gunLabel })
      }
    }
  }

  for (const record of myRecords.value) {
    if (!record.isMine) continue
    const existingCode = codes.find((codeItem) => codeItem.id === record.id)
    if (existingCode) {
      existingCode.isMine = true
      continue
    }
    codes.push({
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

  return codes
})

/** 左侧分类：展示全部武器分类，数量为「精选 + 我的」总数 */
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

/** 分区：社区精选 与 我的提交（既精选又自己的码只在精选区展示，并同时带两个标签） */
const featuredCodes = computed(() => codeList.value.filter((item) => item.isFeatured))
const mineCodes = computed(() => codeList.value.filter((item) => item.isMine && !item.isFeatured))
const filterOptions = computed(() => [
  { value: 'all' as const, label: '全部', count: featuredCodes.value.length + mineCodes.value.length },
  { value: 'featured' as const, label: '社区精选', count: featuredCodes.value.length },
  { value: 'mine' as const, label: '我的提交', count: mineCodes.value.length },
])

const sections = computed(() => {
  const allSections = [
    { key: 'featured', title: '社区精选', hint: '管理员挑选的推荐方案', codes: featuredCodes.value },
    { key: 'mine', title: '我的提交', hint: '未精选的方案仅自己可见', codes: mineCodes.value },
  ].filter((section) => section.codes.length > 0)
  if (codeFilter.value === 'featured') return allSections.filter((section) => section.key === 'featured')
  if (codeFilter.value === 'mine') return allSections.filter((section) => section.key === 'mine')
  return allSections
})

const emptyDescription = computed(() => {
  if (!selectedType.value) return '暂无改枪码'
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

/** 复制文本：优先 Clipboard API，失败时回退到隐藏 textarea（非 HTTPS 环境可用） */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 无权限或无用户手势时继续走兜底方案
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}

/** 复制改枪码并给出提示 */
async function copyCode(item: DisplayCode) {
  const copied = await copyText(item.code)
  if (!copied) {
    TipModal.msgError('复制失败，请手动选中复制')
    return
  }
  copiedId.value = item.id
  TipModal.msgSuccess('改枪码已复制')
  setTimeout(() => {
    if (copiedId.value === item.id) copiedId.value = ''
  }, 1500)
}

onMounted(async () => {
  const [optionsResult, featuredResult] = await Promise.allSettled([GunCodeRequest.getOptions(), GunCodeRequest.findFeatured()])
  if (optionsResult.status === 'fulfilled') options.value = optionsResult.value
  if (featuredResult.status === 'fulfilled') featuredGroups.value = featuredResult.value

  // 已登录时额外拉取自己的改枪码（失败不影响公开精选展示）
  if (isLoggedIn.value) {
    try {
      // 公开页不会走路由守卫，需先拉一次用户信息以预热角色/权限缓存，否则列表接口会因缓存缺失 fail-closed
      await userStore.getInfo()
      const ownList = await GunCodeRequest.findList({ pageNo: 1, pageSize: 200, scope: 'mine' })
      myRecords.value = ownList.records
    } catch {
      myRecords.value = []
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

  &__title {
    margin: 0 0 10px;
    font-size: 32px;
    font-weight: 700;
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

.codes-card {
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 12px;

  /* 分区弱着色：精选淡金、我的淡蓝，配合分组标题强化归属 */
  &.is-featured {
    border-color: #fde68a;
  }

  &.is-mine {
    border-color: #bfdbfe;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__gun {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }

  &__copy {
    padding: 5px 14px;
    font-size: 12px;
    color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: rgba(37, 99, 235, 0.16);
    }
  }

  &__text {
    display: block;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
    font-size: 13px;
    line-height: 1.7;
    color: #1f2937;
    background: #f8fafc;
    border-radius: 8px;
    word-break: break-all;
  }

  /* 备注：轻分隔线 + 弱化标签，避免色块与撞色竖条过于抢眼 */
  &__remark {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    padding-top: 10px;
    border-top: 1px dashed #eef0f4;
  }

  &__label {
    flex-shrink: 0;
    font-size: 12px;
    line-height: 21px;
    color: #9ca3af;
  }

  &__remark-text {
    font-size: 13px;
    line-height: 21px;
    color: #4b5563;
    word-break: break-all;

    &.is-empty {
      color: #c0c4cc;
    }
  }
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
