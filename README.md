# Speed Collaboration Client

Universal real-time collaboration client SDK powered by **Yjs** & **Hocuspocus**.

专为富文本编辑器（Tiptap/ProseMirror）、电子表格（Sheet）、协作白板（Board/Mindmap）打造的轻量通用实时协同连接器。

---

## 🌟 特性

- 🌐 **跨框架架构**：
  - `@speed-collaboration/core`：纯 TypeScript 编写，零 UI 框架依赖，支持 Node.js、原生 JS、React、Svelte 等任意环境；
  - `@speed-collaboration/vue3`：针对 Vue 3 的 Composition API 封装（`useCollaboration`）。
- 🔒 **严格单例安全**：统一集中管控 `Y.Doc` 与 `HocuspocusProvider` 生命周期，彻底杜绝 Yjs 多实例类型冲突（`instanceof` 失败）。
- ⚡ **智能生命周期**：平滑断线重连、Awareness 在线协作者状态自动同步、组件卸载自动彻底释放内存。
- 📦 **开箱即用**：编辑器与画布层仅需作为纯粹的数据消费端（`:ydoc="ydoc"`），彻底解耦通信层与渲染层。

---

## 📦 包结构

```text
speed-collaboration-client/
├── packages/
│   ├── core/      # @speed-collaboration/core (通用纯 TS 协同内核)
│   └── vue3/      # @speed-collaboration/vue3 (Vue 3 响应式 Hook)
└── .changeset/    # 自动化版本发布与 Changelog 管理
```

---

## 🚀 快速上手 (Vue 3)

### 1. 安装

```bash
pnpm add @speed-collaboration/vue3 yjs @hocuspocus/provider
```

### 2. 使用 Hook

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useCollaboration } from '@speed-collaboration/vue3'

const config = computed(() => ({
  documentId: 'doc_12345',
  url: 'ws://localhost:3004/collaboration',
  token: 'YOUR_AUTH_TOKEN',
  user: {
    id: 'user_1',
    name: '张三',
    avatar: 'https://...',
    color: '#ff5722',
  },
}))

const { ydoc, provider, collaborators, isSynced } = useCollaboration({
  config,
  enabled: true,
  onCollaboratorsChange: (users) => {
    console.log('当前在线协同成员:', users)
  },
})
</script>

<template>
  <div v-if="ydoc">
    <!-- 将 ydoc 直接传递给任意支持 Yjs 的编辑器组件 -->
    <SpeedSheet :ydoc="ydoc" />
  </div>
  <div v-else>正在同步远端协同数据...</div>
</template>
```

---

## 🛠️ 包发布与版本管理 (Changeset)

该仓库使用 [Changesets](https://github.com/changesets/changesets) 自动化管理版本与更新日志：

```bash
# 1. 提交变更描述
pnpm changeset

# 2. 提升版本号并生成 CHANGELOG
pnpm version-packages

# 3. 构建并发布到 npm
pnpm release
```

---

## 📄 License

[MIT](./LICENSE)
