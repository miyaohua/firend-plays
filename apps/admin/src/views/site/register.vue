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

          <el-form-item v-if="captchaEnabled" label="验证码" prop="captcha">
            <div class="register__captcha">
              <el-input v-model="form.captcha" maxlength="6" placeholder="请输入验证码" />
              <img :src="captchaImage" class="register__captcha-image" alt="验证码" title="点击刷新" @click="loadCaptcha" />
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
import { getAccessToken, setTokenPair } from '@/utils'
import { RouterConstant } from '@/router/router.constant'
import { SITE_NAME, openDownloadPage } from './constants'

const router = useRouter()
const formRef = useTemplateRef<FormInstance>('formRef')

const success = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const captchaEnabled = ref(false)
const captchaImage = ref('')
const captchaUuid = ref('')

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  nickname: '',
  captcha: '',
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
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

async function loadCaptcha() {
  try {
    const data = await AuthRequest.getCaptcha()
    captchaEnabled.value = data.enabled
    captchaImage.value = data.captcha
    captchaUuid.value = data.uuid
    form.captcha = ''
  } catch {
    captchaEnabled.value = false
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
      captcha: form.captcha,
      uuid: captchaUuid.value,
    })
    setTokenPair(result)
    success.value = true
  } catch (error: any) {
    errorMessage.value = error?.message || '注册失败，请稍后重试'
    await loadCaptcha()
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (getAccessToken()) {
    success.value = true
    return
  }
  await loadCaptcha()
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

  &__captcha {
    display: flex;
    gap: 10px;
    width: 100%;

    &-image {
      width: 110px;
      height: 32px;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
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
