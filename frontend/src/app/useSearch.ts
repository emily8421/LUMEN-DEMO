import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SearchResponse } from '../api';
import { searchDocuments } from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseSearchArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

/**
 * REQ-007 全文 / 语义搜索 state + handler。
 *
 * 抽成独立 hook，给 App() 减压（APP-SIZE-C-011）。写操作经 App 注入的 runAction 包装，
 * 错误处理（含登录失效）与全局 isBusy / notice 一致。暴露 setSearchResult 供空间切换 /
 * 导入等场景重置结果。
 */
export function useSearch({ token, runAction, setNotice }: UseSearchArgs) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    void runAction('正在搜索当前空间...', async () => {
      const result = await searchDocuments(token, searchQuery.trim());
      setSearchResult(result);
      setNotice(`搜索完成：${result.total} 条结果。`);
    });
  };

  return { searchQuery, setSearchQuery, searchResult, setSearchResult, handleSearch };
}
