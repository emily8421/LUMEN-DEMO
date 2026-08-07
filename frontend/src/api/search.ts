import { request } from './client';

export type SearchResult = {
  doc_id: number;
  title: string;
  snippet: string;
  chunk_id: number;
  ordinal: number;
};

export type SearchResponse = {
  items: SearchResult[];
  total: number;
  page: number;
};

export type RagSource = {
  doc_id: number | null;
  title: string;
  snippet: string;
  source_type?: 'document' | 'term';
};

export type QueryResponse = {
  answer: string;
  sources: RagSource[];
};

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

export type LlmConfigMeta = {
  name: string;
  provider: string;
  model: string;
  base_url: string;
  enabled: boolean;
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
