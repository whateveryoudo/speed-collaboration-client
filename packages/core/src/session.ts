import * as Y from 'yjs'
import { HocuspocusProvider, type onAwarenessUpdateParameters } from '@hocuspocus/provider'
import type {
  CollaborationConfig,
  CollaborationSessionOptions,
  CollaborationStatus,
  CollaborationUser,
} from './types'

export class CollaborationSession {
  private _doc: Y.Doc | null = null
  private _provider: HocuspocusProvider | null = null
  private _status: CollaborationStatus = 'disconnected'
  private _isSynced = false
  private _options: CollaborationSessionOptions

  constructor(options: CollaborationSessionOptions) {
    this._options = options
    if (options.autoConnect !== false) {
      this.connect()
    }
  }

  public get doc(): Y.Doc | null {
    return this._doc
  }

  public get provider(): HocuspocusProvider | null {
    return this._provider
  }

  public get status(): CollaborationStatus {
    return this._status
  }

  public get isSynced(): boolean {
    return this._isSynced
  }

  /**
   * 建立协同长连接并初始化 Y.Doc
   */
  public connect(): void {
    if (this._provider) {
      return
    }

    const { documentId, url, token, user, knowledgeId } = this._options
    if (!documentId || !url) {
      return
    }

    this._status = 'connecting'
    this._options.onStatusChange?.(this._status)

    // 1. 初始化 Y.Doc（支持外部传入或创建全新实例）
    const doc = this._options.document || new Y.Doc()
    this._doc = doc

    // 2. 组装长连接 URL（支持自动拼接 knowledgeId）
    let targetUrl = url
    if (knowledgeId && !targetUrl.includes('knowledgeId=')) {
      const delimiter = targetUrl.includes('?') ? '&' : '?'
      targetUrl = `${targetUrl}${delimiter}knowledgeId=${encodeURIComponent(knowledgeId)}`
    }

    // 3. 实例化 HocuspocusProvider
    this._provider = new HocuspocusProvider({
      name: documentId,
      url: targetUrl,
      token: token || '',
      document: doc,
      onSynced: () => {
        this._isSynced = true
        this._status = 'connected'
        this._options.onStatusChange?.(this._status)
        this._options.onSynced?.(doc)
      },
      onAwarenessUpdate: (params: onAwarenessUpdateParameters) => {
        const users = (params.states as Array<{ user?: CollaborationUser }>)
          .map((s) => s.user)
          .filter((u): u is CollaborationUser => Boolean(u && u.id))
        this._options.onAwarenessUpdate?.(users)
      },
      onClose: () => {
        if (this._status !== 'disconnected') {
          this._status = 'connecting'
          this._options.onStatusChange?.(this._status)
        }
      },
      onDestroy: () => {
        this._status = 'disconnected'
        this._options.onStatusChange?.(this._status)
      },
    })

    // 4. 若传入了初始用户信息，立即同步至 Awareness
    if (user) {
      this.setLocalUser(user)
    }
  }

  /**
   * 更新当前用户的本地协同信息（光标、昵称、头像、颜色）
   */
  public setLocalUser(user: CollaborationUser): void {
    if (this._provider?.awareness) {
      this._provider.awareness.setLocalStateField('user', user)
    }
  }

  /**
   * 主动断开连接但不销毁内部数据
   */
  public disconnect(): void {
    this._provider?.disconnect()
    this._status = 'disconnected'
    this._options.onStatusChange?.(this._status)
  }

  /**
   * 彻底销毁长连接、重置状态并释放 Y.Doc 内存（杜绝内存泄漏与多文档串联）
   */
  public destroy(): void {
    this._isSynced = false
    this._status = 'disconnected'

    if (this._provider) {
      try {
        this._provider.awareness?.setLocalState(null)
        this._provider.disconnect()
        this._provider.destroy()
      } catch (err) {
        console.warn('[speed-collaboration] error destroying provider:', err)
      }
      this._provider = null
    }

    if (this._doc) {
      try {
        this._doc.destroy()
      } catch (err) {
        console.warn('[speed-collaboration] error destroying ydoc:', err)
      }
      this._doc = null
    }

    this._options.onDestroy?.()
    this._options.onStatusChange?.(this._status)
  }
}

/**
 * 创建无框架依赖的通用协同会话实例
 */
export function createCollaborationSession(options: CollaborationSessionOptions): CollaborationSession {
  return new CollaborationSession(options)
}

