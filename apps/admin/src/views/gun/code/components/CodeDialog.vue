<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="武器分类">
        <el-input :model-value="props.dictName" disabled />
      </el-form-item>
      <el-form-item label="枪械" prop="gunValue">
        <el-select v-if="!isEdit && !props.gunValue" v-model="form.gunValue" placeholder="请选择枪械" filterable class="w-full">
          <el-option v-for="gunItem in props.guns ?? []" :key="gunItem.value" :label="gunItem.label" :value="gunItem.value" />
        </el-select>
        <el-input v-else :model-value="displayGunLabel" disabled />
      </el-form-item>
      <el-form-item label="改枪码" prop="code">
        <el-input v-model.trim="form.code" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="粘贴或输入改枪码" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model.trim="form.remark" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="可选，例如适用模式、版本" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'GunCodeDialog' })
import { TipModal } from '@/utils'
import type { Gun } from '@/types'
import type { FormRules } from 'element-plus'
import { GunCodeRequest } from '@/api/gun/code.request'

const props = defineProps<{
  dictType?: string
  dictName?: string
  gunValue?: string
  gunLabel?: string
  guns?: Gun.GunOption[]
}>()

const emit = defineEmits<{ success: [] }>()

const appStore = useAppStore()
const visible = ref(false)
const formRef = useTemplateRef('formRef')
const form = ref<Gun.CodeForm>({})
const displayGunLabel = ref('')
const isEdit = computed(() => Boolean(form.value.id))
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isEdit.value ? '修改改枪码' : '提交改枪码'))

/** 未选中具体枪械（全部武器模式）时，新增必须显式选择枪械 */
const rules = computed<FormRules<Gun.CodeForm>>(() => ({
  code: [{ required: true, message: '改枪码不能为空', trigger: 'blur' }],
  gunValue: !isEdit.value && !props.gunValue ? [{ required: true, message: '请选择枪械', trigger: 'change' }] : [],
}))

/** 打开弹窗：传记录为编辑模式，不传为新增模式 */
function open(record?: Gun.CodeItem) {
  visible.value = true
  if (record?.id) {
    form.value = { id: record.id, gunValue: record.gunValue, code: record.code, remark: record.remark ?? '' }
    displayGunLabel.value = record.gunLabel
  } else {
    form.value = { gunValue: props.gunValue ?? '', code: '', remark: '' }
    displayGunLabel.value = props.gunLabel ?? ''
  }
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    if (isEdit.value) {
      await GunCodeRequest.update({ id: form.value.id, code: form.value.code, remark: form.value.remark })
    } else {
      await GunCodeRequest.create({
        dictType: props.dictType,
        gunValue: props.gunValue || form.value.gunValue,
        code: form.value.code,
        remark: form.value.remark,
      })
    }
    visible.value = false
    emit('success')
    TipModal.msgSuccess(isEdit.value ? '修改成功' : '提交成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

defineExpose({ open })
</script>
