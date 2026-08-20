import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { TimelineResponse } from '../api';
import { getTimeline } from '../api';
import { createResponseOwnership } from './response-ownership';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseTimelineArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

export function useTimeline({ token, currentSpaceId, runAction, setNotice }: UseTimelineArgs) {
  const [timelineQuery, setTimelineQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [timelineResult, setTimelineResult] = useState<TimelineResponse | null>(null);
  const responseOwnership = useRef(createResponseOwnership());
  const scope = JSON.stringify([token ?? null, currentSpaceId ?? null]);
  responseOwnership.current.setScope(scope);

  useEffect(() => {
    setTimelineResult(null);
    setSelectedTagIds([]);
    setTimelineQuery('');
  }, [token, currentSpaceId]);

  const toggleTimelineTag = (tagId: number) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((currentId) => currentId !== tagId) : [...current, tagId],
    );
  };

  const clearTimelineFilters = () => {
    setTimelineQuery('');
    setSelectedTagIds([]);
    setTimelineResult(null);
  };

  const handleLoadTimeline = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!token || currentSpaceId == null) {
      return;
    }
    const query = timelineQuery.trim();
    if (!responseOwnership.current.isCurrentScope(scope)) {
      return;
    }
    const ticket = responseOwnership.current.begin();
    void runAction('正在生成主题时间线...', async () => {
      const result = await getTimeline(token, currentSpaceId, {
        q: query || undefined,
        tagIds: selectedTagIds,
        density: true,
      });
      if (responseOwnership.current.owns(ticket)) {
        setTimelineResult(result);
        setNotice(result.items.length === 0 ? '时间线暂无事件。' : '已生成主题时间线。');
      }
    });
  };

  return {
    timelineQuery,
    setTimelineQuery,
    selectedTagIds,
    timelineResult,
    toggleTimelineTag,
    clearTimelineFilters,
    handleLoadTimeline,
  };
}
