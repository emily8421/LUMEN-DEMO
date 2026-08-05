import type { FormEvent } from 'react';
import type { TimelineEventType, TimelineResponse, TagView } from '../api';
import { permissionLabels } from '../app/constants';

type TimelineFeatureProps = {
  isBusy: boolean;
  timelineQuery: string;
  selectedTagIds: number[];
  timelineResult: TimelineResponse | null;
  tags: TagView[];
  onTimelineQueryChange: (value: string) => void;
  onToggleTag: (tagId: number) => void;
  onClearFilters: () => void;
  onLoadTimeline: (event?: FormEvent<HTMLFormElement>) => void;
  onOpenDocument: (documentId: number, title: string) => void;
};

const eventLabels: Record<TimelineEventType, string> = {
  created: '创建',
  updated: '更新',
  tagged: '打标',
  linked: '内链',
};

export function TimelineFeature({
  isBusy,
  timelineQuery,
  selectedTagIds,
  timelineResult,
  tags,
  onTimelineQueryChange,
  onToggleTag,
  onClearFilters,
  onLoadTimeline,
  onOpenDocument,
}: TimelineFeatureProps) {
  return (
    <section className="timeline-panel focus-panel task-workspace">
      <div className="workspace-toolbar timeline-toolbar">
        <div className="view-title">
          <h2>时间线</h2>
        </div>
        <div className="timeline-toolbar-actions">
          {timelineResult?.degraded ? <span className="badge warning">已聚合</span> : null}
          <button type="button" className="secondary" onClick={onClearFilters} disabled={isBusy}>
            清空
          </button>
        </div>
      </div>

      <form className="timeline-query-row" onSubmit={onLoadTimeline}>
        <label>
          关键词
          <input
            value={timelineQuery}
            onChange={(event) => onTimelineQueryChange(event.target.value)}
            placeholder="输入项目、问题或主题词"
          />
        </label>
        <button type="submit" disabled={isBusy}>
          生成
        </button>
      </form>

      <div className="timeline-tag-strip" aria-label="按标签过滤时间线">
        {tags.length === 0 ? (
          <span className="timeline-muted">暂无标签</span>
        ) : (
          tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={selectedTagIds.includes(tag.id) ? 'timeline-tag active' : 'timeline-tag'}
              onClick={() => onToggleTag(tag.id)}
              disabled={isBusy}
            >
              {tag.name}
            </button>
          ))
        )}
      </div>

      {timelineResult ? <TimelineDensity result={timelineResult} /> : null}

      {!timelineResult ? (
        <p className="empty-state task-empty">输入关键词或选择标签后生成时间线。</p>
      ) : timelineResult.items.length === 0 ? (
        <p className="empty-state task-empty">
          {timelineQuery.trim() ? `未找到含「${timelineQuery.trim()}」的可见文档事件。` : '当前空间暂无可见事件。'}
        </p>
      ) : (
        <ol className="timeline-event-list">
          {timelineResult.items.map((item, index) => (
            <li key={`${item.date}-${item.document_id}-${item.event_type}-${index}`} className="timeline-event-item">
              <time dateTime={item.date}>{formatDate(item.date)}</time>
              <button type="button" onClick={() => onOpenDocument(item.document_id, item.title)}>
                <strong>{item.title}</strong>
                <span>{eventLabels[item.event_type]}</span>
              </button>
              <small>
                {permissionLabels[item.permission]} · {item.actor == null ? '操作者未知' : `user #${item.actor}`}
              </small>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TimelineDensity({ result }: { result: TimelineResponse }) {
  if (result.density.length === 0) {
    return null;
  }
  return (
    <div className="timeline-density" aria-label="时间线密度热条">
      <div className="timeline-density-meta">
        <strong>密度</strong>
        <span>{result.window === 'week' ? '按周' : '按日'}</span>
      </div>
      <div className="timeline-density-track">
        {result.density.map((item) => (
          <span
            key={`${item.window_start}-${item.window_end}`}
            className={`timeline-density-cell level-${item.level}`}
            title={`${formatDate(item.window_start)}：${item.event_count} 个事件，平均 ${formatRatio(item.ratio)}`}
          />
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRatio(value: number): string {
  if (value <= 0) {
    return '0 倍';
  }
  return `${value.toFixed(1)} 倍`;
}
