<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['gun:feedback:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div class="text-gray-500 text-13px">用户对精选改枪码提交的无效反馈，处理后可在列表中查看记录</div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="gun:feedback" @refresh="getList" />
    </div>

    <ProTable v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys">
      <template #code="{ row }">
        <span class="break-all">{{ row.code || '-' }}</span>
      </template>
      <template #reason="{ row }">{{ row.reason || '-' }}</template>
      <template #status="{ row }">
        <el-tag :type="statusMeta(row.status).type">{{ statusMeta(row.status).label }}</el-tag>
      </template>
      <template #handleTime="{ row }">{{ row.handleTime || '-' }}</template>
      <template #handleRemark="{ row }">{{ row.handleRemark || '-' }}</template>
      <template #action="{ row }">
        <el-button v-permissions="['gun:feedback:handle']" text type="primary" :disabled="row.status !== '0'" @click="handleOpen(row)">处理</el-button>
        <el-button v-permissions="['gun:feedback:handle']" text type="primary" @click="handleOpen(row)">查看</el-button>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="dialogVisible" title="处理反馈" width="520px" destroy-on-close>
      <div class="feedback-detail">
        <p><span class="feedback-detail__label">枪械</span>{{ current?.gunLabel || '-' }}</p>
        <p><span class="feedback-detail__label">改枪码</span><span class="break-all">{{ current?.code || '-' }}</span></p>
        <p><span class="feedback-detail__label">反馈人</span>{{ current?.username || '-' }}</p>
        <p><span class="feedback-detail__label">反馈说明</span>{{ current?.reason || '未填写' }}</p>
        <p><span class="feedback-detail__label">反馈时间</span>{{ current?.createTime || '-' }}</p>
      </div>

      <el-form label-width="80px" class="mt-16px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="handleForm.status">
            <el-radio value="1">已处理</el-radio>
            <el-radio value="2">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="可选，例如：已核实并取消精选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'GunFeedback' })
import { TipModal } from '@/utils'
import type { Gun, ProSearchItem, ProTableColumn } from '@/types'
import { GunCodeRequest } from '@/api/gun/code.request'

const loading = ref(false)
const submitting = ref(false)
const showSearch = ref(true)
const dialogVisible = ref(false)
const list = ref<Gun.FeedbackItem[]>([])
const total = ref(0)
const current = ref<Gun.FeedbackItem | null>(null)
const hiddenColumnKeys = ref<string[]>([])

const queryParams = reactive<Gun.FeedbackQuery>({ pageNo: 1, pageSize: 10, keyword: '', status: '' })
const handleForm = reactive({ status: '1', remark: '' })

const items: ProSearchItem[] = [
  { label: '关键词', prop: 'keyword', type: 'input', placeholder: '改枪码 / 枪械 / 反馈人' },
  {
    label: '状态',
    prop: 'status',
    type: 'select',
    options: [
      { label: '待处理', value: '0' },
      { label: '已处理', value: '1' },
      { label: '已忽略', value: '2' },
    ],
  },
]

const columns: ProTableColumn[] = [
  { prop: 'gunLabel', label: '枪械', width: 130 },
  { prop: 'code', label: '改枪码', slot: 'code', minWidth: 240 },
  { prop: 'username', label: '反馈人', width: 120 },
  { prop: 'reason', label: '反馈说明', slot: 'reason', minWidth: 160 },
  { prop: 'status', label: '状态', slot: 'status', width: 90 },
  { prop: 'createTime', label: '反馈时间', width: 170 },
  { prop: 'handleRemark', label: '处理备注', slot: 'handleRemark', minWidth: 140 },
  { prop: 'handleTime', label: '处理时间', slot: 'handleTime', width: 170 },
  { prop: 'action', label: '操作', slot: 'action', width: 140, fixed: 'right' },
]

function statusMeta(status: string) {
  if (status === '1') return { label: '已处理', type: 'success' as const }
  if (status === '2') return { label: '已忽略', type: 'info' as const }
  return { label: '待处理', type: 'warning' as const }
}

async function getList() {
  loading.value = true
  try {
    const data = await GunCodeRequest.findFeedbackList(queryParams)
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

function handleOpen(row: Gun.FeedbackItem) {
  current.value = row
  handleForm.status = row.status === '0' ? '1' : row.status
  handleForm.remark = row.handleRemark || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!current.value) return
  submitting.value = true
  try {
    await GunCodeRequest.handleFeedback({ id: current.value.id, status: handleForm.status, remark: handleForm.remark || undefined })
    TipModal.msgSuccess('处理成功')
    dialogVisible.value = false
    getList()
  } catch (error: any) {
    TipModal.msgError(error?.response?.data?.message || error?.message || '处理失败')
  } finally {
    submitting.value = false
  }
}

onMounted(getList)
</script>

<style lang="scss" scoped>
.feedback-detail {
  p {
    display: flex;
    gap: 8px;
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__label {
    flex-shrink: 0;
    width: 64px;
    color: var(--el-text-color-secondary);
  }
}
</style>
