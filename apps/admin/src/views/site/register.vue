<template>
  <div class="register">
    <section class="register__card">
      <template v-if="!success">
        <h1 class="register__title">注册 {{ SITE_NAME }}</h1>
        <p class="register__subtitle">注册后可在桌面客户端投稿、收藏与查看精选</p>

        <el-form ref="formRef" :model="form" :rules="rules" class="register__form" label-position="top" @submit.prevent>
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" placeholder="字母开头，3-20 位字母或数字" autocomplete="username" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="6-20 位，需同时包含字母与数字" autocomplete="new-password" />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入密码" autocomplete="new-password" />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" maxlength="11" placeholder="用于账号找回与联系" />
          </el-form-item>

          <el-form-item label="昵称（可选）" prop="nickname">
            <el-input v-model="form.nickname" maxlength="20" placeholder="不填默认使用账号" />
          </el-form-item>

          <el-form-item label="短信验证码" prop="smsCode">
            <div class="register__sms">
              <el-input v-model="form.smsCode" maxlength="6" placeholder="请输入短信验证码" />
              <el-button :disabled="countdown > 0" @click="handleSendSms">{{ countdown > 0 ? `${countdown}s` : '发送验证码' }}</el-button>
            </div>
          </el-form-item>

          <p class="register__error">{{ errorMessage }}</p>

          <el-button type="primary" size="large" class="register__submit" :loading="submitting" @click="handleSubmit">注册并登录</el-button>

          <p class="register__footer">已有账号？<router-link to="/login">去登录</router-link></p>
        </el-form>
      </template>

      <template v-else>
        <h1 class="register__title">注册成功</h1>
        <p class="register__subtitle">已自动登录，快下载客户端体验完整功能</p>
        <div class="register__actions">
          <el-button type="primary" size="large" @click="openDownloadPage">下载客户端</el-button>
          <el-button size="large" @click="router.push(RouterConstant.HOME_PAGE_URL)">进入后台</el-button>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SiteRegister' })
import type { FormInstance, FormRules } from 'element-plus'
import { AuthRequest } from '@/api/auth.request'
import { TipModal } from '@/utils'
import { getAccessToken, setTokenPair } from '@/utils'
import { RouterConstant } from '@/router/router.constant'
import { SITE_NAME, openDownloadPage } from './constants'

const router = useRouter()
const formRef = useTemplateRef<FormInstance>('formRef')

const success = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  nickname: '',
  smsCode: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9]{2,19}$/, message: '账号需以字母开头，3-20 位字母或数字', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).{6,20}$/, message: '密码需 6-20 位且同时包含字母与数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  nickname: [{ max: 20, message: '昵称不能超过 20 个字符', trigger: 'blur' }],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '短信验证码为 6 位数字', trigger: 'blur' },
  ],
}

/** 启动发送验证码倒计时（秒） */
function startCountdown(seconds: number) {
  countdown.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function handleSendSms() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errorMessage.value = '请先填写正确的手机号'
    return
  }
  errorMessage.value = ''
  try {
    const result = await AuthRequest.sendSms({ scene: 'register', phone: form.phone })
    TipModal.msgSuccess(result.mockCode ? `验证码已发送（本地模拟：${result.mockCode}）` : '验证码已发送，请注意查收')
    startCountdown(60)
  } catch (error: any) {
    const message = error?.message || error?.response?.data?.message || '验证码发送失败'
    errorMessage.value = message
    const waitMatch = String(message).match(/(\d+)\s*秒后再试/)
    if (waitMatch) startCountdown(Number(waitMatch[1]))
  }
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const result = await AuthRequest.register({
      username: form.username,
      password: form.password,
      phone: form.phone,
      nickname: form.nickname || undefined,
      smsCode: form.smsCode,
    })
    setTokenPair(result)
    success.value = true
  } catch (error: any) {
    errorMessage.value = error?.message || '注册失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (getAccessToken()) success.value = true
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.register {
  display: flex;
  justify-content: center;
  padding: 64px 24px 80px;

  &__card {
    width: 100%;
    max-width: 420px;
    padding: 36px 32px;
    background: #ffffff;
    border: 1px solid #eef0f4;
    border-radius: 16px;
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
  }

  &__title {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    text-align: center;
  }

  &__subtitle {
    margin: 0 0 24px;
    font-size: 13px;
    color: #6b7280;
    text-align: center;
  }

  &__form {
    :deep(.el-form-item__label) {
      font-size: 13px;
      color: #4b5563;
    }
  }

  &__sms {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  &__error {
    min-height: 18px;
    margin: 0 0 12px;
    font-size: 12px;
    color: #dc2626;
  }

  &__submit {
    width: 100%;
  }

  &__footer {
    margin: 16px 0 0;
    font-size: 13px;
    color: #6b7280;
    text-align: center;

    a {
      color: #2563eb;
      text-decoration: none;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
  }
}
</style>
