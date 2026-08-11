// Shared HTTP infrastructure for all per-domain API modules.
// 内部辅助（request / downloadBlob / 错误处理）+ 共享类型（DownloadResult / ApiError）。
// 仅 DownloadResult 通过 barrel 对外暴露；request / downloadBlob / ApiError 供域模块 import，不对外。

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

/**
 * 后端 envelope 错误的客户端镜像（CQ-P1-005 Slice C）。
 *
 * 后端错误响应 envelope `{code, msg, data}` 中 `code` 是业务码（如 4001 未登录），
 * 旧实现 `throw new Error(envelope.msg)` 把 code 丢失，导致下游只能靠 msg 文案
 * 判定（如 auth 失效正则）。ApiError 保留 code，下游用 `error.code` 判定而非文案。
 * 继承 Error 保留 `.message`（= envelope.msg），现有 catch / setError 逻辑零改动。
 */
export class ApiError extends Error {
  readonly code: number;
  readonly status: number;

  constructor(code: number, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

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
    throw new ApiError(
      envelope.code,
      envelope.msg || `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return envelope.data;
}

export async function downloadBlob(path: string, token: string, fallbackFilename: string): Promise<DownloadResult> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw await buildApiError(response);
  }

  const blob = await response.blob();
  const filename = parseContentDispositionFilename(response.headers.get('content-disposition')) ?? fallbackFilename;
  return { blob, filename };
}

async function buildApiError(response: Response): Promise<ApiError> {
  // 优先解析 envelope {code, msg}；非 JSON 错误体回退 code=0 + HTTP 状态描述。
  try {
    const envelope = (await response.json()) as ApiEnvelope<unknown>;
    if (envelope && typeof envelope.code === 'number') {
      return new ApiError(envelope.code, envelope.msg || `请求失败（${response.status}）`, response.status);
    }
  } catch {
    // 非 JSON 错误体，回退到 HTTP 状态码
  }
  return new ApiError(0, `请求失败（${response.status}）`, response.status);
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }
  const match = header.match(/filename="?([^";]+)"?/);
  return match ? match[1] : null;
}
