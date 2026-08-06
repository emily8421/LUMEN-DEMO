/** 本地挂载分区高度 localStorage 持久化（上下拖拽调高，仿 pane-width-store）。 */

export const LOCAL_MOUNT_HEIGHT_STORAGE_KEY = 'lumen-demo-local-mount-height';
export const DEFAULT_LOCAL_MOUNT_HEIGHT = 300;
const MIN_LOCAL_MOUNT_HEIGHT = 120;
const MAX_LOCAL_MOUNT_HEIGHT = 760;

export function clampLocalMountHeight(height: number): number {
  if (!Number.isFinite(height)) {
    return DEFAULT_LOCAL_MOUNT_HEIGHT;
  }
  return Math.min(MAX_LOCAL_MOUNT_HEIGHT, Math.max(MIN_LOCAL_MOUNT_HEIGHT, height));
}

export function loadLocalMountHeight(): number {
  try {
    const raw = window.localStorage.getItem(LOCAL_MOUNT_HEIGHT_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_LOCAL_MOUNT_HEIGHT;
    }
    return clampLocalMountHeight(Number(JSON.parse(raw)));
  } catch {
    return DEFAULT_LOCAL_MOUNT_HEIGHT;
  }
}

export function persistLocalMountHeight(height: number): void {
  try {
    window.localStorage.setItem(
      LOCAL_MOUNT_HEIGHT_STORAGE_KEY,
      JSON.stringify(clampLocalMountHeight(height))
    );
  } catch {
    // localStorage 不可用（如隐私模式）时静默降级，高度仅存内存
  }
}
