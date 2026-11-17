<template>
  <div class="site-shell">
    <header class="site-header">
      <div class="site-header__inner">
        <router-link to="/" class="site-brand">
          <img src="/favicon.svg" alt="logo" class="site-brand__logo" draggable="false" />
          <span class="site-brand__title">{{ appTitle }}</span>
        </router-link>

        <nav class="site-nav">
          <router-link to="/" class="site-nav__link" :class="{ 'is-active': isHome }">首页</router-link>
          <router-link to="/codes" class="site-nav__link" :class="{ 'is-active': isCodes }">精选改枪码</router-link>
          <router-link :to="{ path: '/', hash: '#how-to' }" class="site-nav__link site-nav__link--anchor">如何提交</router-link>
          <el-button type="primary" round @mouseenter="prefetchAdmin" @focus="prefetchAdmin" @click="goAdmin">进入后台</el-button>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <router-view />
    </main>

    <footer class="site-footer">
      <p class="site-footer__line">{{ appTitle }} · 玩家改枪码分享社区</p>
      <p class="site-footer__sub">本站为玩家自建社区站点，与游戏官方无关</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SiteLayout' })
import { RouterConstant } from '@/router/router.constant'

const router = useRouter()
const route = useRoute()

/** 站点标题，与后台共用同一环境变量 */
const appTitle = import.meta.env.VITE_APP_TITLE

const isHome = computed(() => route.path === '/')
const isCodes = computed(() => route.path === RouterConstant.SITE_CODES_URL)

function goAdmin() {
  router.push(RouterConstant.HOME_PAGE_URL)
}

/** 悬浮/聚焦时预取后台首页 chunk（含图表依赖），点击进入时更快 */
function prefetchAdmin() {
  void import('@/views/dashboard/index.vue')
}
</script>

<style lang="scss" scoped>
.site-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: #1f2937;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #eef0f4;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1160px;
    height: 68px;
    margin: 0 auto;
    padding: 0 24px;
  }
}

.site-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;

  &__logo {
    width: 28px;
    height: 28px;
  }

  &__title {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 26px;

  &__link {
    font-size: 14px;
    color: #4b5563;
    text-decoration: none;
    transition: color 0.2s;

    &:hover,
    &.is-active {
      color: #2563eb;
    }
  }
}

.site-main {
  flex: 1;
}

.site-footer {
  padding: 32px 24px;
  text-align: center;
  border-top: 1px solid #eef0f4;

  &__line {
    margin: 0 0 6px;
    font-size: 13px;
    color: #6b7280;
  }

  &__sub {
    margin: 0;
    font-size: 12px;
    color: #9ca3af;
  }
}

@media (max-width: 720px) {
  .site-header__inner {
    padding: 0 16px;
  }

  .site-nav {
    gap: 14px;
  }

  .site-nav__link {
    font-size: 13px;

    &--anchor {
      display: none;
    }
  }
}
</style>
