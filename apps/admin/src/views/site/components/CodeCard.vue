<template>
  <article class="codes-card" :class="toneClass">
    <div class="codes-card__head">
      <div class="codes-card__title">
        <span class="codes-card__gun">{{ item.gunLabel }}</span>
        <el-tag v-if="item.isFeatured" type="warning" size="small" effect="dark">精选</el-tag>
        <el-tag v-if="item.isMine" type="primary" size="small" effect="plain">我的</el-tag>
      </div>
      <div class="codes-card__actions">
        <button v-if="showFavorite" type="button" class="codes-card__action" :class="{ 'is-active': favorited }" @click="emit('favorite', item)">
          {{ favorited ? '已收藏' : '收藏' }}
        </button>
        <button type="button" class="codes-card__action codes-card__action--primary" @click="handleCopy">
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>
    </div>

    <code class="codes-card__text">{{ item.code }}</code>

    <p class="codes-card__remark">
      <span class="codes-card__label">备注</span>
      <span class="codes-card__remark-text" :class="{ 'is-empty': !item.remark }">{{ item.remark || '暂无备注' }}</span>
    </p>
  </article>
</template>

<script setup lang="ts">
defineOptions({ name: 'SiteCodeCard' })
import type { Gun } from '@/types'
import { copyText } from '@/utils'

const props = withDefaults(
  defineProps<{
    item: Gun.CodeView
    /** 是否已收藏 */
    favorited?: boolean
    /** 是否展示收藏按钮（未登录时也可展示，点击后由父级引导登录） */
    showFavorite?: boolean
    /** 卡片色调：精选淡金 / 我的淡蓝 */
    tone?: 'featured' | 'mine' | 'favorite' | 'none'
  }>(),
  { favorited: false, showFavorite: true, tone: 'none' }
)

const emit = defineEmits<{ favorite: [item: Gun.CodeView] }>()

const copied = ref(false)
const toneClass = computed(() => (props.tone === 'none' ? '' : `is-${props.tone}`))

/** 复制改枪码：提示由 copyText 内部统一处理，这里只控制按钮文案 */
async function handleCopy() {
  const { success } = await copyText(props.item.code)
  if (!success) return
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<style lang="scss" scoped>
.codes-card {
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 12px;

  /* 分区弱着色：精选淡金、我的淡蓝，配合分组标题强化归属 */
  &.is-featured {
    border-color: #fde68a;
  }

  &.is-mine {
    border-color: #bfdbfe;
  }

  &.is-favorite {
    border-color: #ddd6fe;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__gun {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
  }

  &__action {
    padding: 5px 14px;
    font-size: 12px;
    color: #4b5563;
    background: #f3f4f6;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background: #e5e7eb;
    }

    &.is-active {
      color: #d97706;
      background: rgba(245, 158, 11, 0.12);
    }

    &--primary {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.08);

      &:hover {
        background: rgba(37, 99, 235, 0.16);
      }
    }
  }

  &__text {
    display: block;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
    font-size: 13px;
    line-height: 1.7;
    color: #1f2937;
    background: #f8fafc;
    border-radius: 8px;
    word-break: break-all;
  }

  /* 备注：轻分隔线 + 弱化标签，避免色块与撞色竖条过于抢眼 */
  &__remark {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    padding-top: 10px;
    border-top: 1px dashed #eef0f4;
  }

  &__label {
    flex-shrink: 0;
    font-size: 12px;
    line-height: 21px;
    color: #9ca3af;
  }

  &__remark-text {
    font-size: 13px;
    line-height: 21px;
    color: #4b5563;
    word-break: break-all;

    &.is-empty {
      color: #c0c4cc;
    }
  }
}
</style>
