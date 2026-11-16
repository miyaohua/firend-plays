export const RouterConstant = {
  /** 布局组件路由名称 */
  LAYOUT_NAME: 'Layout',

  /** 登录页路由地址 */
  LOGIN_PAGE_URL: '/login',

  /** 登录页路由名称 */
  LOGIN_PAGE_NAME: 'Login',

  /** 官网首页路由地址 */
  SITE_PAGE_URL: '/',

  /** 官网首页路由名称 */
  SITE_PAGE_NAME: 'Site',

  /** 后台布局容器路径：让出根路径给官网，仅作为动态路由的挂载点，不会被直接访问 */
  LAYOUT_CONTAINER_URL: '/shell',

  /** 主页路由地址 */
  HOME_PAGE_URL: '/dashboard',

  /** 主页路由名称 */
  HOME_PAGE_NAME: 'Dashboard',

  /** 重定向页路由地址 */
  REDIRECT_PAGE_URL: '/redirect',

  /** 重定向页路由名称 */
  REDIRECT_PAGE_NAME: 'Redirect',

  /** 白名单路由路径 */
  PATH_WHITE_LIST: ['/', '/login', '/register'],
}
