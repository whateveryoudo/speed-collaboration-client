import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'

export interface CollaborationUser {
  id: string | number
  name: string
  avatar?: string
  color?: string
  [key: string]: any
}

export interface CollaborationConfig {
  documentId: string
  url: string
  token?: string
  user?: CollaborationUser
  knowledgeId?: string
  [key: string]: any
}

export type CollaborationStatus = 'disconnected' | 'connecting' | 'connected'

export interface CollaborationSessionEvents {
  /** Y.Doc 与远端同步完成事件（此时 ydoc 已包含完整 CRDT 状态） */
  onSynced?: (doc: Y.Doc) => void
  /** 在线协同成员变化事件（已去重并过滤空值） */
  onAwarenessUpdate?: (users: CollaborationUser[]) => void
  /** 连接状态变更事件 */
  onStatusChange?: (status: CollaborationStatus) => void
  /** 会话销毁事件 */
  onDestroy?: () => void
}

export interface CollaborationSessionOptions extends CollaborationConfig, CollaborationSessionEvents {
  /** 是否自动建立连接，默认为 true */
  autoConnect?: boolean
  /** 外部传入已存在的 Y.Doc 实例（可选） */
  document?: Y.Doc
}
