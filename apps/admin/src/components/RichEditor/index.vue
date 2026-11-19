<template>
  <div class="rich-editor">
    <div class="rich-editor__toolbar">
      <button type="button" title="加粗" @click="exec('bold')"><b>B</b></button>
      <button type="button" title="斜体" @click="exec('italic')"><i>I</i></button>
      <button type="button" title="下划线" @click="exec('underline')"><u>U</u></button>
      <button type="button" title="删除线" @click="exec('strikeThrough')"><s>S</s></button>
      <span class="rich-editor__divider"></span>
      <button type="button" title="标题" @click="formatBlock('h2')">H2</button>
      <button type="button" title="小标题" @click="formatBlock('h3')">H3</button>
      <button type="button" title="正文" @click="formatBlock('p')">正文</button>
      <span class="rich-editor__divider"></span>
      <button type="button" title="无序列表" @click="exec('insertUnorderedList')">• 列表</button>
      <button type="button" title="有序列表" @click="exec('insertOrderedList')">1. 列表</button>
      <button type="button" title="引用" @click="formatBlock('blockquote')">引用</button>
      <span class="rich-editor__divider"></span>
      <button type="button" title="插入链接" @click="insertLink">链接</button>
      <button type="button" title="上传图片" :disabled="uploading" @click="pickImage">{{ uploading ? '上传中…' : '图片' }}</button>
      <span class="rich-editor__divider"></span>
      <button type="button" title="清除格式" @click="exec('removeFormat')">清除格式</button>
    </div>

    <div
      ref="editorRef"
      class="rich-editor__content"
      contenteditable="true"
      data-placeholder="请输入公告内容，可插入图片"
      @input="handleInput"
      @blur="handleBlur"
    ></div>

    <input ref="fileRef" type="file" accept="image/*" class="rich-editor__file" @change="handleFileChange" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'RichEditor' })
import { TipModal } from '@/utils'
import { UploadRequest } from '@/api/common/upload.request'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editorRef = useTemplateRef<HTMLDivElement>('editorRef')
const fileRef = useTemplateRef<HTMLInputElement>('fileRef')
const uploading = ref(false)

/** 同步外部值到编辑器（避免光标跳动，仅在内容不一致时写入） */
watch(
  () => props.modelValue,
  (value) => {
    const editor = editorRef.value
    if (editor && editor.innerHTML !== (value || '')) editor.innerHTML = value || ''
  },
  { immediate: true },
)

onMounted(() => {
  // 弹窗打开时组件才挂载，watch 首次触发时 ref 还未就绪，这里补一次回填
  if (editorRef.value) editorRef.value.innerHTML = props.modelValue || ''
})

function handleInput() {
  emit('update:modelValue', editorRef.value?.innerHTML || '')
}

function handleBlur() {
  handleInput()
}

function exec(command: string, value?: string) {
  editorRef.value?.focus()
  document.execCommand(command, false, value)
  handleInput()
}

function formatBlock(tag: string) {
  exec('formatBlock', `<${tag}>`)
}

function insertLink() {
  const url = window.prompt('请输入链接地址（https://）')
  if (!url) return
  exec('createLink', url)
}

function pickImage() {
  fileRef.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const path = await UploadRequest.uploadFile(formData)
    editorRef.value?.focus()
    // 统一存 /api/uploads/xxx，官网与桌面端都能解析
    document.execCommand('insertImage', false, `/api/${path}`)
    handleInput()
  } catch {
    TipModal.msgError('图片上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style lang="scss" scoped>
.rich-editor {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px 8px;
    background: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);

    button {
      min-width: 28px;
      padding: 4px 8px;
      font-size: 12px;
      color: var(--el-text-color-regular);
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }

  &__divider {
    width: 1px;
    margin: 2px 4px;
    background: var(--el-border-color-lighter);
  }

  &__content {
    min-height: 220px;
    max-height: 420px;
    padding: 12px 14px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.8;
    color: var(--el-text-color-regular);
    outline: none;

    &:empty::before {
      color: var(--el-text-color-placeholder);
      content: attr(data-placeholder);
    }

    :deep(img) {
      max-width: 100%;
      border-radius: 6px;
    }

    :deep(blockquote) {
      margin: 8px 0;
      padding: 6px 12px;
      color: var(--el-text-color-secondary);
      border-left: 3px solid var(--el-border-color);
    }
  }

  &__file {
    display: none;
  }
}
</style>
