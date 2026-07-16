// Shared HTTP infrastructure for all per-domain API modules.
// 内部辅助（request / downloadBlob / 错误处理）+ 共享类型（DownloadResult）。
// 仅 DownloadResult 通过 barrel 对外暴露；request / downloadBlob 供域模块 import，不对外。

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

type ApiEnvelope<T> = {
  code: number;
  msg: string;
  data: T;
};

export type RequestOptions = Omit<RequestInit, 'headers'> & {
  token?: string;
};

export type DownloadResult = {
  blob: Blob;
  filename: string;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || envelope.code !== 0) {
    throw new Error(envelope.msg || `Request failed with status ${response.status}`);
  }

  return envelope.data;
}

export async function downloadBlob(path: string, token: string, fallbackFilename: string): Promise<DownloadResult> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const blob = await response.blob();
  const filename = parseContentDispositionFilename(response.headers.get('content-disposition')) ?? fallbackFilename;
  return { blob, filename };
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const envelope = (await response.json()) as ApiEnvelope<unknown>;
    if (envelope?.msg) {
      return envelope.msg;
    }
  } catch {
    // 非 JSON 错误体，回退到 HTTP 状态码
  }
  return `请求失败（${response.status}）`;
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = header.match(/filename="?([^";]+)"?/);
  return match ? match[1] : null;
}
