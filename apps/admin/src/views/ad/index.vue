<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['ad:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['ad:create']" plain type="primary" @click="handleCreate">
          <template #icon><SvgIcon name="Plus" /></template><span>新增广告</span>
        </el-button>
        <el-button v-permissions="['ad:delete']" plain type="danger" :disabled="!isMultiple" @click="handleDelete()">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="ad" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #position="{ row }">{{ positionLabel(row.position) }}</template>
      <template #contentType="{ row }">
        <el-tag :type="row.contentType === 'I' ? 'primary' : 'info'">{{ row.contentType === 'I' ? '图片' : '文字' }}</el-tag>
      </template>
      <template #imageUrl="{ row }">
        <el-image
          v-if="row.contentType === 'I' && row.imageUrl"
          :src="resolveFileUrl(row.imageUrl)"
          :preview-src-list="[resolveFileUrl(row.imageUrl)]"
          fit="cover"
          class="ad-thumb"
          preview-teleported
        />
        <span v-else class="text-gray">{{ row.text || '-' }}</span>
      </template>
      <template #schedule="{ row }">{{ row.startTime || '不限' }} ~ {{ row.endTime || '不限' }}</template>
      <template #status="{ row }">
        <el-tag :type="row.status === '1' ? 'success' : 'info'">{{ row.status === '1' ? '启用' : '停用' }}</el-tag>
      </template>
      <template #action="{ row }">
        <el-button v-permissions="['ad:update']" text type="primary" @click="handleEdit(row)">修改</el-button>
        <el-button v-permissions="['ad:delete']" text type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="dialogVisible" :title="form.id ? '修改广告' : '新增广告'" width="620px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="广告标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit placeholder="仅用于后台识别" />
        </el-form-item>

        <el-form-item label="展示位置" prop="position">
          <el-select v-model="form.position" placeholder="请选择展示位置" class="w-full">
            <el-option v-for="item in positionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="内容类型" prop="contentType">
          <el-radio-group v-model="form.contentType">
            <el-radio value="I">图片</el-radio>
            <el-radio value="T">文字</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.contentType === 'I'" label="广告图片" prop="imageUrl">
          <el-upload :show-file-list="false" :http-request="handleUpload" accept="image/*" class="ad-upload">
            <img v-if="form.imageUrl" :src="resolveFileUrl(form.imageUrl)" class="ad-upload__preview" alt="广告预览" />
            <div v-else class="ad-upload__placeholder">点击上传图片</div>
          </el-upload>
          <p class="ad-upload__tip">建议尺寸 1160×120，JPG/PNG，不超过 10MB</p>
        </el-form-item>

        <el-form-item v-else label="广告文案" prop="text">
          <el-input v-model="form.text" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="显示在广告位上的文字" />
        </el-form-item>

        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" maxlength="500" placeholder="https://，留空则不可点击" />
        </el-form-item>

        <el-form-item label="展示排期">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="开始时间（不限）"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="mr-8px"
          />
          <span class="mr-8px">~</span>
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="结束时间（不限）" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="1" :max="999" />
          <span class="ml-8px text-gray-500 text-12px">数字越小越靠前</span>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="1">启用</el-radio>
            <el-radio value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" maxlength="200" show-word-limit placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Ad' })
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { resolveFileUrl, TipModal } from '@/utils'
import type { Ad, ProSearchItem, ProTableColumn } from '@/types'
import { AdRequest } from '@/api/ad/ad.request'
import { UploadRequest } from '@/api/common/upload.request'

const loading = ref(false)
const submitting = ref(false)
const showSearch = ref(true)
const dialogVisible = ref(false)
const list = ref<Ad.AdItem[]>([])
const total = ref(0)
const multipleSelection = ref<Ad.AdItem[]>([])
const hiddenColumnKeys = ref<string[]>([])
const formRef = useTemplateRef<FormInstance>('formRef')
const tableRef = useTemplateRef('tableRef')

const positionOptions = [{ label: '桌面端广告位', value: 'desktop-slot' }]

const queryParams = reactive<Ad.AdQuery>({ pageNo: 1, pageSize: 10, title: '', position: '', status: '' })

const isMultiple = computed(() => multipleSelection.value.length > 0)

const items: ProSearchItem[] = [
  { label: '标题', prop: 'title', type: 'input', placeholder: '广告标题' },
  { label: '位置', prop: 'position', type: 'select', options: positionOptions },
  {
    label: '状态',
    prop: 'status',
    type: 'select',
    options: [
      { label: '启用', value: '1' },
      { label: '停用', value: '0' },
    ],
  },
]

const columns: ProTableColumn[] = [
  { type: 'selection', width: 50 },
  { prop: 'title', label: '标题', minWidth: 160 },
  { prop: 'position', label: '位置', slot: 'position', width: 130 },
  { prop: 'contentType', label: '类型', slot: 'contentType', width: 80 },
  { prop: 'imageUrl', label: '内容', slot: 'imageUrl', minWidth: 200 },
  { prop: 'schedule', label: '排期', slot: 'schedule', width: 300 },
  { prop: 'sort', label: '排序', width: 70 },
  { prop: 'status', label: '状态', slot: 'status', width: 80 },
  { prop: 'viewCount', label: '曝光', width: 80 },
  { prop: 'clickCount', label: '点击', width: 80 },
  { prop: 'action', label: '操作', slot: 'action', width: 140, fixed: 'right' },
]

const defaultForm = (): Ad.AdForm => ({
  title: '',
  position: 'desktop-slot',
  contentType: 'I',
  imageUrl: '',
  linkUrl: '',
  text: '',
  sort: 1,
  status: '1',
  startTime: null,
  endTime: null,
  remark: '',
})

const form = reactive<Ad.AdForm>(defaultForm())

const rules: FormRules = {
  title: [{ required: true, message: '请输入广告标题', trigger: 'blur' }],
  position: [{ required: true, message: '请选择展示位置', trigger: 'change' }],
  contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  imageUrl: [{ required: true, message: '请上传广告图片', trigger: 'change' }],
  text: [{ required: true, message: '请输入广告文案', trigger: 'blur' }],
}

function positionLabel(value: string) {
  return positionOptions.find((item) => item.value === value)?.label ?? value
}

async function getList() {
  loading.value = true
  try {
    const data = await AdRequest.findList(queryParams)
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

function resetQuery() {
  queryParams.title = ''
  queryParams.position = ''
  queryParams.status = ''
  handleQuery()
}

function handleSelectionChange(selection: Ad.AdItem[]) {
  multipleSelection.value = selection
}

function handleCreate() {
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function handleEdit(record: Ad.AdItem) {
  Object.assign(form, record, {
    startTime: record.startTime ?? null,
    endTime: record.endTime ?? null,
    imageUrl: record.imageUrl ?? '',
    linkUrl: record.linkUrl ?? '',
    text: record.text ?? '',
    remark: record.remark ?? '',
  })
  dialogVisible.value = true
}

async function handleDelete(record?: Ad.AdItem) {
  const targetIds = record?.id ? [record.id] : multipleSelection.value.map((item) => item.id)
  if (!targetIds.length) return
  const { confirm } = await TipModal.confirm(`确认删除选中的 ${targetIds.length} 条广告吗？`)
  if (!confirm) return
  await AdRequest.delete({ ids: targetIds.join(',') })
  TipModal.msgSuccess('删除成功')
  if (tableRef.value) tableRef.value.clearSelection?.()
  getList()
}

async function handleUpload(options: UploadRequestOptions) {
  const formData = new FormData()
  formData.append('file', options.file as File)
  const url = await UploadRequest.uploadFile(formData)
  form.imageUrl = url
  TipModal.msgSuccess('图片上传成功')
  return url
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (form.contentType === 'I' && !form.imageUrl) {
      TipModal.msgError('请上传广告图片')
      return
    }
    if (form.contentType === 'T' && !form.text) {
      TipModal.msgError('请输入广告文案')
      return
    }
    if (form.id) {
      await AdRequest.update(form)
      TipModal.msgSuccess('修改成功')
    } else {
      await AdRequest.create(form)
      TipModal.msgSuccess('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (error: any) {
    TipModal.msgError(error?.message || '保存失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(getList)
</script>

<style lang="scss" scoped>
.ad-thumb {
  width: 180px;
  height: 44px;
  border-radius: 6px;
}

.ad-upload {
  &__preview {
    width: 280px;
    height: 58px;
    object-fit: cover;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 280px;
    height: 58px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color-lighter);
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
  }
}

.ad-upload__tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
