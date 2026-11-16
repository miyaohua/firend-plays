<template>
  <div class="site-page">
    <header class="site-header">
      <div class="site-header__inner">
        <div class="site-brand">
          <img src="/favicon.svg" alt="logo" class="site-brand__logo" draggable="false" />
          <span class="site-brand__title">{{ appTitle }}</span>
        </div>
        <nav class="site-nav">
          <a class="site-nav__link" href="#features">核心能力</a>
          <a class="site-nav__link" href="#stack">技术栈</a>
          <el-button type="primary" round @click="goAdmin">进入后台</el-button>
        </nav>
      </div>
    </header>

    <section class="site-hero">
      <div class="site-hero__inner">
        <p class="site-hero__badge">Vue 3 · NestJS 12 · TypeScript</p>
        <h1 class="site-hero__title">开箱即用的<br />企业级中后台解决方案</h1>
        <p class="site-hero__desc">权限模型完整落地，容器化开箱可用，前后端 TypeScript 同仓管理。</p>
        <div class="site-hero__actions">
          <el-button type="primary" size="large" @click="goAdmin">进入管理系统</el-button>
          <el-button size="large" @click="goLogin">管理员登录</el-button>
        </div>
      </div>
    </section>

    <section id="features" class="site-section">
      <h2 class="site-section__title">核心能力</h2>
      <p class="site-section__desc">中后台标配功能一次给齐，拿到即用。</p>
      <div class="site-grid">
        <article v-for="feature in features" :key="feature.title" class="site-card">
          <h3 class="site-card__title">{{ feature.title }}</h3>
          <p class="site-card__desc">{{ feature.desc }}</p>
        </article>
      </div>
    </section>

    <section id="stack" class="site-section site-section--muted">
      <h2 class="site-section__title">技术栈</h2>
      <p class="site-section__desc">前端 Vue 3 + Element Plus，后端 NestJS + TypeORM + MySQL + Redis。</p>
      <ul class="site-stack">
        <li v-for="item in stack" :key="item" class="site-stack__item">{{ item }}</li>
      </ul>
    </section>

    <footer class="site-footer">
      <p>{{ appTitle }} · 基于 MIT 协议开源</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Site' })
import { RouterConstant } from '@/router/router.constant'

const router = useRouter()

/** 站点标题，与后台共用同一环境变量 */
const appTitle = import.meta.env.VITE_APP_TITLE

const features = [
  { title: '权限模型', desc: '用户、角色、菜单、部门四级权限，数据范围按机构隔离。' },
  { title: '字典与参数', desc: '字典类型与数据两级维护，Redis 缓存主动失效，改动即时生效。' },
  { title: '服务监控', desc: 'CPU、内存、磁盘、连接池与在线用户实时查看。' },
  { title: '定时任务', desc: 'BullMQ 动态调度，支持手动执行、暂停恢复与执行日志。' },
  { title: '文件管理', desc: '目录树、回收站、秒传与分片上传，按引用计数清理。' },
  { title: '登录防护', desc: '按账号与来源 IP 计数锁定，阈值可配，支持在线解锁。' },
]

const stack = ['Vue 3.5', 'Element Plus', 'Vite 8', 'NestJS 12', 'TypeORM', 'MySQL 8', 'Redis 7', 'BullMQ', 'pnpm monorepo']

function goAdmin() {
  router.push(RouterConstant.HOME_PAGE_URL)
}

function goLogin() {
  router.push(RouterConstant.LOGIN_PAGE_URL)
}
</script>

<style lang="scss" scoped>
.site-page {
  min-height: 100vh;
  color: #1f2937;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.86);
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
  gap: 28px;

  &__link {
    font-size: 14px;
    color: #4b5563;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #2563eb;
    }
  }
}

.site-hero {
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
    max-width: 560px;
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

.site-section {
  max-width: 1160px;
  margin: 0 auto;
  padding: 72px 24px;

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

  &__title {
    margin: 0 0 12px;
    font-size: 28px;
    font-weight: 600;
    text-align: center;
  }

  &__desc {
    margin: 0 0 40px;
    font-size: 15px;
    color: #6b7280;
    text-align: center;
  }
}

.site-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.site-card {
  padding: 26px 24px;
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  }

  &__title {
    margin: 0 0 10px;
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

.site-stack {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  &__item {
    padding: 8px 16px;
    font-size: 14px;
    color: #374151;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
  }
}

.site-footer {
  padding: 32px 24px;
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  border-top: 1px solid #eef0f4;
}

@media (max-width: 900px) {
  .site-hero__title {
    font-size: 34px;
  }

  .site-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .site-nav__link {
    display: none;
  }

  .site-hero {
    padding: 56px 20px;
  }

  .site-hero__title {
    font-size: 28px;
  }

  .site-hero__actions {
    flex-direction: column;
  }

  .site-grid {
    grid-template-columns: 1fr;
  }
}
</style>
