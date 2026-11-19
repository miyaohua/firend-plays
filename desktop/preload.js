const { contextBridge, ipcRenderer } = require('electron')

/** 只暴露必要能力，渲染进程拿不到 Node、也拿不到令牌 */
contextBridge.exposeInMainWorld('desktop', {
  /** 取运行配置（接口地址、版本号） */
  getConfig: () => ipcRenderer.invoke('app:config'),
  /** 公开接口 GET 请求（由主进程代理，天然绕开跨域限制） */
  request: (requestPath) => ipcRenderer.invoke('api:request', requestPath),
  /** 写入系统剪贴板 */
  copy: (text) => ipcRenderer.invoke('clipboard:write', text),

  /** 当前登录会话（不含令牌） */
  getSession: () => ipcRenderer.invoke('auth:session'),
  /** 个人资料 */
  getProfile: () => ipcRenderer.invoke('auth:profile'),
  /** 我的收藏列表 */
  getFavorites: () => ipcRenderer.invoke('gun:favorites'),
  /** 收藏的改枪码 ID 列表 */
  getFavoriteIds: () => ipcRenderer.invoke('gun:favoriteIds'),
  /** 收藏 / 取消收藏 */
  toggleFavorite: (codeId) => ipcRenderer.invoke('gun:favoriteToggle', codeId),
  /** 反馈改枪码无效 */
  feedbackCode: (payload) => ipcRenderer.invoke('gun:feedback', payload),
  /** 匿名反馈改枪码无效 */
  feedbackAnonymous: (payload) => ipcRenderer.invoke('gun:feedbackAnonymous', payload),
  /** 修改本人提交的改枪码 */
  updateCode: (form) => ipcRenderer.invoke('gun:update', form),
  /** 删除本人提交的改枪码 */
  deleteCodes: (ids) => ipcRenderer.invoke('gun:delete', ids),
  /** 修改密码 */
  changePassword: (form) => ipcRenderer.invoke('auth:changePassword', form),
  /** 换绑第一步：验证原手机号 */
  verifyBindOld: (code) => ipcRenderer.invoke('auth:verifyBindOld', code),
  /** 绑定手机号 */
  bindPhone: (form) => ipcRenderer.invoke('auth:bindPhone', form),
  /** 获取图片验证码 */
  getCaptcha: () => ipcRenderer.invoke('auth:captcha'),
  /** 登录（credentials：username / password / captcha / uuid） */
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  /** 发送短信验证码（scene：register / login / reset） */
  sendSms: (payload) => ipcRenderer.invoke('auth:sendSms', payload),
  /** 短信验证码登录 */
  loginBySms: (payload) => ipcRenderer.invoke('auth:loginBySms', payload),
  /** 短信验证码重置密码 */
  resetPassword: (payload) => ipcRenderer.invoke('auth:resetPassword', payload),
  /** 自助注册（成功后自动登录） */
  register: (form) => ipcRenderer.invoke('auth:register', form),
  /** 退出登录 */
  logout: () => ipcRenderer.invoke('auth:logout'),

  /** 当前广告（含图片 data URL） */
  getAds: () => ipcRenderer.invoke('ad:current'),
  /** 广告曝光 / 点击上报 */
  reportAd: (payload) => ipcRenderer.invoke('ad:report', payload),

  /** 提交改枪码 */
  submitCode: (form) => ipcRenderer.invoke('gun:submit', form),
  /** 我的提交 */
  listMine: () => ipcRenderer.invoke('gun:mine'),
})
