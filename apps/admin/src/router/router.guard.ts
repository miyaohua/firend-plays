import { router } from '.'
import { RouterConstant } from './router.constant'
import { getAccessToken, toBoolean } from '@/utils'
import type { RouteLocationNormalized } from 'vue-router'

const NProgress = useProgress({ show: toBoolean(import.meta.env.VITE_ROUTER_NPROGRESS, true) })

export async function globalRouterBeforeGuard(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  // 仅在启用进度条且不是同路由跳转时启动（避免重复触发）
  if (from.fullPath !== to.fullPath) NProgress.start()

  const userStore = useUserStore()
  const accessToken = getAccessToken()
  const permissionStore = usePermissionStore()

  // 已登录但要进入登录页 → 回后台首页（必须在公开页放行之前判断，否则会被白名单直接放行）
  if (accessToken && to.path.toLowerCase() === RouterConstant.LOGIN_PAGE_URL) return { path: RouterConstant.HOME_PAGE_URL, replace: true }

  // 公开页面（官网、登录页）无需登录：白名单按路径命中，其余按路由 meta.public 标记命中
  const isPublicPage = to.meta.public === true || RouterConstant.PATH_WHITE_LIST.includes(to.path)
  if (isPublicPage) return true

  // 无 Token 且不是公开页面 → 重定向到登录页（携带回跳地址）
  if (!accessToken) return { path: RouterConstant.LOGIN_PAGE_URL, query: { redirect: to.fullPath } }

  try {
    // 已有角色权限，直接放行
    if (userStore.roles && userStore.roles.length > 0) return
    // 未获取用户信息 → 并行拉取用户信息与路由菜单（两者互不依赖，省一个网络往返）
    await Promise.all([userStore.getInfo(), permissionStore.getRoutes()])
    // 添加动态路由
    for (const route of permissionStore.dynamicRouteList) router.addRoute('Layout', route)
    // 动态路由添加后，重新导航到目标路由（replace: true 避免历史记录）
    return { ...to, replace: true }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('路由守卫异常: ', errMsg)
    // 登录态已不可用：仅本地清理，不调登出接口；错误提示由请求拦截器统一弹出，这里不重复弹
    await userStore.logout()
    return { path: RouterConstant.LOGIN_PAGE_URL, query: { redirect: to.fullPath }, replace: true }
  }
}

export async function globalRouterAfterGuard() {
  NProgress.done()
}
