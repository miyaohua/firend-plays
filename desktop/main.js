// 某些终端环境会设置 ELECTRON_RUN_AS_NODE（例如从 Electron 应用内启动的终端），
// 这会让 Electron 退化成 Node 运行、无法创建窗口，这里提前给出明确提示。
if (!process.versions.electron) {
  console.error('[精选改枪码] 检测到 ELECTRON_RUN_AS_NODE 环境变量，Electron 被当作 Node 运行。')
  console.error('请在普通终端启动，或先执行：env -u ELECTRON_RUN_AS_NODE npm start')
  process.exit(1)
}

const { app, BrowserWindow, Menu, clipboard, ipcMain, shell } = require('electron')
const path = require('node:path')

/** 接口地址：优先命令行 --api-base=xxx，其次环境变量 DESKTOP_API_BASE，最后本地默认 */
function resolveApiBase() {
  const argument = process.argv.find((item) => item.startsWith('--api-base='))
  const fromArgument = argument ? argument.slice('--api-base='.length) : ''
  return (fromArgument || process.env.DESKTOP_API_BASE || 'http://localhost:3000/api').replace(/\/$/, '')
}

const API_BASE = resolveApiBase()

/** 官网地址：桌面端「注册」跳转用，可用 DESKTOP_SITE_URL 覆盖 */
const SITE_URL = process.env.DESKTOP_SITE_URL || 'http://localhost:5173'

/** 当前登录会话：令牌只保存在主进程，渲染进程拿不到 */
let session = null

/** 用 refreshToken 换新令牌；失败则清空会话 */
async function refreshSession() {
  if (!session?.refreshToken) return false

  try {
    const response = await fetch(`${API_BASE}/auth/refreshToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
    const payload = await response.json()
    if (payload.code !== 200) {
      session = null
      return false
    }
    session.accessToken = payload.data.accessToken
    session.refreshToken = payload.data.refreshToken
    return true
  } catch {
    session = null
    return false
  }
}

/** 统一请求方法：自动带令牌、401 时尝试刷新并重试一次 */
async function requestApi(requestPath, options = {}) {
  const { method = 'GET', body, auth = false } = options

  const headers = { 'Content-Type': 'application/json' }
  if (auth && session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`

  const requestBody = body === undefined ? undefined : JSON.stringify(body)
  const sendRequest = () => fetch(`${API_BASE}${requestPath}`, { method, headers, body: requestBody })

  let response
  try {
    response = await sendRequest()
  } catch {
    throw new Error(`无法连接接口：${API_BASE}`)
  }

  // accessToken 过期：用 refreshToken 换新令牌后重试一次
  if (response.status === 401 && auth && (await refreshSession())) {
    headers.Authorization = `Bearer ${session.accessToken}`
    try {
      response = await sendRequest()
    } catch {
      throw new Error(`无法连接接口：${API_BASE}`)
    }
  }

  const text = await response.text()
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`接口返回异常（HTTP ${response.status}）`)
  }

  if (payload.code !== 200) {
    if (auth && payload.code === 401) session = null
    throw new Error(payload.message || `接口返回异常（HTTP ${response.status}）`)
  }
  return payload.data
}

/** 给渲染进程的会话信息（不包含任何令牌） */
function currentSession() {
  if (!session?.user) return null
  return {
    username: session.user.username,
    nickname: session.user.nickname,
    roles: session.user.roles,
    permissions: session.user.permissions,
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 980,
    minHeight: 640,
    title: '改枪坊',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  window.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  // 外部链接一律用系统浏览器打开，避免在应用内跳出站点
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

ipcMain.handle('app:config', () => ({
  apiBase: API_BASE,
  version: app.getVersion(),
  platform: process.platform,
  adContact: process.env.DESKTOP_AD_CONTACT || '2542571191@qq.com',
  siteUrl: SITE_URL,
}))

/** 公开接口（分类选项、精选列表） */
ipcMain.handle('api:request', (_event, requestPath) => requestApi(requestPath))

/** 登录：先登录拿令牌，再拉一次 getInfo 预热角色/权限缓存，否则受保护接口会 fail-closed */
ipcMain.handle('auth:login', async (_event, credentials) => {
  const tokens = await requestApi('/auth/login', { method: 'POST', body: credentials })
  session = { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: null }

  const info = await requestApi('/auth/getInfo', { auth: true })
  session.user = {
    username: info.user.username,
    nickname: info.user.nickname,
    roles: info.roles,
    permissions: info.permissions,
  }
  return currentSession()
})

ipcMain.handle('auth:sendSms', (_event, payload = {}) => {
  const { scene, phone } = payload
  if (!['register', 'login', 'reset', 'bind'].includes(scene)) throw new Error('验证码场景不合法')
  if (!/^1[3-9]\d{9}$/.test(String(phone))) throw new Error('请输入正确的手机号')
  return requestApi('/auth/sms/send', { method: 'POST', body: { scene, phone } })
})

ipcMain.handle('auth:loginBySms', async (_event, payload = {}) => {
  const { phone, code } = payload
  const tokens = await requestApi('/auth/login/sms', { method: 'POST', body: { phone, code } })
  session = { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: null }

  const info = await requestApi('/auth/getInfo', { auth: true })
  session.user = {
    username: info.user.username,
    nickname: info.user.nickname,
    roles: info.roles,
    permissions: info.permissions,
  }
  return currentSession()
})

ipcMain.handle('auth:resetPassword', (_event, payload = {}) => {
  const { phone, code, password } = payload
  return requestApi('/auth/resetPassword', { method: 'POST', body: { phone, code, password } })
})

ipcMain.handle('auth:register', async (_event, form) => {
  const tokens = await requestApi('/auth/register', { method: 'POST', body: form })
  session = { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: null }

  const info = await requestApi('/auth/getInfo', { auth: true })
  session.user = {
    username: info.user.username,
    nickname: info.user.nickname,
    roles: info.roles,
    permissions: info.permissions,
  }
  return currentSession()
})

ipcMain.handle('auth:logout', async () => {
  if (session?.accessToken) {
    try {
      await requestApi('/auth/logout', { method: 'POST', auth: true })
    } catch {
      // 登出接口失败不影响本地清场
    }
  }
  session = null
  return true
})

ipcMain.handle('auth:session', () => currentSession())

/** 个人资料（同时刷新鉴权缓存） */
ipcMain.handle('auth:profile', () => requestApi('/auth/getInfo', { auth: true }))

/** 我的收藏列表（个人主页统计用） */
ipcMain.handle('gun:favorites', () => requestApi('/gun/code/favorite/list', { auth: true }))

/** 当前用户收藏的改枪码 ID 列表 */
ipcMain.handle('gun:favoriteIds', () => requestApi('/gun/code/favorite/ids', { auth: true }))

/** 收藏 / 取消收藏 */
ipcMain.handle('gun:favoriteToggle', (_event, codeId) => requestApi('/gun/code/favorite/toggle', { method: 'POST', body: { codeId }, auth: true }))

/** 修改本人提交的改枪码 */
ipcMain.handle('gun:update', (_event, form) => requestApi('/gun/code/update', { method: 'PUT', body: form, auth: true }))

/** 删除本人提交的改枪码 */
ipcMain.handle('gun:delete', (_event, ids) => requestApi(`/gun/code/delete?ids=${encodeURIComponent(ids)}`, { method: 'DELETE', auth: true }))

/** 修改密码 */
ipcMain.handle('auth:changePassword', (_event, form) => requestApi('/auth/changePassword', { method: 'PUT', body: form, auth: true }))

/** 绑定手机号 */
ipcMain.handle('auth:bindPhone', (_event, form) => requestApi('/auth/bindPhone', { method: 'POST', body: form, auth: true }))

/** 当前广告：图片在主进程取回转 data URL，避免放宽渲染进程 CSP */
ipcMain.handle('ad:current', async () => {
  const ads = await requestApi('/ad/current?position=desktop-slot')

  return Promise.all(
    ads.map(async (ad) => {
      if (ad.contentType !== 'I' || !ad.imageUrl) return { ...ad, imageData: null }
      try {
        const imageUrl = /^https?:/i.test(ad.imageUrl) ? ad.imageUrl : `${API_BASE}/${String(ad.imageUrl).replace(/^\//, '')}`
        const response = await fetch(imageUrl)
        if (!response.ok) return { ...ad, imageData: null }
        const buffer = Buffer.from(await response.arrayBuffer())
        const mime = response.headers.get('content-type') || 'image/png'
        return { ...ad, imageData: `data:${mime};base64,${buffer.toString('base64')}` }
      } catch {
        return { ...ad, imageData: null }
      }
    }),
  )
})

/** 广告曝光 / 点击上报 */
ipcMain.handle('ad:report', (_event, payload = {}) => {
  const { id, type } = payload
  if (!id || !['view', 'click'].includes(type)) throw new Error('广告上报参数不合法')
  return requestApi(`/ad/${type}`, { method: 'POST', body: { id } })
})

/** 图片验证码（公开接口） */
ipcMain.handle('auth:captcha', () => requestApi('/auth/captcha'))

/** 提交改枪码 */
ipcMain.handle('gun:submit', (_event, form) => requestApi('/gun/code/create', { method: 'POST', body: form, auth: true }))

/** 我的提交 */
ipcMain.handle('gun:mine', () => requestApi('/gun/code/list?pageNo=1&pageSize=200&scope=mine', { auth: true }))

/** 复制走系统剪贴板，避免浏览器权限与安全上下文限制 */
ipcMain.handle('clipboard:write', (_event, text) => {
  clipboard.writeText(text)
  return true
})

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
