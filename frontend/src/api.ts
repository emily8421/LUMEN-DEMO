// Barrel: re-exports the per-domain API modules under frontend/src/api/.
// 既有的 `import { ... } from './api'` 调用方完全不变（零破坏）。
// 新增域（如 Task B 的 tags）在此追加一行 `export * from './api/tags'`。
// 仅 DownloadResult 从 client 对外暴露；request / downloadBlob 等内部辅助不对外暴露。

export type { DownloadResult } from './api/client';
export * from './api/auth';
export * from './api/spaces';
export * from './api/documents';
export * from './api/search';
export * from './api/terms';
export * from './api/imports';
export * from './api/exports';
export * from './api/docLinks';
