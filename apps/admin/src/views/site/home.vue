<template>
  <div class="home">
    <section class="home-hero">
      <div class="home-hero__inner">
        <p class="home-hero__badge">{{ SITE_NAME }} · {{ SITE_SUBTITLE }}</p>
        <h1 class="home-hero__title">把每一把枪<br />调成你顺手的样子</h1>
        <p class="home-hero__desc">社区玩家共享的改装方案，按「武器分类 → 枪械 → 改枪码」归档，管理员精选推荐，桌面客户端打开即用。</p>
        <div class="home-hero__actions">
          <el-button type="primary" size="large" @click="openDownloadPage">下载客户端</el-button>
          <el-button size="large" @click="router.push(RouterConstant.HOME_PAGE_URL)">进入后台</el-button>
        </div>
        <p class="home-hero__note">支持 macOS（Apple Silicon），Windows 版本即将上线</p>
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

    <section class="home-section">
      <h2 class="home-section__title">客户端能做什么</h2>
      <p class="home-section__desc">一个轻量桌面程序，专注改枪码的浏览、复制与投稿。</p>

      <div class="home-features">
        <article v-for="feature in features" :key="feature.title" class="home-feature">
          <h3 class="home-feature__title">{{ feature.title }}</h3>
          <p class="home-feature__desc">{{ feature.desc }}</p>
        </article>
      </div>
    </section>

    <section v-if="featuredPreview.length" class="home-section home-section--muted">
      <div class="home-section__head">
        <div>
          <h2 class="home-section__title home-section__title--left">精选改枪码</h2>
          <p class="home-section__desc home-section__desc--left">管理员从社区投稿中挑出的方案，客户端内可查看全部并一键复制。</p>
        </div>
        <el-button text type="primary" @click="openDownloadPage">下载客户端查看全部 →</el-button>
      </div>

      <div class="home-preview">
        <article v-for="item in featuredPreview" :key="item.id" class="home-preview__card">
          <p class="home-preview__gun">{{ item.gunLabel }}</p>
          <code class="home-preview__code">{{ item.code }}</code>
          <p class="home-preview__remark">{{ item.remark || '社区投稿' }}</p>
        </article>
      </div>
    </section>

    <section id="download" class="home-section">
      <div class="home-download">
        <div class="home-download__text">
          <h2 class="home-section__title home-section__title--left">下载 {{ SITE_NAME }}</h2>
          <p class="home-section__desc home-section__desc--left">安装到电脑，双击即用；首次打开如被系统拦截，请右键选择「打开」。</p>
        </div>
        <div class="home-download__actions">
          <el-button type="primary" size="large" @click="openDownloadPage">macOS 下载</el-button>
          <el-button size="large" disabled>Windows 即将上线</el-button>
        </div>
      </div>
    </section>

    <section class="home-section home-section--muted">
      <h2 class="home-section__title">三步上手</h2>
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
import { SITE_NAME, SITE_SUBTITLE, openDownloadPage } from './constants'

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

const features = [
  { title: '精选方案', desc: '管理员从社区投稿中挑选，品质有保证。' },
  { title: '分类检索', desc: '按武器分类与枪械逐级浏览，支持关键词搜索。' },
  { title: '一键复制', desc: '点一下就把改枪码复制到剪贴板，进游戏直接粘贴。' },
  { title: '我的收藏', desc: '收藏常看的方案，随时回看，不怕找不到。' },
  { title: '登录投稿', desc: '登录后可提交自己的改枪码，等待管理员精选。' },
  { title: '轻量客户端', desc: '独立桌面程序，不依赖浏览器，打开即用。' },
]

const steps = [
  { title: '下载安装', desc: '从 GitHub Releases 下载对应系统的安装包，双击打开。' },
  { title: '浏览精选', desc: '按分类与枪械找到方案，点「复制」拿到改枪码。' },
  { title: '登录投稿', desc: '登录后可查看自己的提交，并录入新的改枪码。' },
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
  padding: 96px 24px 80px;
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
    margin: 0 auto 34px;
    max-width: 600px;
    font-size: 16px;
    line-height: 1.8;
    color: #6b7280;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  &__note {
    margin: 18px 0 0;
    font-size: 12px;
    color: #9ca3af;
  }
}

.home-stats {
  border-top: 1px solid #eef0f4;
  border-bottom: 1px solid #eef0f4;

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
    max-width: 1160px;
    margin: 0 auto 32px;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 600;
    text-align: center;

    &--left {
      text-align: left;
    }
  }

  &__desc {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
    text-align: center;

    &--left {
      text-align: left;
    }
  }
}

.home-features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 36px;
}

.home-feature {
  padding: 22px;
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  }

  &__title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 600;
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.75;
    color: #6b7280;
  }
}

.home-preview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 1160px;
  margin: 0 auto;

  &__card {
    padding: 18px;
    background: #ffffff;
    border: 1px solid #fde68a;
    border-radius: 12px;
  }

  &__gun {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 600;
  }

  &__code {
    display: block;
    padding: 10px 12px;
    margin-bottom: 10px;
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #1f2937;
    background: #f8fafc;
    border-radius: 8px;
    word-break: break-all;
  }

  &__remark {
    margin: 0;
    font-size: 12px;
    color: #9ca3af;
  }
}

.home-download {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 34px 36px;
  background:
    radial-gradient(600px 220px at 100% 0%, rgba(37, 99, 235, 0.1), transparent 70%),
    #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 16px;

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: 12px;
  }
}

.home-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 1160px;
  margin: 36px auto 0;

  &__item {
    padding: 22px;
    background: #ffffff;
    border: 1px solid #eef0f4;
    border-radius: 12px;
  }

  &__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    background: #2563eb;
    border-radius: 50%;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 600;
  }

  &__desc {
    margin: 0;
    font-size: 13px;
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

  .home-features,
  .home-preview,
  .home-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-download {
    flex-direction: column;
    align-items: flex-start;
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

  .home-features,
  .home-preview,
  .home-steps {
    grid-template-columns: 1fr;
  }
}
</style>
