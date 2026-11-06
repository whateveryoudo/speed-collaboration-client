import {
  computed,
  onUnmounted,
  ref,
  shallowRef,
  unref,
  watch,
  type MaybeRef,
  type Ref,
  type ShallowRef,
} from 'vue'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import {
  CollaborationSession,
  type CollaborationConfig,
  type CollaborationStatus,
  type CollaborationUser,
} from '@speed-collaboration/core'

export interface UseCollaborationOptions {
  config: MaybeRef<CollaborationConfig | null | undefined>
  enabled?: MaybeRef<boolean>
  onCollaboratorsChange?: (collaborators: CollaborationUser[]) => void
  onSynced?: (doc: Y.Doc) => void
  onStatusChange?: (status: CollaborationStatus) => void
}

export interface UseCollaborationReturn {
  /** Y.Doc 实例（仅在与服务端同步完成 onSynced 后暴露，避免渲染空骨架） */
  ydoc: ShallowRef<Y.Doc | null>
  /** HocuspocusProvider 通信实例 */
  provider: ShallowRef<HocuspocusProvider | null>
  /** 当前连接状态 */
  status: Ref<CollaborationStatus>
  /** 当前在线协作者列表 */
  collaborators: Ref<CollaborationUser[]>
  /** 是否已完成首轮全量同步 */
  isSynced: Ref<boolean>
  /** 底层通用 Session 实例引用 */
  session: ShallowRef<CollaborationSession | null>
  /** 主动销毁当前协同会话 */
  destroy: () => void
  /** 主动重连 */
  reconnect: () => void
}

/**
 * Vue 3 通用实时协同 Hook：
 * 统一管理 Y.Doc 与 HocuspocusProvider 生命周期，自动监听路由与配置变更，防泄漏、防多实例冲突。
 */
export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  const ydoc = shallowRef<Y.Doc | null>(null)
  const provider = shallowRef<HocuspocusProvider | null>(null)
  const status = ref<CollaborationStatus>('disconnected')
  const collaborators = ref<CollaborationUser[]>([])
  const isSynced = ref(false)
  const session = shallowRef<CollaborationSession | null>(null)

  let activeSession: CollaborationSession | null = null

  const destroy = () => {
    if (activeSession) {
      activeSession.destroy()
      activeSession = null
    }
    session.value = null
    ydoc.value = null
    provider.value = null
    collaborators.value = []
    isSynced.value = false
    status.value = 'disconnected'
  }

  const setup = () => {
    destroy()

    const cfg = unref(options.config)
    const isEnabled = unref(options.enabled) ?? true

    if (!isEnabled || !cfg?.documentId || !cfg?.url) {
      return
    }

    status.value = 'connecting'

    activeSession = new CollaborationSession({
      ...cfg,
      autoConnect: true,
      onSynced: (doc) => {
        isSynced.value = true
        status.value = 'connected'
        ydoc.value = doc
        provider.value = activeSession?.provider ?? null
        options.onSynced?.(doc)
      },
      onAwarenessUpdate: (users) => {
        collaborators.value = users
        options.onCollaboratorsChange?.(users)
      },
      onStatusChange: (st) => {
        status.value = st
        options.onStatusChange?.(st)
      },
      onDestroy: () => {
        status.value = 'disconnected'
      },
    })

    session.value = activeSession
  }

  // 深度监听 config 与 enabled 变化，发生变更时自动重连或断开
  watch(
    [() => unref(options.config), () => unref(options.enabled)],
    setup,
    { immediate: true, deep: true },
  )

  onUnmounted(destroy)

  return {
    ydoc,
    provider,
    status,
    collaborators,
    isSynced,
    session,
    destroy,
    reconnect: setup,
  }
}

