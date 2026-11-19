<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['notice:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['notice:create']" plain type="primary" @click="handleCreate">
          <template #icon><SvgIcon name="Plus" /></template><span>新增公告</span>
        </el-button>
        <el-button v-permissions="['notice:delete']" plain type="danger" :disabled="!isMultiple" @click="handleDelete()">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="notice" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #content="{ row }">
        <span class="notice-content" :title="row.content">{{ row.content }}</span>
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === '1' ? 'success' : 'info'">{{ row.status === '1' ? '启用' : '停用' }}</el-tag>
      </template>
      <template #action="{ row }">
        <el-button v-permissions="['notice:update']" text type="primary" @click="handleEdit(row)">修改</el-button>
        <el-button v-permissions="['notice:delete']" text type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="dialogVisible" :title="form.id ? '修改公告' : '新增公告'" width="620px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit placeholder="公告标题" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="7" maxlength="5000" show-word-limit placeholder="公告内容，支持换行" />
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
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Notice' })
import type { FormInstance, FormRules } from 'element-plus'
import { TipModal } from '@/utils'
import type { Notice, ProSearchItem, ProTableColumn } from '@/types'
import { NoticeRequest } from '@/api/notice/notice.request'

const loading = ref(false)
const submitting = ref(false)
const showSearch = ref(true)
const dialogVisible = ref(false)
const list = ref<Notice.NoticeItem[]>([])
const total = ref(0)
const multipleSelection = ref<Notice.NoticeItem[]>([])
const hiddenColumnKeys = ref<string[]>([])
const formRef = useTemplateRef<FormInstance>('formRef')
const tableRef = useTemplateRef('tableRef')

const queryParams = reactive<Notice.NoticeQuery>({ pageNo: 1, pageSize: 10, keyword: '', status: '' })
const isMultiple = computed(() => multipleSelection.value.length > 0)

const items: ProSearchItem[] = [
  { label: '关键词', prop: 'keyword', type: 'input', placeholder: '标题 / 内容' },
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
  { prop: 'title', label: '标题', minWidth: 180 },
  { prop: 'content', label: '内容', slot: 'content', minWidth: 260 },
  { prop: 'sort', label: '排序', width: 70 },
  { prop: 'status', label: '状态', slot: 'status', width: 80 },
  { prop: 'createTime', label: '创建时间', width: 170 },
  { prop: 'action', label: '操作', slot: 'action', width: 140, fixed: 'right' },
]

const defaultForm = (): Notice.NoticeForm => ({ title: '', content: '', sort: 1, status: '1' })
const form = reactive<Notice.NoticeForm>(defaultForm())

const rules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
}

async function getList() {
  loading.value = true
  try {
    const data = await NoticeRequest.findList(queryParams)
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
  queryParams.keyword = ''
  queryParams.status = ''
  handleQuery()
}

function handleSelectionChange(selection: Notice.NoticeItem[]) {
  multipleSelection.value = selection
}

function handleCreate() {
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function handleEdit(record: Notice.NoticeItem) {
  Object.assign(form, record)
  dialogVisible.value = true
}

async function handleDelete(record?: Notice.NoticeItem) {
  const targetIds = record?.id ? [record.id] : multipleSelection.value.map((item) => item.id)
  if (!targetIds.length) return
  const { confirm } = await TipModal.confirm(`确认删除选中的 ${targetIds.length} 条公告吗？`)
  if (!confirm) return
  await NoticeRequest.delete({ ids: targetIds.join(',') })
  TipModal.msgSuccess('删除成功')
  if (tableRef.value) tableRef.value.clearSelection?.()
  getList()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (form.id) {
      await NoticeRequest.update(form)
      TipModal.msgSuccess('修改成功')
    } else {
      await NoticeRequest.create(form)
      TipModal.msgSuccess('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (error: any) {
    TipModal.msgError(error?.response?.data?.message || error?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(getList)
</script>

<style lang="scss" scoped>
.notice-content {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
