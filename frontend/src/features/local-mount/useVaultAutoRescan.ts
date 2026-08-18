// 本地挂载自动重扫 hook（REQ-018 模式 B 增强 / Wave 3，TC-P2-VAULT-003，RG-010 Go）。
//
// FileSystemObserver（Chromium 系，Edge 139+ 默认可用）观察挂载目录；变更事件只当
// 信号——防抖 RESCAN_DEBOUNCE_MS 合并后调既有 vm.reindex 全量重扫（walk + 读内容 +
// 重建索引复用已验证路径，1000+ 文件 PoC 性能已测），不做增量 diff（demo 级 YAGNI）。
//
// 边界（RG-010 评估报告 N1-N3）：
//   - 观察期随页面会话存活，刷新 / 关闭后丢失——与单会话挂载模型一致，手动重扫兜底；
//   - needs-auth 挂载不观察（observe 可能因权限抛错，静默跳过）；
//   - 无 FileSystemObserver（Firefox / Safari）→ 不自动，手动重扫兜底不变，不报错。
//
// 仅本地，不上传服务端（红线不变）。

import { useEffect, useRef } from 'react';
import type { UseLocalVaultMount } from '../../app/useLocalVaultMount';

/** 变更信号合并窗口：连续保存 / 批量增删只触发一次全量重扫。 */
const RESCAN_DEBOUNCE_MS = 1500;

/** TS 最小接口声明：FileSystemObserver 尚未进 lib.dom（仿 local-vault-walk 对 values() 的处理）。 */
interface ObserverChangeRecord {
  rootName?: string;
  changedHandle: FileSystemHandle;
  type: string; // 'appeared' | 'disappeared' | 'modified' 等（只当信号，不细分）
}
interface FileSystemObserverLike {
  observe(handle: FileSystemHandle, options?: { recursive?: boolean }): Promise<void>;
  disconnect(): void;
}
type FileSystemObserverCtor = new (callback: (records: ObserverChangeRecord[]) => void) => FileSystemObserverLike;

function getObserverCtor(): FileSystemObserverCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { FileSystemObserver?: FileSystemObserverCtor };
  return typeof w.FileSystemObserver === 'function' ? w.FileSystemObserver : null;
}

/** 浏览器是否支持自动监听（UI 可据此显隐提示；不支持时静默降级）。 */
export function isVaultAutoRescanSupported(): boolean {
  return getObserverCtor() !== null;
}

export function useVaultAutoRescan(vm: UseLocalVaultMount): { supported: boolean } {
  const reindexRef = useRef(vm.reindex);
  reindexRef.current = vm.reindex;
  const timersRef = useRef<Map<string, number>>(new Map());
  const observersRef = useRef<Map<string, FileSystemObserverLike>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    const observers = observersRef.current;
    const Ctor = getObserverCtor();

    const scheduleRescan = (mountId: string) => {
      const existing = timers.get(mountId);
      if (existing) window.clearTimeout(existing);
      timers.set(
        mountId,
        window.setTimeout(() => {
          timers.delete(mountId);
          void reindexRef.current(mountId).catch((error: unknown) => {
            console.warn('[vault-auto-rescan] 自动重扫失败（手动重扫兜底可用）', error);
          });
        }, RESCAN_DEBOUNCE_MS),
      );
    };

    if (Ctor) {
      for (const mount of vm.mounts) {
        if (mount.status !== 'mounted' || observers.has(mount.id)) continue;
        try {
          const observer = new Ctor(() => scheduleRescan(mount.id));
          void observer.observe(mount.handle, { recursive: true }).catch((error: unknown) => {
            // observe 异步失败（权限 / 句柄失效）→ 断开并降级，不阻塞挂载功能
            console.warn('[vault-auto-rescan] observe 失败，降级为手动重扫', error);
            observer.disconnect();
            observers.delete(mount.id);
          });
          observers.set(mount.id, observer);
        } catch (error) {
          console.warn('[vault-auto-rescan] observer 构造失败，降级为手动重扫', error);
        }
      }
    }

    // 已卸载的挂载：断开 observer + 取消未触发重扫
    const alive = new Set(vm.mounts.map((m) => m.id));
    for (const [mountId, observer] of observers) {
      if (!alive.has(mountId)) {
        observer.disconnect();
        observers.delete(mountId);
      }
    }
    for (const mountId of timers.keys()) {
      if (!alive.has(mountId)) {
        const timer = timers.get(mountId);
        if (timer) window.clearTimeout(timer);
        timers.delete(mountId);
      }
    }

    return () => {
      // 会话卸载（unmount 组件 / 刷新）：全部断开 + 清定时器
      for (const observer of observers.values()) observer.disconnect();
      observers.clear();
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
    };
    // deps：仅响应 mounts 集合变化（挂载/卸载/状态迁移）；reindex 经 ref 取最新，
    // 避免每次渲染重连 observer。
  }, [vm.mounts]);

  return { supported: isVaultAutoRescanSupported() };
}
