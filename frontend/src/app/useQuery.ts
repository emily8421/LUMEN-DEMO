import { useState } from 'react';
import type { FormEvent } from 'react';
import type { QueryResponse } from '../api';
import { queryKnowledgeBase } from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseQueryArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

/**
 * REQ-008 RAG 问答 state + handler。
 *
 * 抽成独立 hook，给 App() 减压（APP-SIZE-C-011）。写操作经 App 注入的 runAction 包装，
 * 错误处理（含登录失效）与全局 isBusy / notice 一致。暴露 setQueryResult 供空间切换 /
 * 导入等场景重置结果。
 */
export function useQuery({ token, runAction, setNotice }: UseQueryArgs) {
  const [question, setQuestion] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);

  const handleQuery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    void runAction('正在问答当前空间...', async () => {
      const result = await queryKnowledgeBase(token, question.trim());
      setQueryResult(result);
      setNotice(`问答完成：${result.sources.length} 个来源。`);
    });
  };

  return { question, setQuestion, queryResult, setQueryResult, handleQuery };
}
