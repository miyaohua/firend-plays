<template>
  <div class="site-shell">
    <header class="site-header">
      <div class="site-header__inner">
        <router-link to="/" class="site-brand">
          <img class="site-brand__logo" src="/favicon.svg" alt="logo" draggable="false" />
          <span class="site-brand__text">
            <span class="site-brand__title">{{ SITE_NAME }}</span>
            <span class="site-brand__subtitle">{{ SITE_SUBTITLE }}</span>
          </span>
        </router-link>

        <nav class="site-nav">
          <router-link to="/" class="site-nav__link" :class="{ 'is-active': isHome }">首页</router-link>
          <button type="button" class="site-nav__link site-nav__link--button" @click="openDownloadPage">下载客户端</button>
          <router-link to="/register" class="site-nav__link">注册</router-link>
          <el-button type="primary" round @click="goAdmin">进入后台</el-button>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <router-view />
    </main>

    <footer class="site-footer">
      <p class="site-footer__line">{{ SITE_NAME }} · 玩家改枪码分享社区</p>
      <p class="site-footer__sub">本站为玩家自建社区站点，与游戏官方无关</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SiteLayout' })
import { RouterConstant } from '@/router/router.constant'
import { SITE_NAME, SITE_SUBTITLE, openDownloadPage } from './constants'

const router = useRouter()
const route = useRoute()

const isHome = computed(() => route.path === '/')

function goAdmin() {
  router.push(RouterConstant.HOME_PAGE_URL)
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
  background: rgba(255, 255, 255, 0.9);
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
    width: 34px;
    height: 34px;
    border-radius: 9px;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.5px;
  }

  &__subtitle {
    font-size: 11px;
    color: #9ca3af;
    line-height: 1.2;
  }
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 24px;

  &__link {
    font-size: 14px;
    color: #4b5563;
    text-decoration: none;
    transition: color 0.2s;

    &:hover,
    &.is-active {
      color: #2563eb;
    }

    &--button {
      padding: 0;
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
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
  }
}
</style>
