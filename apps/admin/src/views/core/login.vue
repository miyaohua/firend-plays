<template>
  <div class="login-container flex-center">
    <div class="login-form">
      <h3 class="title">{{ appTitle }}</h3>

      <div class="login-mode">
        <button type="button" class="login-mode__item" :class="{ 'is-active': mode === 'password' }" @click="mode = 'password'">账号登录</button>
        <button type="button" class="login-mode__item" :class="{ 'is-active': mode === 'sms' }" @click="mode = 'sms'">短信登录</button>
      </div>

      <el-form v-if="mode === 'password'" ref="loginFormRef" :model="loginForm" :rules="loginRules" @submit.prevent>
        <el-form-item prop="username">
          <el-input v-model.trim="loginForm.username" placeholder="账号" clearable>
            <template #prefix>
              <SvgIcon name="User"></SvgIcon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model.trim="loginForm.password" type="password" show-password placeholder="密码" clearable @keydown.enter="handleLogin">
            <template #prefix>
              <SvgIcon name="Lock"></SvgIcon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="captchaEnabled" prop="captcha">
          <div class="flex items-center w-full">
            <el-input v-model.trim="loginForm.captcha" placeholder="请输入验证码" @keydown.enter="handleLogin" clearable>
              <template #prefix>
                <SvgIcon name="Key"></SvgIcon>
              </template>
            </el-input>
            <img :src="captchaURL" alt="captcha" class="captcha-image" draggable="false" @click="getCaptcha" />
          </div>
        </el-form-item>

        <el-checkbox v-model="rememberMe" style="margin: 0px 0px 20px 0px">记住密码</el-checkbox>

        <el-form-item>
          <el-button :loading type="primary" class="w-full" size="large" @click="handleLogin">
            <span>{{ loading ? `登录中` : `登录` }}</span>
          </el-button>
        </el-form-item>
      </el-form>

      <el-form v-else ref="smsFormRef" :model="smsForm" :rules="smsRules" @submit.prevent>
        <el-form-item prop="phone">
          <el-input v-model.trim="smsForm.phone" placeholder="手机号" maxlength="11" clearable>
            <template #prefix>
              <SvgIcon name="Phone"></SvgIcon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="code">
          <div class="flex items-center w-full">
            <el-input v-model.trim="smsForm.code" placeholder="短信验证码" maxlength="6" clearable @keydown.enter="handleSmsLogin">
              <template #prefix>
                <SvgIcon name="Key"></SvgIcon>
              </template>
            </el-input>
            <el-button class="ml-8px" :disabled="countdown > 0" @click="handleSendSms">
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button :loading="smsLoading" type="primary" class="w-full" size="large" @click="handleSmsLogin">
            <span>{{ smsLoading ? `登录中` : `登录` }}</span>
          </el-button>
        </el-form-item>
      </el-form>

      <p class="login-links">
        <router-link to="/reset-password">忘记密码？</router-link>
        <span class="login-links__divider">·</span>
        <router-link to="/register">立即注册</router-link>
      </p>
    </div>

    <!--  底部  -->
    <div class="login-footer text-center">
      <span>Copyright © 2026-2026 vite-vue3-template All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Login' })
import type { Auth } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'
import { AuthRequest } from '@/api/auth.request'
import { RouterConstant } from '@/router/router.constant'
import defaultCaptcha from '@/assets/images/default-captcha.png'
import { getTimeGreeting, TipModal, getLoginParams, removeLoginParams, setLoginParams, setTokenPair, isString } from '@/utils'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

/** 系统标题 */
const appTitle = import.meta.env.VITE_APP_TITLE

/** 登录方式：账号密码 / 短信验证码 */
const mode = ref<'password' | 'sms'>('password')

/** 是否记住密码 */
const rememberMe = ref<boolean>(true)

/** 验证码开关（由后端参数 sys.account.captchaEnabled 控制） */
const captchaEnabled = ref<boolean>(true)

/** 验证码图片地址 */
const captchaURL = ref<string>(defaultCaptcha)

/** 密码登录加载状态 */
const loading = ref<boolean>(false)

/** 短信登录加载状态 */
const smsLoading = ref<boolean>(false)

/** 发送验证码倒计时 */
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

/** 登录表单实例 */
const loginFormRef = useTemplateRef('loginFormRef')

/** 短信登录表单实例 */
const smsFormRef = useTemplateRef<FormInstance>('smsFormRef')

/** 登录表单数据 */
const loginForm = ref({ username: 'admin', password: '123456' } as Auth.LoginParams)

/** 短信登录表单数据 */
const smsForm = reactive<Auth.SmsLoginParams>({ phone: '', code: '' })

/** 登录表单校验规则 */
const loginRules: FormRules<Auth.LoginParams> = {
  username: [{ required: true, message: '请输入账号', trigger: ['blur'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['blur'] }],
  captcha: [{ required: true, message: '请输入验证码', trigger: ['blur'] }],
}

/** 短信登录表单校验规则 */
const smsRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: ['blur'] },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: ['blur'] },
  ],
  code: [
    { required: true, message: '请输入短信验证码', trigger: ['blur'] },
    { pattern: /^\d{6}$/, message: '短信验证码为 6 位数字', trigger: ['blur'] },
  ],
}

/** 请求验证码数据 */
async function getCaptcha() {
  const data = await AuthRequest.getCaptcha()
  captchaEnabled.value = data.enabled
  captchaURL.value = data.captcha
  loginForm.value.uuid = data.uuid
}

/** 密码登录：先写入 token，再优先跳转 route.query.redirect，无则回首页；使用 replace 模式 */
async function handleLogin() {
  try {
    loading.value = true
    await loginFormRef.value?.validate()
    await userStore.login(loginForm.value)
    const { username, password } = loginForm.value
    rememberMe.value ? setLoginParams({ username, password, rememberMe: rememberMe.value }) : removeLoginParams()
    const redirect = route.query.redirect
    await router.replace(isString(redirect) ? redirect : RouterConstant.HOME_PAGE_URL)
    TipModal.notifySuccess(`${getTimeGreeting()}，欢迎回来`, { title: '登录成功' })
  } catch {
    loginForm.value.captcha = ''
    loginForm.value.uuid = ''
    getCaptcha()
  } finally {
    loading.value = false
  }
}

/** 发送短信验证码（60 秒倒计时） */
async function handleSendSms() {
  const valid = await smsFormRef.value?.validateField('phone').catch(() => false)
  if (!valid) return
  try {
    const result = await AuthRequest.sendSms({ scene: 'login', phone: smsForm.phone })
    TipModal.msgSuccess(result.mockCode ? `验证码已发送（本地模拟：${result.mockCode}）` : '验证码已发送，请注意查收')
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error: any) {
    TipModal.msgError(error?.message || '验证码发送失败')
  }
}

/** 短信验证码登录 */
async function handleSmsLogin() {
  try {
    smsLoading.value = true
    await smsFormRef.value?.validate()
    const data = await AuthRequest.loginBySms({ phone: smsForm.phone, code: smsForm.code })
    setTokenPair(data)
    const redirect = route.query.redirect
    await router.replace(isString(redirect) ? redirect : RouterConstant.HOME_PAGE_URL)
    TipModal.notifySuccess(`${getTimeGreeting()}，欢迎回来`, { title: '登录成功' })
  } catch {
    smsForm.code = ''
  } finally {
    smsLoading.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

// 初始执行
getCaptcha()
const cacheParams = getLoginParams()
if (cacheParams.rememberMe) rememberMe.value = true
if (cacheParams.username) loginForm.value.username = cacheParams.username
if (cacheParams.password) loginForm.value.password = cacheParams.password
</script>

<style lang="scss" scoped>
.login-mode {
  display: flex;
  gap: 6px;
  margin: -12px 0 20px;
  padding: 4px;
  background: var(--el-fill-color-light);
  border-radius: 999px;

  &__item {
    flex: 1;
    padding: 7px 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &.is-active {
      color: var(--el-color-primary);
      background: var(--el-bg-color);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }
  }
}

.login-links {
  margin: -8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;

  a {
    color: var(--el-color-primary);
    text-decoration: none;
  }

  &__divider {
    margin: 0 8px;
  }
}

html[data-device='mobile'] .login-container {
  --login-form-width: calc(100% - 32px);
}
html.dark .login-container {
  background-image: linear-gradient(to top, #14405c, #2b2b2b);
}
.login-container {
  --login-form-width: 420px;
  --login-captcha-height: 38px;
  --login-captcha-border-radius: var(--el-border-radius-base);
  --login-input-height: 38px;
  position: relative;
  height: 100%;
  background-image: linear-gradient(to top, #2d8cc4, #d8d0d0);
  // background-image: linear-gradient(to top, var(--el-color-primary-light-7), var(--el-color-danger-light-7));
  background-size: cover;

  .login-form {
    width: var(--login-form-width);
    padding: 25px 25px 5px 25px;
    border-radius: 6px;
    background-color: var(--el-bg-color);
    box-shadow: var(--el-box-shadow-light);

    .title {
      margin: 0px auto 30px auto;
      text-align: center;
      color: var(--el-text-color-regular);
      font-size: 20px;
      font-weight: 500;
    }

    .el-input {
      --el-input-height: var(--login-input-height);
    }

    .captcha-image {
      cursor: pointer;
      margin-left: 8px;
      height: var(--login-captcha-height);
      border-radius: var(--login-captcha-border-radius);
      box-shadow: var(--el-box-shadow);
    }
  }

  .login-footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 40px;
    line-height: 40px;
    color: var(--el-color-white);
    font-size: var(--el-font-size-extra-small);
    letter-spacing: 1px;
  }
}
</style>
