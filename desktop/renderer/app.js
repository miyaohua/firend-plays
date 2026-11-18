const state = {
  apiBase: '',
  version: '',
  types: [],
  featured: [],
  mine: [],
  mineError: '',
  selectedType: '',
  selectedGun: '',
  view: 'featured',
  user: null,
  captcha: null,
  registerCaptcha: null,
  keyword: '',
  adContact: '2542571191@qq.com',
  siteUrl: 'http://localhost:5173',
  ads: [],
  adIndex: 0,
  shownAdIds: new Set(),
  adTimer: null,
  confirmAction: null,
  loading: false,
}

const dom = {
  typeList: document.getElementById('typeList'),
  gunList: document.getElementById('gunList'),
  codeList: document.getElementById('codeList'),
  status: document.getElementById('status'),
  aboutVersion: document.getElementById('aboutVersion'),
  aboutApi: document.getElementById('aboutApi'),
  aboutModal: document.getElementById('aboutModal'),
  version: document.getElementById('version'),
  refresh: document.getElementById('refresh'),
  toast: document.getElementById('toast'),
  viewSwitch: document.getElementById('viewSwitch'),
  loginBtn: document.getElementById('loginBtn'),
  userBox: document.getElementById('userBox'),
  userName: document.getElementById('userName'),
  submitBtn: document.getElementById('submitBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  loginModal: document.getElementById('loginModal'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  loginCaptcha: document.getElementById('loginCaptcha'),
  captchaField: document.getElementById('captchaField'),
  captchaImage: document.getElementById('captchaImage'),
  loginError: document.getElementById('loginError'),
  loginSubmit: document.getElementById('loginSubmit'),
  registerModal: document.getElementById('registerModal'),
  regUsername: document.getElementById('regUsername'),
  regPassword: document.getElementById('regPassword'),
  regConfirm: document.getElementById('regConfirm'),
  regPhone: document.getElementById('regPhone'),
  regNickname: document.getElementById('regNickname'),
  regCaptcha: document.getElementById('regCaptcha'),
  regCaptchaField: document.getElementById('regCaptchaField'),
  regCaptchaImage: document.getElementById('regCaptchaImage'),
  regError: document.getElementById('regError'),
  regSubmit: document.getElementById('regSubmit'),
  submitModal: document.getElementById('submitModal'),
  submitType: document.getElementById('submitType'),
  submitGun: document.getElementById('submitGun'),
  submitCode: document.getElementById('submitCode'),
  submitRemark: document.getElementById('submitRemark'),
  submitError: document.getElementById('submitError'),
  submitConfirm: document.getElementById('submitConfirm'),
  searchInput: document.getElementById('searchInput'),
  toolbar: document.getElementById('toolbar'),
  adSlot: document.getElementById('adSlot'),
  registerLink: document.getElementById('registerLink'),
  adContact: document.getElementById('adContact'),
  adCopyBtn: document.getElementById('adCopyBtn'),
  adModal: document.getElementById('adModal'),
  confirmModal: document.getElementById('confirmModal'),
  confirmTitle: document.getElementById('confirmTitle'),
  confirmMessage: document.getElementById('confirmMessage'),
  confirmOk: document.getElementById('confirmOk'),
}

let toastTimer = null

/** 轻提示 */
function showToast(message) {
  dom.toast.textContent = message
  dom.toast.classList.add('is-visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => dom.toast.classList.remove('is-visible'), 1800)
}

function setStatus(status) {
  dom.status.className = `status status--${status}`
}

/** 去掉 Electron IPC 包装的错误前缀，给用户看干净的原因 */
function normalizeError(error) {
  const raw = error instanceof Error ? error.message : String(error)
  return raw.replace(/^Error invoking remote method '[^']+':\s*/, '').replace(/^Error:\s*/, '')
}

function showModal(modal) {
  modal.hidden = false
}

/** 打开通用确认弹窗，确认后执行 action */
function openConfirm(title, message, action) {
  state.confirmAction = action
  dom.confirmTitle.textContent = title
  dom.confirmMessage.textContent = message
  showModal(dom.confirmModal)
}

async function runConfirmAction() {
  const action = state.confirmAction
  state.confirmAction = null
  hideModal(dom.confirmModal)
  if (action) await action()
}

function hideModal(modal) {
  modal.hidden = true
}

function featuredCountOf(dictType) {
  const group = state.featured.find((item) => item.dictType === dictType)
  return (group?.guns ?? []).reduce((sum, gun) => sum + gun.codes.length, 0)
}

/** 左侧分类数量：精选视角看精选数，我的提交视角看自己的数量 */
function countOf(dictType) {
  if (state.view === 'mine') return state.mine.filter((record) => record.isMine && record.dictType === dictType).length
  return featuredCountOf(dictType)
}

/** 当前分类/枪械下要展示的码 */
function codesOf(dictType, gunValue) {
  if (state.view === 'mine') {
    return state.mine
      // 列表接口对普通用户返回「我的 ∨ 精选」，这里只保留本人提交的
      .filter((record) => record.isMine && record.dictType === dictType && (!gunValue || record.gunValue === gunValue))
      .map((record) => ({
        id: record.id,
        code: record.code,
        remark: record.remark,
        gunLabel: record.gunLabel,
        isFeatured: record.isFeatured === '1',
      }))
  }

  const group = state.featured.find((item) => item.dictType === dictType)
  if (!group) return []
  const guns = gunValue ? group.guns.filter((gun) => gun.gunValue === gunValue) : group.guns
  return guns.flatMap((gun) => gun.codes.map((item) => ({ ...item, gunLabel: gun.gunLabel, isFeatured: true })))
}

function renderPlaceholder(title, description, withRetry = false) {
  dom.codeList.replaceChildren()

  const wrapper = document.createElement('div')
  wrapper.className = 'placeholder'

  const titleElement = document.createElement('p')
  titleElement.className = 'placeholder__title'
  titleElement.textContent = title
  wrapper.append(titleElement)

  if (description) {
    const descElement = document.createElement('p')
    descElement.className = 'placeholder__desc'
    descElement.textContent = description
    wrapper.append(descElement)
  }

  if (withRetry) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'button button--primary'
    button.textContent = '重新加载'
    button.addEventListener('click', loadData)
    wrapper.append(button)
  }

  dom.codeList.append(wrapper)
}

function renderTypes() {
  dom.typeList.replaceChildren()

  for (const typeItem of state.types) {
    const count = countOf(typeItem.dictType)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'type-item'
    if (state.selectedType === typeItem.dictType) button.classList.add('is-active')
    if (count === 0) button.classList.add('is-empty')

    const name = document.createElement('span')
    name.textContent = typeItem.dictName

    const badge = document.createElement('span')
    badge.className = 'type-item__count'
    badge.textContent = String(count)

    button.append(name, badge)
    button.addEventListener('click', () => selectType(typeItem.dictType))
    dom.typeList.append(button)
  }
}

function renderGuns() {
  dom.gunList.replaceChildren()

  const typeItem = state.types.find((item) => item.dictType === state.selectedType)
  if (!typeItem) return

  const createGunButton = (label, value) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'gun-item'
    if (state.selectedGun === value) button.classList.add('is-active')
    button.textContent = label
    button.addEventListener('click', () => selectGun(value))
    dom.gunList.append(button)
  }

  createGunButton('全部', '')
  for (const gun of typeItem.guns) createGunButton(gun.label, gun.value)
}

/** 渲染广告位：有广告则轮播，无广告回退合作占位 */
function renderAdPanel() {
  const ads = state.ads
  const ad = ads.length ? ads[state.adIndex % ads.length] : null
  dom.adSlot.replaceChildren()
  dom.adSlot.className = 'ad-slot'
  dom.adSlot.onclick = null

  if (!ad) {
    const label = document.createElement('span')
    label.className = 'ad-slot__label'
    label.textContent = '广告合作'

    const text = document.createElement('span')
    text.className = 'ad-slot__text'
    text.textContent = '此处预留广告位，支持图片 / 文字链 / 固定展示位合作'

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'ad-slot__action'
    button.textContent = '联系合作'
    button.addEventListener('click', () => {
      dom.adContact.textContent = state.adContact
      showModal(dom.adModal)
    })

    dom.adSlot.append(label, text, button)
    return
  }

  dom.adSlot.classList.add('is-ad')

  if (ad.contentType === 'I' && ad.imageData) {
    const image = document.createElement('img')
    image.className = 'ad-slot__image'
    image.src = ad.imageData
    image.alt = '广告'
    dom.adSlot.append(image)
  } else {
    const label = document.createElement('span')
    label.className = 'ad-slot__label'
    label.textContent = '推广'

    const text = document.createElement('span')
    text.className = 'ad-slot__text'
    text.textContent = ad.text || ''
    dom.adSlot.append(label, text)
  }

  if (ads.length > 1) {
    const dots = document.createElement('div')
    dots.className = 'ad-slot__dots'
    ads.forEach((item, index) => {
      const dot = document.createElement('button')
      dot.type = 'button'
      dot.className = 'ad-slot__dot'
      if (index === state.adIndex % ads.length) dot.classList.add('is-active')
      dot.addEventListener('click', (event) => {
        event.stopPropagation()
        state.adIndex = index
        renderAdPanel()
        scheduleAdRotation()
      })
      dots.append(dot)
    })
    dom.adSlot.append(dots)
  }

  if (ad.linkUrl) {
    dom.adSlot.classList.add('is-clickable')
    dom.adSlot.onclick = () => {
      window.desktop.reportAd({ id: ad.id, type: 'click' }).catch(() => {})
      window.open(ad.linkUrl, '_blank')
    }
  }

  // 每条广告每次运行只计一次曝光，避免轮播反复累加
  if (!state.shownAdIds.has(ad.id)) {
    state.shownAdIds.add(ad.id)
    window.desktop.reportAd({ id: ad.id, type: 'view' }).catch(() => {})
  }
}

/** 多条广告时每 8 秒轮播一次 */
function scheduleAdRotation() {
  clearInterval(state.adTimer)
  state.adTimer = null
  if (state.ads.length <= 1) return
  state.adTimer = setInterval(() => {
    state.adIndex = (state.adIndex + 1) % state.ads.length
    renderAdPanel()
  }, 8000)
}

async function loadAds() {
  try {
    state.ads = await window.desktop.getAds()
  } catch {
    state.ads = []
  }
  state.adIndex = 0
  renderAdPanel()
  scheduleAdRotation()
}

function renderCodes() {
  const keyword = state.keyword.trim().toLowerCase()
  const allCodes = codesOf(state.selectedType, state.selectedGun)
  const codes = keyword ? allCodes.filter((item) => item.code.toLowerCase().includes(keyword) || (item.remark ?? '').toLowerCase().includes(keyword)) : allCodes

  if (!codes.length) {
    if (keyword) {
      renderPlaceholder('没有匹配的改枪码', `当前分类下没有包含「${state.keyword.trim()}」的改枪码，换个关键词试试`)
      return
    }
    if (state.view === 'mine' && state.mineError) {
      renderPlaceholder('无法获取我的提交', state.mineError, true)
      return
    }
    const typeItem = state.types.find((item) => item.dictType === state.selectedType)
    const scopeText = state.selectedGun ? '该枪械' : '该分类'
    const title = state.view === 'mine' ? '还没有提交过改枪码' : '暂无精选改枪码'
    const description = state.view === 'mine' ? `点击右上角「提交改枪码」，为${typeItem?.dictName ?? ''}${scopeText}录入你的方案` : `${typeItem?.dictName ?? ''}${scopeText}下还没有管理员精选的方案`
    renderPlaceholder(title, description)
    return
  }

  dom.codeList.replaceChildren()

  for (const item of codes) {
    const card = document.createElement('article')
    card.className = 'card'

    const head = document.createElement('div')
    head.className = 'card__head'

    const title = document.createElement('div')
    title.className = 'card__title'

    const gun = document.createElement('span')
    gun.className = 'card__gun'
    gun.textContent = item.gunLabel
    title.append(gun)

    if (item.isFeatured) {
      const tag = document.createElement('span')
      tag.className = 'tag'
      tag.textContent = '精选'
      title.append(tag)
    } else if (state.view === 'mine') {
      const pendingTag = document.createElement('span')
      pendingTag.className = 'tag tag--pending'
      pendingTag.textContent = '待精选'
      title.append(pendingTag)
    }

    const copyButton = document.createElement('button')
    copyButton.type = 'button'
    copyButton.className = 'card__copy'
    copyButton.textContent = '复制'
    copyButton.addEventListener('click', async () => {
      await window.desktop.copy(item.code)
      copyButton.textContent = '已复制'
      showToast('改枪码已复制到剪贴板')
      setTimeout(() => {
        copyButton.textContent = '复制'
      }, 1500)
    })

    head.append(title, copyButton)

    const codeElement = document.createElement('code')
    codeElement.className = 'card__code'
    codeElement.textContent = item.code

    const remark = document.createElement('p')
    remark.className = 'card__remark'

    const remarkLabel = document.createElement('span')
    remarkLabel.className = 'card__remark-label'
    remarkLabel.textContent = '备注'

    const remarkText = document.createElement('span')
    remarkText.className = 'card__remark-text'
    if (!item.remark) remarkText.classList.add('is-empty')
    remarkText.textContent = item.remark || '暂无备注'

    remark.append(remarkLabel, remarkText)
    card.append(head, codeElement, remark)
    dom.codeList.append(card)
  }
}

function renderAll() {
  renderTypes()
  renderGuns()
  renderCodes()
}

function selectType(dictType) {
  state.selectedType = dictType
  state.selectedGun = ''
  renderAll()
}

function selectGun(gunValue) {
  state.selectedGun = gunValue
  renderGuns()
  renderCodes()
}

function switchView(view) {
  if (view === 'mine' && !state.user) {
    openLoginModal()
    return
  }
  state.view = view
  state.selectedGun = ''
  for (const button of dom.viewSwitch.querySelectorAll('.view-switch__item')) {
    button.classList.toggle('is-active', button.dataset.view === view)
  }
  renderAll()
}

function updateAuthUi() {
  const loggedIn = Boolean(state.user)
  dom.loginBtn.hidden = loggedIn
  dom.userBox.hidden = !loggedIn
  dom.viewSwitch.hidden = !loggedIn
  // 未登录时工具栏里没有内容，整行隐藏，避免留白
  dom.toolbar.hidden = !loggedIn
  if (loggedIn) dom.userName.textContent = state.user.nickname || state.user.username
}

async function loadMine() {
  if (!state.user) {
    state.mine = []
    state.mineError = ''
    return
  }
  try {
    const result = await window.desktop.listMine()
    state.mine = result.records ?? []
    state.mineError = ''
  } catch (error) {
    state.mine = []
    state.mineError = normalizeError(error)
  }
}

/** 拉取分类与精选数据 */
async function loadData() {
  if (state.loading) return
  state.loading = true
  setStatus('idle')
  renderPlaceholder('加载中…', '正在从接口拉取精选改枪码')

  try {
    const [types, featured] = await Promise.all([window.desktop.request('/gun/code/options'), window.desktop.request('/gun/code/featured')])
    state.types = types
    state.featured = featured
    setStatus('ok')

    if (!types.length) {
      renderPlaceholder('暂无武器分类', '请先在后台维护武器字典')
      return
    }

    const keepType = types.some((item) => item.dictType === state.selectedType)
    selectType(keepType ? state.selectedType : types[0].dictType)
  } catch (error) {
    setStatus('error')
    renderPlaceholder('加载失败', `${normalizeError(error)}。请确认接口地址可访问后重试。`, true)
  } finally {
    state.loading = false
  }
}

/* ---------------- 登录 ---------------- */

async function refreshCaptcha() {
  try {
    const payload = await window.desktop.getCaptcha()
    state.captcha = payload
    if (payload.enabled) {
      dom.captchaField.hidden = false
      dom.captchaImage.src = payload.captcha
      dom.captchaImage.dataset.uuid = payload.uuid
      dom.loginCaptcha.value = ''
    } else {
      dom.captchaField.hidden = true
    }
  } catch {
    dom.captchaField.hidden = true
  }
}

async function openLoginModal() {
  dom.loginUsername.value = ''
  dom.loginPassword.value = ''
  dom.loginCaptcha.value = ''
  dom.loginError.textContent = ''
  showModal(dom.loginModal)
  dom.loginUsername.focus()
  await refreshCaptcha()
}

async function handleLogin() {
  const username = dom.loginUsername.value.trim()
  const password = dom.loginPassword.value
  const captcha = dom.loginCaptcha.value.trim()
  dom.loginError.textContent = ''

  if (!username || !password) {
    dom.loginError.textContent = '请输入账号和密码'
    return
  }
  if (state.captcha?.enabled && !captcha) {
    dom.loginError.textContent = '请输入验证码'
    return
  }

  dom.loginSubmit.disabled = true
  try {
    const user = await window.desktop.login({ username, password, captcha, uuid: state.captcha?.uuid ?? '' })
    state.user = user
    hideModal(dom.loginModal)
    updateAuthUi()
    showToast(`欢迎回来，${user.nickname || user.username}`)
    await loadMine()
    renderAll()
  } catch (error) {
    dom.loginError.textContent = normalizeError(error)
    await refreshCaptcha()
  } finally {
    dom.loginSubmit.disabled = false
  }
}

function handleLogout() {
  openConfirm('退出登录', '确认退出当前账号吗？退出后需要重新登录才能提交改枪码。', async () => {
    await window.desktop.logout()
    state.user = null
    state.mine = []
    state.mineError = ''
    state.view = 'featured'
    for (const button of dom.viewSwitch.querySelectorAll('.view-switch__item')) {
      button.classList.toggle('is-active', button.dataset.view === 'featured')
    }
    updateAuthUi()
    renderAll()
    showToast('已退出登录')
  })
}

/* ---------------- 注册 ---------------- */

async function refreshRegisterCaptcha() {
  try {
    const payload = await window.desktop.getCaptcha()
    state.registerCaptcha = payload
    if (payload.enabled) {
      dom.regCaptchaField.hidden = false
      dom.regCaptchaImage.src = payload.captcha
      dom.regCaptchaImage.dataset.uuid = payload.uuid
      dom.regCaptcha.value = ''
    } else {
      dom.regCaptchaField.hidden = true
    }
  } catch {
    dom.regCaptchaField.hidden = true
  }
}

function openRegisterModal() {
  hideModal(dom.loginModal)
  dom.regUsername.value = ''
  dom.regPassword.value = ''
  dom.regConfirm.value = ''
  dom.regPhone.value = ''
  dom.regNickname.value = ''
  dom.regCaptcha.value = ''
  dom.regError.textContent = ''
  showModal(dom.registerModal)
  dom.regUsername.focus()
  refreshRegisterCaptcha()
}

async function handleRegister() {
  const username = dom.regUsername.value.trim()
  const password = dom.regPassword.value
  const confirmPassword = dom.regConfirm.value
  const phone = dom.regPhone.value.trim()
  const nickname = dom.regNickname.value.trim()
  const captcha = dom.regCaptcha.value.trim()
  dom.regError.textContent = ''

  if (!/^[a-zA-Z][a-zA-Z0-9]{2,19}$/.test(username)) {
    dom.regError.textContent = '账号需以字母开头，3-20 位字母或数字'
    return
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(password)) {
    dom.regError.textContent = '密码需 6-20 位且同时包含字母与数字'
    return
  }
  if (password !== confirmPassword) {
    dom.regError.textContent = '两次输入的密码不一致'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    dom.regError.textContent = '请输入正确的手机号'
    return
  }
  if (state.registerCaptcha?.enabled && !captcha) {
    dom.regError.textContent = '请输入验证码'
    return
  }

  dom.regSubmit.disabled = true
  try {
    const user = await window.desktop.register({
      username,
      password,
      phone,
      nickname: nickname || undefined,
      captcha,
      uuid: state.registerCaptcha?.uuid ?? '',
    })
    state.user = user
    hideModal(dom.registerModal)
    updateAuthUi()
    showToast(`欢迎加入，${user.nickname || user.username}`)
    await loadMine()
    renderAll()
  } catch (error) {
    dom.regError.textContent = normalizeError(error)
    await refreshRegisterCaptcha()
  } finally {
    dom.regSubmit.disabled = false
  }
}

/* ---------------- 提交改枪码 ---------------- */

function fillGunSelect() {
  const typeItem = state.types.find((item) => item.dictType === dom.submitType.value)
  dom.submitGun.replaceChildren()
  for (const gun of typeItem?.guns ?? []) {
    const option = document.createElement('option')
    option.value = gun.value
    option.textContent = gun.label
    dom.submitGun.append(option)
  }
}

function openSubmitModal() {
  if (!state.user) {
    openLoginModal()
    return
  }

  dom.submitType.replaceChildren()
  for (const typeItem of state.types) {
    const option = document.createElement('option')
    option.value = typeItem.dictType
    option.textContent = typeItem.dictName
    dom.submitType.append(option)
  }
  if (state.selectedType) dom.submitType.value = state.selectedType
  fillGunSelect()

  dom.submitCode.value = ''
  dom.submitRemark.value = ''
  dom.submitError.textContent = ''
  showModal(dom.submitModal)
  dom.submitCode.focus()
}

async function handleSubmitCode() {
  const form = {
    dictType: dom.submitType.value,
    gunValue: dom.submitGun.value,
    code: dom.submitCode.value.trim(),
    remark: dom.submitRemark.value.trim(),
  }
  dom.submitError.textContent = ''

  if (!form.dictType || !form.gunValue) {
    dom.submitError.textContent = '请选择武器分类与枪械'
    return
  }
  if (!form.code) {
    dom.submitError.textContent = '改枪码不能为空'
    return
  }

  dom.submitConfirm.disabled = true
  try {
    await window.desktop.submitCode(form)
    hideModal(dom.submitModal)
    showToast('提交成功，等待管理员精选')
    await loadMine()
    if (state.view === 'mine') renderAll()
  } catch (error) {
    dom.submitError.textContent = normalizeError(error)
  } finally {
    dom.submitConfirm.disabled = false
  }
}

/* ---------------- 启动 ---------------- */

async function refreshAll() {
  await loadData()
  if (state.user) await loadMine()
  await loadAds()
  renderAll()
}

async function bootstrap() {
  const config = await window.desktop.getConfig()
  state.apiBase = config.apiBase
  state.version = config.version
  state.adContact = config.adContact || state.adContact
  state.siteUrl = config.siteUrl || state.siteUrl
  dom.version.textContent = `v${config.version}`
  dom.aboutVersion.textContent = `版本：${config.version}`
  dom.aboutApi.textContent = `接口地址：${config.apiBase}`
  dom.version.addEventListener('click', () => showModal(dom.aboutModal))

  state.user = await window.desktop.getSession()
  updateAuthUi()

  dom.refresh.addEventListener('click', refreshAll)
  dom.searchInput.addEventListener('input', () => {
    state.keyword = dom.searchInput.value
    renderCodes()
  })
  dom.registerLink.addEventListener('click', (event) => {
    event.preventDefault()
    openRegisterModal()
  })
  dom.regCaptchaImage.addEventListener('click', refreshRegisterCaptcha)
  dom.regSubmit.addEventListener('click', handleRegister)
  dom.adCopyBtn.addEventListener('click', async () => {
    await window.desktop.copy(state.adContact)
    showToast('商务邮箱已复制')
  })
  dom.confirmOk.addEventListener('click', runConfirmAction)
  dom.loginBtn.addEventListener('click', openLoginModal)
  dom.logoutBtn.addEventListener('click', handleLogout)
  dom.submitBtn.addEventListener('click', openSubmitModal)
  dom.captchaImage.addEventListener('click', refreshCaptcha)
  dom.loginSubmit.addEventListener('click', handleLogin)
  dom.submitConfirm.addEventListener('click', handleSubmitCode)
  dom.submitType.addEventListener('change', fillGunSelect)

  for (const button of dom.viewSwitch.querySelectorAll('.view-switch__item')) {
    button.addEventListener('click', () => switchView(button.dataset.view))
  }

  for (const element of document.querySelectorAll('[data-close]')) {
    element.addEventListener('click', () => hideModal(document.getElementById(element.dataset.close)))
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideModal(dom.loginModal)
      hideModal(dom.registerModal)
      hideModal(dom.submitModal)
    }
  })

  // 登录框内回车直接提交
  for (const input of [dom.loginUsername, dom.loginPassword, dom.loginCaptcha]) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') handleLogin()
    })
  }

  for (const input of [dom.regUsername, dom.regPassword, dom.regConfirm, dom.regPhone, dom.regNickname, dom.regCaptcha]) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') handleRegister()
    })
  }

  if (state.user) await loadMine()
  await loadData()
  await loadAds()

  // 每 5 分钟自动刷新一次
  setInterval(refreshAll, 5 * 60 * 1000)
}

bootstrap()
