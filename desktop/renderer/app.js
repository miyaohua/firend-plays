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
  profile: null,
  profileTab: 'mine',
  bindTicket: null,
  feedbackCodeId: null,
  favorites: [],
  favoriteIds: new Set(),
  favoriteCount: 0,
  user: null,
  captcha: null,
  loginMode: 'password',
  smsCountdown: { login: 0, register: 0, bind: 0 },
  smsTimers: { login: null, register: null, bind: null },
  keyword: '',
  adContact: '2542571191@qq.com',
  siteUrl: 'http://localhost:5173',
  ads: [],
  notices: [],
  adIndex: 0,
  shownAdIds: new Set(),
  adTimer: null,
  confirmAction: null,
  loading: false,
}

const dom = {
  appMain: document.getElementById('appMain'),
  typesAside: document.getElementById('typesAside'),
  searchBar: document.getElementById('searchBar'),
  profileView: document.getElementById('profileView'),
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
  userMenuBtn: document.getElementById('userMenuBtn'),
  userAvatar: document.getElementById('userAvatar'),
  userMenu: document.getElementById('userMenu'),
  menuProfile: document.getElementById('menuProfile'),
  menuSubmit: document.getElementById('menuSubmit'),
  menuLogout: document.getElementById('menuLogout'),
  loginModal: document.getElementById('loginModal'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  loginCaptcha: document.getElementById('loginCaptcha'),
  captchaField: document.getElementById('captchaField'),
  captchaImage: document.getElementById('captchaImage'),
  loginError: document.getElementById('loginError'),
  loginSubmit: document.getElementById('loginSubmit'),
  rememberLogin: document.getElementById('rememberLogin'),
  registerModal: document.getElementById('registerModal'),
  regUsername: document.getElementById('regUsername'),
  regPassword: document.getElementById('regPassword'),
  regConfirm: document.getElementById('regConfirm'),
  regPhone: document.getElementById('regPhone'),
  regNickname: document.getElementById('regNickname'),
  regSmsCode: document.getElementById('regSmsCode'),
  regSmsSendBtn: document.getElementById('regSmsSendBtn'),
  smsPhone: document.getElementById('smsPhone'),
  smsCode: document.getElementById('smsCode'),
  smsSendBtn: document.getElementById('smsSendBtn'),
  passwordLoginPanel: document.getElementById('passwordLoginPanel'),
  smsLoginPanel: document.getElementById('smsLoginPanel'),
  forgotLink: document.getElementById('forgotLink'),
  editCodeModal: document.getElementById('editCodeModal'),
  editCodeInput: document.getElementById('editCodeInput'),
  editRemarkInput: document.getElementById('editRemarkInput'),
  editError: document.getElementById('editError'),
  editSubmit: document.getElementById('editSubmit'),
  passwordModal: document.getElementById('passwordModal'),
  oldPassword: document.getElementById('oldPassword'),
  oldPasswordField: document.getElementById('oldPasswordField'),
  newPassword: document.getElementById('newPassword'),
  confirmPassword: document.getElementById('confirmPassword'),
  passwordCode: document.getElementById('passwordCode'),
  passwordSendBtn: document.getElementById('passwordSendBtn'),
  passwordSmsField: document.getElementById('passwordSmsField'),
  passwordHint: document.getElementById('passwordHint'),
  passwordError: document.getElementById('passwordError'),
  passwordSubmit: document.getElementById('passwordSubmit'),
  bindModal: document.getElementById('bindModal'),
  bindTitle: document.getElementById('bindTitle'),
  bindCurrent: document.getElementById('bindCurrent'),
  bindOldPhone: document.getElementById('bindOldPhone'),
  bindStepOld: document.getElementById('bindStepOld'),
  bindStepNew: document.getElementById('bindStepNew'),
  bindOldNext: document.getElementById('bindOldNext'),
  bindBack: document.getElementById('bindBack'),
  bindOldError: document.getElementById('bindOldError'),
  bindOldCode: document.getElementById('bindOldCode'),
  bindOldSendBtn: document.getElementById('bindOldSendBtn'),
  bindPhone: document.getElementById('bindPhone'),
  bindCode: document.getElementById('bindCode'),
  bindSendBtn: document.getElementById('bindSendBtn'),
  bindError: document.getElementById('bindError'),
  bindSubmit: document.getElementById('bindSubmit'),
  forgotModal: document.getElementById('forgotModal'),
  forgotPhone: document.getElementById('forgotPhone'),
  forgotCode: document.getElementById('forgotCode'),
  forgotSendBtn: document.getElementById('forgotSendBtn'),
  forgotPassword: document.getElementById('forgotPassword'),
  forgotConfirm: document.getElementById('forgotConfirm'),
  forgotError: document.getElementById('forgotError'),
  forgotSubmit: document.getElementById('forgotSubmit'),
  feedbackModal: document.getElementById('feedbackModal'),
  feedbackTarget: document.getElementById('feedbackTarget'),
  feedbackReason: document.getElementById('feedbackReason'),
  feedbackError: document.getElementById('feedbackError'),
  feedbackSubmit: document.getElementById('feedbackSubmit'),
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
  noticeBar: document.getElementById('noticeBar'),
  noticeBarText: document.getElementById('noticeBarText'),
  noticeMore: document.getElementById('noticeMore'),
  noticeModal: document.getElementById('noticeModal'),
  noticeList: document.getElementById('noticeList'),
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

/** 关闭弹窗并清空对应表单，避免下次打开残留上次输入 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) modal.hidden = true
  if (modalId === 'loginModal') clearLoginForm()
  if (modalId === 'registerModal') clearRegisterForm()
  if (modalId === 'bindModal') {
    state.bindTicket = null
    dom.bindPhone.value = ''
    dom.bindCode.value = ''
    dom.bindOldCode.value = ''
    dom.bindError.textContent = ''
    dom.bindOldError.textContent = ''
    resetSmsCountdown('bind')
    resetSmsCountdown('bindOld')
  }
  if (modalId === 'passwordModal') resetSmsCountdown('password')
  if (modalId === 'feedbackModal') {
    state.feedbackCodeId = null
    dom.feedbackReason.value = ''
    dom.feedbackError.textContent = ''
  }
  if (modalId === 'forgotModal') {
    dom.forgotPhone.value = ''
    dom.forgotCode.value = ''
    dom.forgotPassword.value = ''
    dom.forgotConfirm.value = ''
    dom.forgotError.textContent = ''
    resetSmsCountdown('forgot')
  }
}

function clearLoginForm() {
  dom.loginUsername.value = ''
  dom.loginPassword.value = ''
  dom.loginCaptcha.value = ''
  dom.smsPhone.value = ''
  dom.smsCode.value = ''
  dom.loginError.textContent = ''
  state.captcha = null
  dom.captchaImage.removeAttribute('src')
  resetSmsCountdown('login')
}

function clearRegisterForm() {
  dom.regUsername.value = ''
  dom.regPassword.value = ''
  dom.regConfirm.value = ''
  dom.regPhone.value = ''
  dom.regNickname.value = ''
  dom.regSmsCode.value = ''
  dom.regError.textContent = ''
  resetSmsCountdown('register')
}

function featuredCountOf(dictType) {
  const group = state.featured.find((item) => item.dictType === dictType)
  return (group?.guns ?? []).reduce((sum, gun) => sum + gun.codes.length, 0)
}

/** 左侧分类数量：精选视角看精选数，我的提交视角看自己的数量 */
function countOf(dictType) {
  if (state.view === 'mine') return state.mine.filter((record) => record.isMine && record.dictType === dictType).length
  if (state.view === 'favorite') return state.favorites.filter((record) => record.dictType === dictType).length
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
        isMine: true,
      }))
  }

  if (state.view === 'favorite') {
    return state.favorites
      .filter((record) => record.dictType === dictType && (!gunValue || record.gunValue === gunValue))
      .map((record) => ({
        id: record.id,
        code: record.code,
        remark: record.remark,
        gunLabel: record.gunLabel,
        isFeatured: record.isFeatured === '1',
        isMine: record.isMine,
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

async function loadNotices() {
  try {
    state.notices = await window.desktop.getNotices()
  } catch {
    state.notices = []
  }
  renderNoticeBar()
}

/** 公告富文本白名单清洗：去掉脚本、事件与不在白名单内的标签/属性 */
function sanitizeNoticeHtml(html) {
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'CODE', 'PRE', 'SPAN', 'DIV'])
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild

  const clean = (node) => {
    for (const child of [...node.children]) {
      if (!allowedTags.has(child.tagName)) {
        child.replaceWith(...child.childNodes)
        clean(node)
        continue
      }
      const isLink = child.tagName === 'A'
      const isImage = child.tagName === 'IMG'
      for (const attribute of [...child.attributes]) {
        const name = attribute.name.toLowerCase()
        const allowed = (isLink && ['href', 'target', 'rel'].includes(name)) || (isImage && ['src', 'alt', 'width', 'height'].includes(name))
        if (name.startsWith('on') || !allowed) {
          child.removeAttribute(attribute.name)
          continue
        }
        if ((name === 'href' || name === 'src') && !/^(https?:|data:|\/)/i.test(attribute.value)) child.removeAttribute(name)
      }
      clean(child)
    }
  }

  clean(root)
  return root.innerHTML
}

function renderNoticeBar() {
  const hasNotice = state.notices.length > 0
  dom.noticeBar.hidden = !hasNotice || state.view === 'profile'
  if (hasNotice) dom.noticeBarText.textContent = state.notices[0].title
}

function openNoticeModal() {
  if (!state.notices.length) return
  dom.noticeList.replaceChildren()
  for (const notice of state.notices) {
    const item = document.createElement('div')
    item.className = 'notice-item'

    const title = document.createElement('p')
    title.className = 'notice-item__title'
    title.textContent = notice.title

    const time = document.createElement('p')
    time.className = 'notice-item__time'
    time.textContent = notice.createTime

    const content = document.createElement('div')
    content.className = 'notice-item__content'
    const raw = String(notice.content || '')
    if (/<[a-z][^>]*>/i.test(raw)) content.innerHTML = sanitizeNoticeHtml(raw)
    else content.textContent = raw

    item.append(title, time, content)
    dom.noticeList.append(item)
  }
  showModal(dom.noticeModal)
}

/** 渲染广告位：有广告则轮播，无广告回退合作占位 *//** 渲染广告位：有广告则轮播，无广告回退合作占位 */
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

/** 构建单张改枪码卡片（列表与个人主页复用） */
function createCodeCard(item) {
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
  } else if (state.view !== 'featured') {
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

  const actions = document.createElement('div')
  actions.className = 'card__actions'

  // 收藏星标（登录后展示）
  if (state.user) {
    const favorited = state.favoriteIds.has(item.id)
    const favoriteButton = document.createElement('button')
    favoriteButton.type = 'button'
    favoriteButton.className = 'card__favorite' + (favorited ? ' is-active' : '')
    favoriteButton.textContent = favorited ? '★' : '☆'
    favoriteButton.title = favorited ? '取消收藏' : '收藏'
    favoriteButton.addEventListener('click', (event) => {
      event.stopPropagation()
      toggleFavorite(item.id)
    })
    actions.append(favoriteButton)
  }

  actions.append(copyButton)

  // 本人投稿可编辑 / 删除
  if (item.isMine) {
    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.className = 'card__mini'
    editButton.textContent = '编辑'
    editButton.addEventListener('click', (event) => {
      event.stopPropagation()
      openEditCode(item)
    })

    const deleteButton = document.createElement('button')
    deleteButton.type = 'button'
    deleteButton.className = 'card__mini card__mini--danger'
    deleteButton.textContent = '删除'
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation()
      handleDeleteCode(item)
    })

    actions.append(editButton, deleteButton)
  }

  // 精选视图允许反馈「改枪码无效」
  if (state.view === 'featured' && !item.isMine) {
    const feedbackButton = document.createElement('button')
    feedbackButton.type = 'button'
    feedbackButton.className = 'card__mini'
    feedbackButton.textContent = '反馈无效'
    feedbackButton.addEventListener('click', (event) => {
      event.stopPropagation()
      openFeedback(item)
    })
    actions.append(feedbackButton)
  }

  head.append(title, actions)

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
  return card
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
    const emptyTexts = {
      mine: ['还没有提交过改枪码', `点击右上角「提交改枪码」，为${typeItem?.dictName ?? ''}${scopeText}录入你的方案`],
      favorite: ['还没有收藏改枪码', '在精选列表点卡片右上角的星标即可收藏'],
      featured: ['暂无精选改枪码', `${typeItem?.dictName ?? ''}${scopeText}下还没有管理员精选的方案`],
    }
    const [title, description] = emptyTexts[state.view] ?? emptyTexts.featured
    renderPlaceholder(title, description)
    return
  }

  dom.codeList.replaceChildren()

  for (const item of codes) dom.codeList.append(createCodeCard(item))
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

async function switchView(view) {
  if ((view === 'mine' || view === 'favorite') && !state.user) {
    openLoginModal()
    return
  }
  state.view = view
  state.selectedGun = ''
  // 进入「我的提交 / 我的收藏」时，切到第一个有内容的分类，避免落在空分类
  if (view === 'mine' && state.user) {
    const hasInCurrent = state.mine.some((record) => record.isMine && record.dictType === state.selectedType)
    if (!hasInCurrent) {
      const firstWithCode = state.types.find((typeItem) => state.mine.some((record) => record.isMine && record.dictType === typeItem.dictType))
      if (firstWithCode) state.selectedType = firstWithCode.dictType
    }
  }
  if (view === 'favorite' && state.user) {
    // 从其他视图进入收藏时先同步最新收藏数据
    await loadFavorites()
    const hasInCurrent = state.favorites.some((record) => record.dictType === state.selectedType)
    if (!hasInCurrent) {
      const firstWithFavorite = state.types.find((typeItem) => state.favorites.some((record) => record.dictType === typeItem.dictType))
      if (firstWithFavorite) state.selectedType = firstWithFavorite.dictType
    }
  }
  for (const button of dom.viewSwitch.querySelectorAll('.view-switch__item')) {
    button.classList.toggle('is-active', button.dataset.view === view)
  }
  // 离开个人主页时清掉其 DOM，避免隐藏卡片被误计入列表
  if (view !== 'profile') dom.profileView.replaceChildren()
  applyViewVisibility()
  renderAll()
}

/** 根据当前视图显隐各区块：个人主页时隐藏筛选与列表 */
function applyViewVisibility() {
  const isProfile = state.view === 'profile'
  const loggedIn = Boolean(state.user)
  dom.profileView.hidden = !isProfile
  dom.typesAside.hidden = isProfile
  dom.adSlot.hidden = isProfile
  renderNoticeBar()
  dom.gunList.hidden = isProfile
  dom.searchBar.hidden = isProfile
  dom.codeList.hidden = isProfile
  dom.viewSwitch.hidden = !loggedIn || isProfile
  dom.toolbar.hidden = !loggedIn || isProfile
}

function updateAuthUi() {
  const loggedIn = Boolean(state.user)
  dom.loginBtn.hidden = loggedIn
  dom.userBox.hidden = !loggedIn
  if (loggedIn) {
    dom.userName.textContent = state.user.nickname || state.user.username
    dom.userAvatar.textContent = String(state.user.nickname || state.user.username || '?').slice(0, 1).toUpperCase()
  } else {
    dom.userMenu.hidden = true
  }
  if (!loggedIn && state.view === 'profile') {
    state.view = 'featured'
    state.profile = null
  }
  applyViewVisibility()
}

/** 手机号脱敏：138****0000 */
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || ''
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

/** 打开个人主页：拉取用户资料、我的投稿与收藏数 */
async function openProfile() {
  if (!state.user) {
    openLoginModal()
    return
  }
  state.view = 'profile'
  applyViewVisibility()
  renderProfileLoading()

  try {
    // 先取资料（会重建角色/权限缓存），再并行取投稿与收藏，避免缓存未就绪被 401
    const profile = await window.desktop.getProfile()
    const [mine, favorites, favoriteIds] = await Promise.all([window.desktop.listMine(), window.desktop.getFavorites(), window.desktop.getFavoriteIds()])
    state.profile = profile
    // 列表接口对普通用户返回「我的 ∨ 精选」，主页只统计本人投稿
    state.mine = (mine.records ?? []).filter((record) => record.isMine)
    state.favorites = Array.isArray(favorites) ? favorites : []
    state.favoriteIds = new Set(Array.isArray(favoriteIds) ? favoriteIds : [])
    state.favoriteCount = state.favorites.length
  } catch (error) {
    renderProfileError(normalizeError(error))
    return
  }
  renderProfile()
}

function renderProfileLoading() {
  dom.profileView.replaceChildren()
  const loading = document.createElement('p')
  loading.className = 'profile__meta'
  loading.textContent = '个人信息加载中…'
  dom.profileView.append(loading)
}

function renderProfileError(message) {
  dom.profileView.replaceChildren()
  const wrapper = document.createElement('div')
  wrapper.className = 'placeholder'
  const title = document.createElement('p')
  title.className = 'placeholder__title'
  title.textContent = '个人信息加载失败'
  const desc = document.createElement('p')
  desc.className = 'placeholder__desc'
  desc.textContent = message
  wrapper.append(title, desc)
  dom.profileView.append(wrapper)
}

/** 个人主页：横幅资料 + 统计 + 投稿/收藏切换 + 账号安全 */
function renderProfile() {
  if (!state.profile) return
  const { user, roles = [] } = state.profile
  const nickname = user.nickname || user.username
  const roleLabels = roles.map((role) => (role === 'admin' ? '管理员' : role === 'common' ? '普通用户' : role))

  dom.profileView.replaceChildren()

  // ---------- 返回 ----------
  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'profile__back'
  back.textContent = '← 返回精选'
  back.addEventListener('click', () => switchView('featured'))

  // ---------- 横幅 ----------
  const banner = document.createElement('div')
  banner.className = 'profile__banner'

  const identity = document.createElement('div')
  identity.className = 'profile__identity'

  const avatar = document.createElement('div')
  avatar.className = 'profile__avatar profile__avatar--lg'
  avatar.textContent = String(nickname || '?').slice(0, 1).toUpperCase()

  const info = document.createElement('div')
  const nameRow = document.createElement('div')
  nameRow.className = 'profile__name-row'
  const name = document.createElement('h2')
  name.className = 'profile__name'
  name.textContent = nickname
  nameRow.append(name)

  const chips = document.createElement('div')
  chips.className = 'profile__chips'
  const chipTexts = [`@${user.username}`]
  if (user.phone) chipTexts.push(maskPhone(user.phone))
  if (user.createTime) chipTexts.push(`加入于 ${String(user.createTime).slice(0, 10)}`)
  for (const text of chipTexts) {
    const chip = document.createElement('span')
    chip.className = 'profile__chip'
    chip.textContent = text
    chips.append(chip)
  }
  for (const label of roleLabels) {
    const role = document.createElement('span')
    role.className = 'profile__role'
    role.textContent = label
    chips.append(role)
  }

  info.append(nameRow, chips)
  identity.append(avatar, info)

  const tabs = document.createElement('div')
  tabs.className = 'profile__tabs'
  for (const tab of [
    { key: 'mine', label: `我的投稿（${state.mine.length}）` },
    { key: 'favorite', label: `我的收藏（${state.favorites.length}）` },
  ]) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'profile__tab' + (state.profileTab === tab.key ? ' is-active' : '')
    button.textContent = tab.label
    button.addEventListener('click', () => {
      state.profileTab = tab.key
      renderProfile()
    })
    tabs.append(button)
  }

  banner.append(identity, tabs)

  // ---------- 统计 ----------
  const stats = document.createElement('div')
  stats.className = 'profile__stats'
  const featuredCount = state.mine.filter((record) => record.isFeatured === '1').length
  for (const stat of [
    { label: '我的投稿', value: state.mine.length },
    { label: '已精选', value: featuredCount },
    { label: '我的收藏', value: state.favorites.length },
  ]) {
    const card = document.createElement('div')
    card.className = 'profile__stat'
    const value = document.createElement('p')
    value.className = 'profile__stat-value'
    value.textContent = String(stat.value)
    const label = document.createElement('p')
    label.className = 'profile__stat-label'
    label.textContent = stat.label
    card.append(value, label)
    stats.append(card)
  }

  // ---------- 列表 ----------
  const section = document.createElement('div')
  section.className = 'profile__section'
  const sectionHead = document.createElement('div')
  sectionHead.className = 'profile__section-head'
  const sectionTitle = document.createElement('h3')
  sectionTitle.className = 'profile__section-title'
  sectionTitle.textContent = state.profileTab === 'favorite' ? '我的收藏' : '我的投稿'
  sectionHead.append(sectionTitle)
  section.append(sectionHead)

  const isFavoriteTab = state.profileTab === 'favorite'
  const records = isFavoriteTab ? state.favorites : state.mine
  if (records.length) {
    const list = document.createElement('div')
    list.className = 'profile__list'
    for (const record of records) {
      list.append(
        createCodeCard({
          id: record.id,
          code: record.code,
          remark: record.remark,
          gunLabel: record.gunLabel,
          isFeatured: record.isFeatured === '1',
          isMine: isFavoriteTab ? record.isMine : true,
        }),
      )
    }
    section.append(list)
  } else {
    const empty = document.createElement('p')
    empty.className = 'profile__meta'
    empty.textContent = isFavoriteTab ? '还没有收藏改枪码，去精选列表点星标收藏吧' : '还没有提交过改枪码'
    section.append(empty)
  }

  // ---------- 账号与安全 ----------
  const security = document.createElement('div')
  security.className = 'profile__section'
  const securityHead = document.createElement('div')
  securityHead.className = 'profile__section-head'
  const securityTitle = document.createElement('h3')
  securityTitle.className = 'profile__section-title'
  securityTitle.textContent = '账号与安全'
  securityHead.append(securityTitle)
  security.append(securityHead)

  const securityList = document.createElement('div')
  securityList.className = 'profile__security'
  const rows = [
    { label: '修改密码', desc: '定期更换密码更安全', actionLabel: '修改', onClick: openPasswordModal },
    { label: '绑定手机', desc: user.phone ? `当前：${maskPhone(user.phone)}` : '未绑定，绑定后可用短信登录', actionLabel: user.phone ? '更换' : '绑定', onClick: openBindModal },
  ]
  for (const row of rows) {
    const rowElement = document.createElement('div')
    rowElement.className = 'profile__row'
    const textBox = document.createElement('div')
    const label = document.createElement('p')
    label.className = 'profile__row-label'
    label.textContent = row.label
    const desc = document.createElement('p')
    desc.className = 'profile__row-desc'
    desc.textContent = row.desc
    textBox.append(label, desc)

    const action = document.createElement('button')
    action.type = 'button'
    action.className = 'button button--ghost'
    action.textContent = row.actionLabel
    action.addEventListener('click', row.onClick)
    rowElement.append(textBox, action)
    securityList.append(rowElement)
  }
  security.append(securityList)

  dom.profileView.append(back, banner, stats, section, security)
}

/* ---------------- 账号安全 ---------------- */

function openPasswordModal() {
  const phone = state.profile?.user?.phone
  dom.oldPassword.value = ''
  dom.newPassword.value = ''
  dom.confirmPassword.value = ''
  dom.passwordCode.value = ''
  dom.passwordError.textContent = ''
  dom.oldPasswordField.hidden = Boolean(phone)
  dom.passwordSmsField.hidden = !phone
  dom.passwordHint.hidden = Boolean(phone)
  dom.passwordHint.textContent = '当前账号未绑定手机号，修改密码需校验原密码，建议先在「账号与安全」绑定手机。'
  resetSmsCountdown('password')
  showModal(dom.passwordModal)
  ;(phone ? dom.newPassword : dom.oldPassword).focus()
}

async function handlePasswordSave() {
  const oldPassword = dom.oldPassword.value
  const newPassword = dom.newPassword.value
  const confirmPassword = dom.confirmPassword.value
  const code = dom.passwordCode.value.trim()
  const hasPhone = Boolean(state.profile?.user?.phone)
  dom.passwordError.textContent = ''

  if (!hasPhone && !oldPassword) {
    dom.passwordError.textContent = '请输入原密码'
    return
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(newPassword)) {
    dom.passwordError.textContent = '新密码需 6-20 位且同时包含字母与数字'
    return
  }
  if (newPassword !== confirmPassword) {
    dom.passwordError.textContent = '两次输入的新密码不一致'
    return
  }
  if (hasPhone && !/^\d{6}$/.test(code)) {
    dom.passwordError.textContent = '请输入 6 位手机验证码'
    return
  }

  dom.passwordSubmit.disabled = true
  try {
    await window.desktop.changePassword(hasPhone ? { newPassword, code } : { oldPassword, newPassword })
    closeModal('passwordModal')
    showToast('密码修改成功')
  } catch (error) {
    dom.passwordError.textContent = normalizeError(error)
  } finally {
    dom.passwordSubmit.disabled = false
  }
}

function openBindModal() {
  const phone = state.profile?.user?.phone
  state.bindTicket = null
  dom.bindTitle.textContent = phone ? '更换手机号' : '绑定手机号'
  dom.bindCurrent.textContent = phone ? '第 1 步：验证原手机号' : '当前未绑定手机号，绑定后可使用短信登录'
  dom.bindStepOld.hidden = !phone
  dom.bindStepNew.hidden = Boolean(phone)
  dom.bindOldPhone.textContent = phone ? `原手机号：${maskPhone(phone)}` : ''
  dom.bindPhone.value = ''
  dom.bindCode.value = ''
  dom.bindOldCode.value = ''
  dom.bindError.textContent = ''
  dom.bindOldError.textContent = ''
  resetSmsCountdown('bind')
  resetSmsCountdown('bindOld')
  showModal(dom.bindModal)
  ;(phone ? dom.bindOldCode : dom.bindPhone).focus()
}

/** 换绑第一步：验证原手机号，成功后进入新手机验证 */
async function handleVerifyBindOld() {
  const code = dom.bindOldCode.value.trim()
  dom.bindOldError.textContent = ''
  if (!/^\d{6}$/.test(code)) {
    dom.bindOldError.textContent = '请输入 6 位原手机验证码'
    return
  }
  dom.bindOldNext.disabled = true
  try {
    const result = await window.desktop.verifyBindOld(code)
    state.bindTicket = result.ticket
    dom.bindStepOld.hidden = true
    dom.bindStepNew.hidden = false
    dom.bindTitle.textContent = '更换手机号'
    dom.bindCurrent.textContent = '第 2 步：验证新手机号'
    dom.bindPhone.focus()
  } catch (error) {
    dom.bindOldError.textContent = normalizeError(error)
  } finally {
    dom.bindOldNext.disabled = false
  }
}

async function handleBindSave() {
  const phone = dom.bindPhone.value.trim()
  const code = dom.bindCode.value.trim()
  const oldPhone = state.profile?.user?.phone
  const oldCode = dom.bindOldCode.value.trim()
  dom.bindError.textContent = ''

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    dom.bindError.textContent = '请输入正确的新手机号'
    return
  }
  if (!/^\d{6}$/.test(code)) {
    dom.bindError.textContent = '请输入 6 位新手机验证码'
    return
  }
  if (oldPhone && !state.bindTicket) {
    dom.bindError.textContent = '请先完成原手机号验证'
    return
  }

  dom.bindSubmit.disabled = true
  try {
    await window.desktop.bindPhone({ phone, code, ticket: oldPhone ? state.bindTicket : undefined })
    closeModal('bindModal')
    showToast(oldPhone ? '手机号更换成功' : '手机号绑定成功')
    if (state.view === 'profile') await openProfile()
  } catch (error) {
    dom.bindError.textContent = normalizeError(error)
  } finally {
    dom.bindSubmit.disabled = false
  }
}

/* ---------------- 收藏 / 投稿管理 ---------------- */

async function loadFavorites() {
  if (!state.user) {
    state.favorites = []
    state.favoriteIds = new Set()
    state.favoriteCount = 0
    return
  }
  try {
    const [records, ids] = await Promise.all([window.desktop.getFavorites(), window.desktop.getFavoriteIds()])
    state.favorites = Array.isArray(records) ? records : []
    state.favoriteIds = new Set(Array.isArray(ids) ? ids : [])
    state.favoriteCount = state.favorites.length
  } catch {
    state.favorites = []
    state.favoriteIds = new Set()
    state.favoriteCount = 0
  }
}

/** 收藏 / 取消收藏：更新本地状态并按当前视图重绘 */
async function toggleFavorite(codeId) {
  if (!state.user) {
    openLoginModal()
    return
  }
  try {
    const result = await window.desktop.toggleFavorite(codeId)
    if (result.favorited) state.favoriteIds.add(codeId)
    else state.favoriteIds.delete(codeId)

    showToast(result.favorited ? '已收藏' : '已取消收藏')
    if (state.view === 'favorite' || state.view === 'profile') await loadFavorites()
    if (state.view === 'profile') renderProfile()
    else renderAll()
  } catch (error) {
    showToast(normalizeError(error))
  }
}

/** 打开编辑改枪码弹窗 */
function openEditCode(item) {
  state.editingCodeId = item.id
  dom.editCodeInput.value = item.code
  dom.editRemarkInput.value = item.remark || ''
  dom.editError.textContent = ''
  showModal(dom.editCodeModal)
  dom.editCodeInput.focus()
}

async function handleEditCode() {
  const code = dom.editCodeInput.value.trim()
  const remark = dom.editRemarkInput.value.trim()
  dom.editError.textContent = ''
  if (!code) {
    dom.editError.textContent = '改枪码不能为空'
    return
  }
  dom.editSubmit.disabled = true
  try {
    const message = await window.desktop.updateCode({ id: state.editingCodeId, code, remark })
    hideModal(dom.editCodeModal)
    showToast(message || '修改成功')
    await refreshAll()
  } catch (error) {
    dom.editError.textContent = normalizeError(error)
  } finally {
    dom.editSubmit.disabled = false
  }
}

/** 打开反馈弹窗 */
function openFeedback(item) {
  state.feedbackCodeId = item.id
  dom.feedbackTarget.textContent = `${item.gunLabel} · ${item.code}`
  dom.feedbackReason.value = ''
  dom.feedbackError.textContent = ''
  showModal(dom.feedbackModal)
  dom.feedbackReason.focus()
}

async function handleFeedback() {
  const reason = dom.feedbackReason.value.trim()
  dom.feedbackError.textContent = ''
  dom.feedbackSubmit.disabled = true
  try {
    const payload = { codeId: state.feedbackCodeId, reason }
    const message = state.user ? await window.desktop.feedbackCode(payload) : await window.desktop.feedbackAnonymous(payload)
    closeModal('feedbackModal')
    showToast(message || '反馈已提交，感谢你的帮助')
  } catch (error) {
    dom.feedbackError.textContent = normalizeError(error)
  } finally {
    dom.feedbackSubmit.disabled = false
  }
}

/** 删除本人投稿（二次确认） */
function handleDeleteCode(item) {
  openConfirm('删除改枪码', '删除后不可恢复，确认删除这条投稿吗？', async () => {
    try {
      await window.desktop.deleteCodes(item.id)
      showToast('已删除')
      await refreshAll()
    } catch (error) {
      showToast(normalizeError(error))
    }
  })
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

/* ---------------- 忘记密码 ---------------- */

function openForgotModal() {
  hideModal(dom.loginModal)
  const loginValue = dom.loginUsername.value.trim()
  dom.forgotPhone.value = /^1[3-9]\d{9}$/.test(loginValue) ? loginValue : ''
  dom.forgotCode.value = ''
  dom.forgotPassword.value = ''
  dom.forgotConfirm.value = ''
  dom.forgotError.textContent = ''
  resetSmsCountdown('forgot')
  showModal(dom.forgotModal)
  dom.forgotPhone.focus()
}

async function handleForgotSave() {
  const phone = dom.forgotPhone.value.trim()
  const code = dom.forgotCode.value.trim()
  const password = dom.forgotPassword.value
  const confirmPassword = dom.forgotConfirm.value
  dom.forgotError.textContent = ''

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    dom.forgotError.textContent = '请输入正确的手机号'
    return
  }
  if (!/^\d{6}$/.test(code)) {
    dom.forgotError.textContent = '请输入 6 位短信验证码'
    return
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(password)) {
    dom.forgotError.textContent = '新密码需 6-20 位且同时包含字母与数字'
    return
  }
  if (password !== confirmPassword) {
    dom.forgotError.textContent = '两次输入的新密码不一致'
    return
  }

  dom.forgotSubmit.disabled = true
  try {
    await window.desktop.resetPassword({ phone, code, password })
    closeModal('forgotModal')
    showToast('密码已重置，请使用新密码登录')
  } catch (error) {
    dom.forgotError.textContent = normalizeError(error)
  } finally {
    dom.forgotSubmit.disabled = false
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
  clearLoginForm()
  showModal(dom.loginModal)
  dom.loginUsername.focus()
  await refreshCaptcha()
}

function setLoginMode(mode) {
  state.loginMode = mode
  const isPassword = mode === 'password'
  dom.passwordLoginPanel.hidden = !isPassword
  dom.smsLoginPanel.hidden = isPassword
  for (const button of document.querySelectorAll('[data-login-mode]')) {
    button.classList.toggle('is-active', button.dataset.loginMode === mode)
  }
  dom.loginError.textContent = ''
}

/** 短信验证码目标：登录 / 注册 / 绑定手机 */
function smsTarget(kind) {
  const profilePhone = () => state.profile?.user?.phone ?? ''
  const targets = {
    login: { button: dom.smsSendBtn, error: dom.loginError, scene: 'login', phone: () => dom.smsPhone.value.trim() },
    register: { button: dom.regSmsSendBtn, error: dom.regError, scene: 'register', phone: () => dom.regPhone.value.trim() },
    bind: { button: dom.bindSendBtn, error: dom.bindError, scene: 'bind', phone: () => dom.bindPhone.value.trim() },
    bindOld: { button: dom.bindOldSendBtn, error: dom.bindError, scene: 'bindOld', phone: profilePhone },
    password: { button: dom.passwordSendBtn, error: dom.passwordError, scene: 'reset', phone: profilePhone },
    forgot: { button: dom.forgotSendBtn, error: dom.forgotError, scene: 'reset', phone: () => dom.forgotPhone.value.trim() },
  }
  return targets[kind]
}

function startSmsCountdown(kind, seconds = 60) {
  const { button } = smsTarget(kind)
  clearInterval(state.smsTimers[kind])
  state.smsCountdown[kind] = seconds
  button.disabled = true
  button.textContent = `${seconds}s`
  state.smsTimers[kind] = setInterval(() => {
    state.smsCountdown[kind] -= 1
    if (state.smsCountdown[kind] <= 0) {
      resetSmsCountdown(kind)
    } else {
      button.textContent = `${state.smsCountdown[kind]}s`
    }
  }, 1000)
}

/** 关闭弹窗时一并清空倒计时，重新发送由后端 60 秒频控拦截 */
function resetSmsCountdown(kind) {
  const { button } = smsTarget(kind)
  clearInterval(state.smsTimers[kind])
  state.smsTimers[kind] = null
  state.smsCountdown[kind] = 0
  button.disabled = false
  button.textContent = '发送验证码'
}

/** 发送短信验证码：kind 为 login / register / bind */
async function sendSms(kind) {
  const { error, scene, phone } = smsTarget(kind)
  const phoneValue = phone()
  error.textContent = ''
  if (!/^1[3-9]\d{9}$/.test(phoneValue)) {
    error.textContent = '请输入正确的手机号'
    return
  }
  try {
    const result = await window.desktop.sendSms({ scene, phone: phoneValue })
    showToast(result.mockCode ? `验证码已发送（本地模拟：${result.mockCode}）` : '验证码已发送，请注意查收')
    startSmsCountdown(kind)
  } catch (error_) {
    const message = normalizeError(error_)
    error.textContent = message
    showToast(message)
    // 后端返回剩余冷却秒数时，按钮同步倒计时，避免用户反复点击
    const waitMatch = message.match(/(\d+)\s*秒后再试/)
    if (waitMatch) startSmsCountdown(kind, Number(waitMatch[1]))
  }
}

async function handleSmsLogin() {
  const phone = dom.smsPhone.value.trim()
  const code = dom.smsCode.value.trim()
  dom.loginError.textContent = ''
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    dom.loginError.textContent = '请输入正确的手机号'
    return
  }
  if (!/^\d{6}$/.test(code)) {
    dom.loginError.textContent = '请输入 6 位短信验证码'
    return
  }

  dom.loginSubmit.disabled = true
  try {
    const user = await window.desktop.loginBySms({ phone, code, remember: dom.rememberLogin.checked })
    state.user = user
    closeModal('loginModal')
    updateAuthUi()
    showToast(`欢迎回来，${user.nickname || user.username}`)
    await loadMine()
    await loadFavorites()
    renderAll()
  } catch (error) {
    dom.loginError.textContent = normalizeError(error)
  } finally {
    dom.loginSubmit.disabled = false
  }
}

async function handleLogin() {
  if (state.loginMode === 'sms') {
    await handleSmsLogin()
    return
  }
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
    const user = await window.desktop.login({ username, password, captcha, uuid: state.captcha?.uuid ?? '', remember: dom.rememberLogin.checked })
    state.user = user
    closeModal('loginModal')
    updateAuthUi()
    showToast(`欢迎回来，${user.nickname || user.username}`)
    await loadMine()
    await loadFavorites()
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
    state.favorites = []
    state.favoriteIds = new Set()
    state.favoriteCount = 0
    state.profile = null
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

function openRegisterModal() {
  closeModal('loginModal')
  clearRegisterForm()
  showModal(dom.registerModal)
  dom.regUsername.focus()
}

async function handleRegister() {
  const username = dom.regUsername.value.trim()
  const password = dom.regPassword.value
  const confirmPassword = dom.regConfirm.value
  const phone = dom.regPhone.value.trim()
  const nickname = dom.regNickname.value.trim()
  const smsCode = dom.regSmsCode.value.trim()
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
  if (!/^\d{6}$/.test(smsCode)) {
    dom.regError.textContent = '请输入 6 位短信验证码'
    return
  }

  dom.regSubmit.disabled = true
  try {
    const user = await window.desktop.register({
      username,
      password,
      phone,
      nickname: nickname || undefined,
      smsCode,
    })
    state.user = user
    closeModal('registerModal')
    updateAuthUi()
    showToast(`欢迎加入，${user.nickname || user.username}`)
    await loadMine()
    await loadFavorites()
    renderAll()
  } catch (error) {
    dom.regError.textContent = normalizeError(error)
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
  if (state.user) {
    await loadMine()
    await loadFavorites()
  }
  await loadAds()
  await loadNotices()
  renderAll()
}

async function bootstrap() {
  const config = await window.desktop.getConfig()
  state.apiBase = config.apiBase
  state.version = config.version
  state.adContact = config.adContact || state.adContact
  state.siteUrl = config.siteUrl || state.siteUrl
  dom.rememberLogin.checked = config.rememberLogin !== false
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
  dom.forgotLink.addEventListener('click', (event) => {
    event.preventDefault()
    openForgotModal()
  })
  dom.passwordSendBtn.addEventListener('click', () => sendSms('password'))
  dom.bindOldSendBtn.addEventListener('click', () => sendSms('bindOld'))
  dom.forgotSendBtn.addEventListener('click', () => sendSms('forgot'))
  dom.forgotSubmit.addEventListener('click', handleForgotSave)
  dom.feedbackSubmit.addEventListener('click', handleFeedback)
  dom.noticeBar.addEventListener('click', openNoticeModal)
  dom.noticeList.addEventListener('click', (event) => {
    const link = event.target.closest('a')
    if (!link) return
    event.preventDefault()
    if (link.href) window.open(link.href, '_blank')
  })
  for (const button of document.querySelectorAll('[data-login-mode]')) {
    button.addEventListener('click', () => setLoginMode(button.dataset.loginMode))
  }
  dom.smsSendBtn.addEventListener('click', () => sendSms('login'))
  dom.regSmsSendBtn.addEventListener('click', () => sendSms('register'))
  dom.regSubmit.addEventListener('click', handleRegister)
  dom.editSubmit.addEventListener('click', handleEditCode)
  dom.passwordSubmit.addEventListener('click', handlePasswordSave)
  dom.bindSubmit.addEventListener('click', handleBindSave)
  dom.bindSendBtn.addEventListener('click', () => sendSms('bind'))
  dom.bindOldNext.addEventListener('click', handleVerifyBindOld)
  dom.bindBack.addEventListener('click', () => {
    dom.bindStepOld.hidden = false
    dom.bindStepNew.hidden = true
    dom.bindTitle.textContent = '更换手机号'
    dom.bindCurrent.textContent = '第 1 步：验证原手机号'
  })
  dom.adCopyBtn.addEventListener('click', async () => {
    await window.desktop.copy(state.adContact)
    showToast('商务邮箱已复制')
  })
  dom.confirmOk.addEventListener('click', runConfirmAction)
  dom.loginBtn.addEventListener('click', openLoginModal)
  dom.captchaImage.addEventListener('click', refreshCaptcha)
  dom.loginSubmit.addEventListener('click', handleLogin)
  dom.submitConfirm.addEventListener('click', handleSubmitCode)
  dom.submitType.addEventListener('change', fillGunSelect)

  for (const button of dom.viewSwitch.querySelectorAll('.view-switch__item')) {
    button.addEventListener('click', () => switchView(button.dataset.view))
  }

  for (const element of document.querySelectorAll('[data-close]')) {
    element.addEventListener('click', () => closeModal(element.dataset.close))
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal('loginModal')
      closeModal('registerModal')
      closeModal('bindModal')
      closeModal('passwordModal')
      closeModal('forgotModal')
      closeModal('feedbackModal')
      closeModal('noticeModal')
      hideModal(dom.editCodeModal)
      hideModal(dom.submitModal)
    }
  })

  dom.userMenuBtn.addEventListener('click', (event) => {
    event.stopPropagation()
    dom.userMenu.hidden = !dom.userMenu.hidden
  })
  dom.menuProfile.addEventListener('click', () => {
    dom.userMenu.hidden = true
    openProfile()
  })
  dom.menuSubmit.addEventListener('click', () => {
    dom.userMenu.hidden = true
    openSubmitModal()
  })
  dom.menuLogout.addEventListener('click', () => {
    dom.userMenu.hidden = true
    handleLogout()
  })
  document.addEventListener('click', (event) => {
    if (!dom.userMenu.hidden && !dom.userBox.contains(event.target)) dom.userMenu.hidden = true
  })

  // 登录框内回车直接提交
  for (const input of [dom.loginUsername, dom.loginPassword, dom.loginCaptcha]) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') handleLogin()
    })
  }

  for (const input of [dom.smsPhone, dom.smsCode]) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') handleSmsLogin()
    })
  }

  for (const input of [dom.regUsername, dom.regPassword, dom.regConfirm, dom.regPhone, dom.regNickname, dom.regSmsCode]) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') handleRegister()
    })
  }

  if (state.user) await loadMine()
  await loadData()
  await loadAds()
  await loadNotices()

  // 应用初始化且有公告时，自动弹出公告
  if (state.notices.length) openNoticeModal()

  // 每 5 分钟自动刷新一次
  setInterval(refreshAll, 5 * 60 * 1000)
}

bootstrap()
