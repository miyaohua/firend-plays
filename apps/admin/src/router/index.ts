import type { App } from 'vue'
import { STATIC_ROUTE_LIST } from './modules/static.route'
import { globalRouterAfterGuard, globalRouterBeforeGuard } from './router.guard'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const { VITE_ROUTER_MODE, VITE_PUBLIC_PATH } = import.meta.env

/** 创建路由实例 */
export const router = createRouter({
  history: VITE_ROUTER_MODE === 'hash' ? createWebHashHistory(VITE_PUBLIC_PATH) : createWebHistory(VITE_PUBLIC_PATH),
  routes: STATIC_ROUTE_LIST,
  // 滚动行为：带 hash 时滚动到对应锚点（如官网区块跳转），否则回到顶部；保留 160ms 等待页面渲染
  // top: 84 为吸顶导航预留高度（vue-router 按 elementTop - top 计算滚动位置），避免锚点标题被导航栏遮挡
  scrollBehavior: (to) =>
    new Promise((resolve) => setTimeout(() => resolve(to.hash ? { el: to.hash, top: 84, behavior: 'smooth' } : { left: 0, top: 0 }), 160)),
})

/** 路由配置函数 */
export async function setupRouter(app: App) {
  // 配置路由全局前置守卫
  router.beforeEach(globalRouterBeforeGuard)

  // 配置路由全局后置守卫
  router.afterEach(globalRouterAfterGuard)

  // 注册挂载路由插件
  app.use(router)

  // 当路由准备好时再执行挂载 https://router.vuejs.org/zh/api/interfaces/Router.html#Methods-isReady
  await router.isReady()
}
