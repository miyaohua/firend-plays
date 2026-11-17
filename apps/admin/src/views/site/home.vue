<template>
  <div class="home">
    <section class="home-hero">
      <div class="home-hero__inner">
        <p class="home-hero__badge">三角洲行动 · 玩家改枪码社区</p>
        <h1 class="home-hero__title">把每一把枪<br />调成你顺手的样子</h1>
        <p class="home-hero__desc">汇集社区玩家的改装方案，按「武器分类 → 枪械 → 改枪码」归档，由管理员精选推荐。</p>
        <div class="home-hero__actions">
          <el-button type="primary" size="large" @click="router.push(RouterConstant.SITE_CODES_URL)">浏览精选改枪码</el-button>
          <el-button size="large" @click="router.push(RouterConstant.HOME_PAGE_URL)">进入后台提交</el-button>
        </div>
      </div>
    </section>

    <section class="home-stats">
      <div class="home-stats__inner">
        <div v-for="stat in statItems" :key="stat.label" class="home-stats__item">
          <p class="home-stats__value">{{ stat.value }}</p>
          <p class="home-stats__label">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <section v-if="featuredPreview.length" id="featured" class="home-section">
      <div class="home-section__head">
        <div>
          <h2 class="home-section__title">精选改枪码</h2>
          <p class="home-section__desc">管理员从社区投稿中挑出的方案，点开可查看全部并复制。</p>
        </div>
        <el-button text type="primary" @click="router.push(RouterConstant.SITE_CODES_URL)">查看全部 →</el-button>
      </div>

      <div class="home-featured">
        <article v-for="item in featuredPreview" :key="item.id" class="home-featured__card">
          <p class="home-featured__gun">{{ item.gunLabel }}</p>
          <code class="home-featured__code">{{ item.code }}</code>
          <p class="home-featured__meta">{{ item.remark || '社区投稿' }} · 由 {{ item.author }} 提供</p>
        </article>
      </div>
    </section>

    <section class="home-section home-section--muted">
      <div class="home-section__head">
        <div>
          <h2 class="home-section__title">按武器分类浏览</h2>
          <p class="home-section__desc">选择分类进入改枪码库，查看该分类下所有精选方案。</p>
        </div>
      </div>

      <div class="home-types">
        <router-link v-for="typeItem in statistics?.types ?? []" :key="typeItem.dictType" class="home-types__item" :to="{ path: RouterConstant.SITE_CODES_URL, query: { dictType: typeItem.dictType } }">
          <span class="home-types__name">{{ typeItem.dictName }}</span>
          <span class="home-types__meta">{{ typeItem.featuredCount }} 条精选 / {{ typeItem.gunCount }} 把枪</span>
        </router-link>
        <el-empty v-if="!statistics?.types?.length" :image-size="80" description="暂无武器分类数据" />
      </div>
    </section>

    <section id="how-to" class="home-section">
      <h2 class="home-section__title home-section__title--center">如何提交自己的改枪码</h2>
      <div class="home-steps">
        <div v-for="(step, index) in steps" :key="step.title" class="home-steps__item">
          <span class="home-steps__index">{{ index + 1 }}</span>
          <h3 class="home-steps__title">{{ step.title }}</h3>
          <p class="home-steps__desc">{{ step.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SiteHome' })
import type { Gun } from '@/types'
import { RouterConstant } from '@/router/router.constant'
import { GunCodeRequest } from '@/api/gun/code.request'

const router = useRouter()

const statistics = ref<Gun.Statistics | null>(null)
const featuredGroups = ref<Gun.FeaturedGroup[]>([])

/** 首页只预览最新 6 条精选 */
const featuredPreview = computed(() =>
  featuredGroups.value
    .flatMap((group) => group.guns.flatMap((gun) => gun.codes.map((item) => ({ ...item, gunLabel: gun.gunLabel }))))
    .slice(0, 6)
)

const statItems = computed(() => [
  { label: '收录改枪码', value: statistics.value?.totalCodes ?? 0 },
  { label: '精选方案', value: statistics.value?.featuredCodes ?? 0 },
  { label: '武器分类', value: statistics.value?.typeCount ?? 0 },
  { label: '收录枪械', value: statistics.value?.gunCount ?? 0 },
])

const steps = [
  { title: '登录后台', desc: '使用社区账号登录，进入「枪械管理 → 改枪码」。' },
  { title: '选择分类与枪械', desc: '先选武器分类，再选具体枪械，粘贴你的改枪码并填写备注。' },
  { title: '等待精选', desc: '管理员会从投稿中挑出优质方案，精选后全站可见。' },
]

onMounted(async () => {
  // 公开接口，任一失败都不影响页面其余内容
  const [statisticsResult, featuredResult] = await Promise.allSettled([GunCodeRequest.findStatistics(), GunCodeRequest.findFeatured()])
  if (statisticsResult.status === 'fulfilled') statistics.value = statisticsResult.value
  if (featuredResult.status === 'fulfilled') featuredGroups.value = featuredResult.value
})
</script>

<style lang="scss" scoped>
.home-hero {
  padding: 96px 24px 88px;
  text-align: center;
  background:
    radial-gradient(1000px 420px at 50% -12%, rgba(37, 99, 235, 0.14), transparent 70%),
    linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);

  &__inner {
    max-width: 820px;
    margin: 0 auto;
  }

  &__badge {
    display: inline-block;
    margin: 0 0 20px;
    padding: 6px 14px;
    font-size: 13px;
    color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
    border-radius: 999px;
  }

  &__title {
    margin: 0 0 20px;
    font-size: 46px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.5px;
  }

  &__desc {
    margin: 0 auto 36px;
    max-width: 580px;
    font-size: 16px;
    line-height: 1.8;
    color: #6b7280;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

.home-stats {
  border-top: 1px solid #eef0f4;
  border-bottom: 1px solid #eef0f4;
  background: #ffffff;

  &__inner {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    max-width: 1160px;
    margin: 0 auto;
    padding: 28px 24px;
  }

  &__item {
    text-align: center;

    & + & {
      border-left: 1px solid #eef0f4;
    }
  }

  &__value {
    margin: 0 0 4px;
    font-size: 28px;
    font-weight: 700;
    color: #2563eb;
  }

  &__label {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
  }
}

.home-section {
  max-width: 1160px;
  margin: 0 auto;
  padding: 72px 24px;
  scroll-margin-top: 84px;

  &--muted {
    max-width: none;
    background: #f8fafc;
    border-top: 1px solid #eef0f4;
    border-bottom: 1px solid #eef0f4;

    > * {
      max-width: 1160px;
      margin-left: auto;
      margin-right: auto;
    }
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 32px;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 600;

    &--center {
      text-align: center;
      margin-bottom: 36px;
    }
  }

  &__desc {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }
}

.home-featured {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  &__card {
    padding: 20px;
    background: #ffffff;
    border: 1px solid #eef0f4;
    border-radius: 12px;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    }
  }

  &__gun {
    margin: 0 0 10px;
    font-size: 15px;
    font-weight: 600;
  }

  &__code {
    display: block;
    padding: 10px 12px;
    margin-bottom: 10px;
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #1f2937;
    background: #f8fafc;
    border-radius: 8px;
    word-break: break-all;
  }

  &__meta {
    margin: 0;
    font-size: 12px;
    color: #9ca3af;
  }
}

.home-types {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 20px;
    color: inherit;
    text-decoration: none;
    background: #ffffff;
    border: 1px solid #eef0f4;
    border-radius: 12px;
    transition: border-color 0.2s, transform 0.2s;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(37, 99, 235, 0.4);
    }
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
  }

  &__meta {
    font-size: 12px;
    color: #9ca3af;
  }
}

.home-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  &__item {
    padding: 24px;
    background: #f8fafc;
    border: 1px solid #eef0f4;
    border-radius: 12px;
  }

  &__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-bottom: 14px;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    background: #2563eb;
    border-radius: 50%;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
  }

  &__desc {
    margin: 0;
    font-size: 14px;
    line-height: 1.75;
    color: #6b7280;
  }
}

@media (max-width: 900px) {
  .home-hero__title {
    font-size: 34px;
  }

  .home-stats__inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .home-stats__item + .home-stats__item {
    border-left: none;
  }

  .home-featured,
  .home-types,
  .home-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .home-hero {
    padding: 56px 20px;
  }

  .home-hero__title {
    font-size: 28px;
  }

  .home-hero__actions {
    flex-direction: column;
  }

  .home-featured,
  .home-types,
  .home-steps {
    grid-template-columns: 1fr;
  }
}
</style>
