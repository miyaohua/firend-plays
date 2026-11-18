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
  /** 获取图片验证码 */
  getCaptcha: () => ipcRenderer.invoke('auth:captcha'),
  /** 登录（credentials：username / password / captcha / uuid） */
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  /** 退出登录 */
  logout: () => ipcRenderer.invoke('auth:logout'),

  /** 提交改枪码 */
  submitCode: (form) => ipcRenderer.invoke('gun:submit', form),
  /** 我的提交 */
  listMine: () => ipcRenderer.invoke('gun:mine'),
})
