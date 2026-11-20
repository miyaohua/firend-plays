<template>
  <div class="app-content flex h-full gap-16px" :class="{ 'flex-col': appStore.isMobile }">
    <!-- 左侧武器分类 -->
    <el-card shadow="never" class="gun-type-card w-220px shrink-0" body-class="h-full">
      <div class="h-full flex flex-col">
        <div class="mb-12px flex items-center gap-8px">
          <SvgIcon name="Operation" />
          <span class="font-bold">武器分类</span>
        </div>
        <div class="gun-type-list flex-1 overflow-auto">
          <div
            v-for="typeItem in typeList"
            :key="typeItem.dictType"
            class="gun-type-item"
            :class="{ 'is-active': selectedType?.dictType === typeItem.dictType }"
            @click="handleSelectType(typeItem)"
          >
            <span class="gun-type-item__name">{{ typeItem.dictName }}</span>
            <span class="gun-type-item__count">{{ typeItem.guns.length }}</span>
          </div>
          <el-empty v-if="!typeList.length" :image-size="60" description="暂无武器分类" />
        </div>
      </div>
    </el-card>

    <!-- 右侧改枪码列表 -->
    <div class="flex flex-col flex-1 min-w-0">
      <el-empty v-if="!selectedType" description="请选择左侧武器分类后查看改枪码" class="flex-1" />

      <template v-else>
        <div class="gun-switch mb-12px overflow-auto">
          <el-radio-group v-model="selectedGunValue" @change="handleGunChange">
            <el-radio-button value="">全部武器</el-radio-button>
            <el-radio-button v-for="gunItem in selectedType.guns" :key="gunItem.value" :value="gunItem.value">{{ gunItem.label }}</el-radio-button>
          </el-radio-group>
        </div>

        <ProSearch v-show="showSearch" v-permissions="['gun:code:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

        <div class="mb-16px flex items-center justify-between">
          <div>
            <el-button v-permissions="['gun:code:create']" plain type="primary" @click="handleCreate">
              <template #icon><SvgIcon name="Plus" /></template><span>新增改枪码</span>
            </el-button>
            <el-button v-permissions="['gun:code:delete']" plain type="danger" :disabled="!isMultiple" @click="handleDelete()">
              <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
            </el-button>
          </div>
          <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="gun:code" @refresh="getList" />
        </div>

        <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
          <template #code="{ row }">
            <span class="break-all">{{ row.code }}</span>
          </template>
          <template #remark="{ row }">{{ row.remark || '-' }}</template>
          <template #isFeatured="{ row }">
            <el-tag v-if="row.isFeatured === '1'" type="warning">精选</el-tag>
            <el-tag v-if="row.isAnchor === '1'" type="primary">主播</el-tag>
            <el-tag v-if="row.isMine" type="info">我的</el-tag>
            <span v-if="row.isFeatured !== '1' && row.isAnchor !== '1' && !row.isMine">-</span>
          </template>
          <template #action="{ row }">
            <el-link v-if="row.isMine" v-permissions="['gun:code:update']" type="primary" @click="handleEdit(row as Gun.CodeItem)">修改</el-link>
            <el-link v-if="row.isMine || isSuperAdmin" v-permissions="['gun:code:delete']" type="primary" @click="handleDelete(row as Gun.CodeItem)">删除</el-link>
            <el-link v-if="isSuperAdmin" v-permissions="['gun:code:feature']" type="warning" @click="handleFeatured(row as Gun.CodeItem)">
              {{ row.isFeatured === '1' ? '取消精选' : '设为精选' }}
            </el-link>
            <el-link v-if="isSuperAdmin" v-permissions="['gun:code:anchor']" type="primary" @click="handleAnchor(row as Gun.CodeItem)">
              {{ row.isAnchor === '1' ? '取消主播' : '设为主播' }}
            </el-link>
          </template>
        </ProTable>

        <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />
      </template>
    </div>

    <CodeDialog
      ref="dialogRef"
      :dict-type="selectedType?.dictType"
      :dict-name="selectedType?.dictName"
      :gun-value="selectedGunValue"
      :gun-label="selectedGunLabel"
      :guns="selectedType?.guns"
      @success="getList"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'GunCode' })
import { TipModal } from '@/utils'
import type { Gun, ProSearchItem, ProTableColumn } from '@/types'
import { GunCodeRequest } from '@/api/gun/code.request'
import CodeDialog from './components/CodeDialog.vue'

const appStore = useAppStore()
const userStore = useUserStore()

/** 是否超管：决定「精选」操作与查看范围筛选是否可见 */
const isSuperAdmin = computed(() => (userStore.roles ?? []).includes('admin'))

const loading = ref(false)
const typeList = ref<Gun.TypeOption[]>([])
const selectedType = ref<Gun.TypeOption | null>(null)
/** 空字符串表示「全部武器」，此时不向接口传 gunValue */
const selectedGunValue = ref('')
const selectedGunLabel = computed(() => selectedType.value?.guns.find((gunItem) => gunItem.value === selectedGunValue.value)?.label ?? '全部武器')
const list = ref<Gun.CodeItem[]>([])
const total = ref(0)
const showSearch = ref(true)
const multipleSelection = ref<Gun.CodeItem[]>([])
const hiddenColumnKeys = ref<string[]>([])
const dialogRef = useTemplateRef('dialogRef')
const tableRef = useTemplateRef('tableRef')
const queryParams = reactive<Gun.CodeQuery>({ pageNo: 1, pageSize: 10, keyword: '', scope: 'all' })

const isMultiple = computed(() => multipleSelection.value.length > 0)

const items = computed<ProSearchItem[]>(() => {
  const baseItems: ProSearchItem[] = [{ label: '关键词', prop: 'keyword', type: 'input', placeholder: '改枪码 / 备注' }]
  if (!isSuperAdmin.value) return baseItems
  return [
    ...baseItems,
    {
      label: '查看范围',
      prop: 'scope',
      type: 'select',
      options: [
        { label: '全部', value: 'all' },
        { label: '我的', value: 'mine' },
        { label: '精选', value: 'featured' },
        { label: '主播', value: 'anchor' },
      ],
    },
  ]
})

const columns: ProTableColumn[] = [
  { type: 'selection', width: 50 },
  { prop: 'code', label: '改枪码', slot: 'code', minWidth: 240 },
  { prop: 'gunLabel', label: '枪械', width: 140 },
  { prop: 'remark', label: '备注', slot: 'remark', minWidth: 120 },
  { prop: 'username', label: '提交人', width: 110 },
  { prop: 'isFeatured', label: '标记', slot: 'isFeatured', width: 90 },
  { prop: 'createTime', label: '提交时间', width: 170 },
  { prop: 'action', label: '操作', slot: 'action', width: 190, fixed: 'right' },
]

/** 拉取分类与枪械选项，默认选中第一个分类 + 全部武器 */
async function getOptions() {
  typeList.value = await GunCodeRequest.getOptions()
  if (!typeList.value.length) return
  selectedType.value = typeList.value[0]
  selectedGunValue.value = ''
  await getList()
}

async function getList() {
  if (!selectedType.value) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const data = await GunCodeRequest.findList({
      ...queryParams,
      dictType: selectedType.value.dictType,
      gunValue: selectedGunValue.value || undefined,
    })
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 切换分类：回到「全部武器」并重新查询 */
function handleSelectType(typeItem: Gun.TypeOption) {
  selectedType.value = typeItem
  selectedGunValue.value = ''
  queryParams.pageNo = 1
  getList()
}

/** 切换枪械 */
function handleGunChange() {
  queryParams.pageNo = 1
  getList()
}

function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

function resetQuery() {
  queryParams.keyword = ''
  queryParams.scope = 'all'
  handleQuery()
}

function handleSelectionChange(rows: Gun.CodeItem[]) {
  multipleSelection.value = rows
}

function handleCreate() {
  dialogRef.value?.open()
}

function handleEdit(record: Gun.CodeItem) {
  dialogRef.value?.open(record)
}

async function handleDelete(record?: Gun.CodeItem) {
  const targetIds = record?.id ? [record.id] : multipleSelection.value.map((item) => item.id)
  if (!targetIds.length) return
  const { confirm } = await TipModal.confirm(`确认删除选中的 ${targetIds.length} 条改枪码吗？`)
  if (!confirm) return
  await GunCodeRequest.delete({ ids: targetIds.join(',') })
  TipModal.msgSuccess('删除成功')
  if (tableRef.value) tableRef.value.clearSelection?.()
  getList()
}

/** 主播推荐 / 取消（仅超管可见） */
async function handleAnchor(record: Gun.CodeItem) {
  const willAnchor = record.isAnchor !== '1'
  const { confirm } = await TipModal.confirm(willAnchor ? '确认将该改枪码设为「主播改枪码」？' : '确认取消该改枪码的主播标记？')
  if (!confirm) return
  await GunCodeRequest.setAnchor({ id: record.id, isAnchor: willAnchor ? '1' : '0' })
  TipModal.msgSuccess(willAnchor ? '已设为主播改枪码' : '已取消主播标记')
  getList()
}

/** 精选 / 取消精选（仅超管可见） */
async function handleFeatured(record: Gun.CodeItem) {
  const willFeatured = record.isFeatured !== '1'
  const { confirm } = await TipModal.confirm(willFeatured ? '确认将该改枪码设为精选？设为精选后所有用户都能看到。' : '确认取消该改枪码的精选标记？')
  if (!confirm) return
  await GunCodeRequest.setFeatured({ id: record.id, isFeatured: willFeatured ? '1' : '0' })
  TipModal.msgSuccess(willFeatured ? '已设为精选' : '已取消精选')
  getList()
}

onMounted(getOptions)
</script>

<style lang="scss" scoped>
.gun-type-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.gun-type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.is-active {
    color: #ffffff;
    background-color: var(--el-color-primary);
  }

  &__count {
    font-size: 12px;
    opacity: 0.75;
  }
}

.gun-switch {
  padding-bottom: 4px;

  :deep(.el-radio-group) {
    flex-wrap: nowrap;
  }
}
</style>
