<template>
  <div class="reset">
    <section class="reset__card">
      <template v-if="!success">
        <h1 class="reset__title">重置密码</h1>
        <p class="reset__subtitle">通过手机号验证码重置，重置后原登录状态立即失效</p>

        <el-form ref="formRef" :model="form" :rules="rules" class="reset__form" label-position="top" @submit.prevent>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" maxlength="11" placeholder="注册时绑定的手机号" />
          </el-form-item>

          <el-form-item label="短信验证码" prop="smsCode">
            <div class="reset__sms">
              <el-input v-model="form.smsCode" maxlength="6" placeholder="请输入短信验证码" />
              <el-button :disabled="countdown > 0" @click="handleSendSms">{{ countdown > 0 ? `${countdown}s` : '发送验证码' }}</el-button>
            </div>
          </el-form-item>

          <el-form-item label="新密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="6-20 位，需同时包含字母与数字" autocomplete="new-password" />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入新密码" autocomplete="new-password" />
          </el-form-item>

          <p class="reset__error">{{ errorMessage }}</p>

          <el-button type="primary" size="large" class="reset__submit" :loading="submitting" @click="handleSubmit">重置密码</el-button>

          <p class="reset__footer"><router-link to="/login">返回登录</router-link></p>
        </el-form>
      </template>

      <template v-else>
        <h1 class="reset__title">密码已重置</h1>
        <p class="reset__subtitle">请使用新密码重新登录</p>
        <div class="reset__actions">
          <el-button type="primary" size="large" @click="router.push('/login')">去登录</el-button>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SiteResetPassword' })
import type { FormInstance, FormRules } from 'element-plus'
import { AuthRequest } from '@/api/auth.request'
import { TipModal } from '@/utils'

const router = useRouter()
const formRef = useTemplateRef<FormInstance>('formRef')

const success = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  phone: '',
  smsCode: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '短信验证码为 6 位数字', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).{6,20}$/, message: '密码需 6-20 位且同时包含字母与数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

async function handleSendSms() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errorMessage.value = '请先填写正确的手机号'
    return
  }
  errorMessage.value = ''
  try {
    const result = await AuthRequest.sendSms({ scene: 'reset', phone: form.phone })
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
    errorMessage.value = error?.message || '验证码发送失败'
  }
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await AuthRequest.resetPassword({ phone: form.phone, code: form.smsCode, password: form.password })
    success.value = true
  } catch (error: any) {
    errorMessage.value = error?.message || '重置失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.reset {
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
    margin-top: 24px;
  }
}
</style>
