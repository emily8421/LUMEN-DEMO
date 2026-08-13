import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-1）──
// SearchResult / SearchResponse / LlmConfigMeta：与生成类型零差异（无 union），直接 alias（命名错位 Result↔ResultView / Response↔PageView / Meta↔View）。
export type SearchResult = components['schemas']['SearchResultView'];
export type SearchResponse = components['schemas']['SearchPageView'];
export type LlmConfigMeta = components['schemas']['LlmConfigView'];

/** RagSource —— 主体 alias 生成 RagSourceView；source_type narrow 为 'document'|'term'（手写 optional，生成 required string）。 */
export type RagSource = Omit<components['schemas']['RagSourceView'], 'source_type'> & {
  source_type?: 'document' | 'term';
};

/** QueryResponse —— alias 生成 QueryAnswerView + sources narrow 为 RagSource[]。 */
export type QueryResponse = Omit<components['schemas']['QueryAnswerView'], 'sources'> & {
  sources: RagSource[];
};

// QueryTurn（前端组装对话历史，role union）+ QueryKnowledgeBaseOptions（前端专属请求选项）手写保留。
export type QueryTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type QueryKnowledgeBaseOptions = {
  /** 批3 AI 抽屉多轮对话（路径 A）：前端维护的对话历史，后端拼进 LLM prompt。 */
  history?: QueryTurn[];
  /** 批3「基于知识库」开关：true=RAG 检索增强问答（默认）；false=通用对话（不检索）。 */
  useKnowledgeBase?: boolean;
  /** 多通道切换（2026-08-08）：命名 LLM 配置名（LLM_PROVIDERS 列表项），空 = 后端默认。 */
  llmProvider?: string;
};

export async function searchDocuments(token: string, query: string): Promise<SearchResponse> {
  return request<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`, { token });
}

export async function queryKnowledgeBase(
  token: string,
  question: string,
  options: QueryKnowledgeBaseOptions = {},
): Promise<QueryResponse> {
  return request<QueryResponse>('/api/query', {
    method: 'POST',
    token,
    body: JSON.stringify({
      question,
      history: options.history ?? [],
      use_knowledge_base: options.useKnowledgeBase ?? true,
      llm_provider: options.llmProvider ?? '',
    }),
  });
}

/** 多通道切换：可用 LLM 配置元信息（脱敏，不含 api_key），供 AI 抽屉下拉选择。 */
export async function getLlmConfigs(token: string): Promise<LlmConfigMeta[]> {
  return request<LlmConfigMeta[]>('/api/llm-configs', { token });
}
