import type { ImportBatchItem } from '../../api';

/**
 * 成功项最多渲染条数。失败 / 跳过项是用户需要处理的对象，始终全量渲染；仅对成功项截断，
 * 避免 1000+ 条 DOM 拖慢弹窗，同时不把失败项淹没在成功项之后。
 */
const IMPORT_DONE_PREVIEW = 50;

type ImportResultsListProps = {
  items: ImportBatchItem[];
};

/**
 * 导入结果列表（成功 / 失败 / 跳过，成功项截断预览）。
 * E4 Slice D 从 ImportFeature 抽出为组件。
 */
export function ImportResultsList({ items }: ImportResultsListProps) {
  if (items.length === 0) {
    return null;
  }

  const failedOrSkipped = items.filter((item) => item.status !== 'done');
  const doneItems = items.filter((item) => item.status === 'done');
  const shownDone = doneItems.slice(0, IMPORT_DONE_PREVIEW);
  const hiddenDone = doneItems.length - shownDone.length;

  return (
    <ul className="import-result-list">
      {failedOrSkipped.map((item) => (
        <li
          key={`${item.status}:${item.relative_path}:${item.parsed_doc_id ?? item.error ?? ''}`}
          className={`import-result-${item.status}`}
        >
          <strong>{item.title}</strong>
          <span>{item.status === 'skipped' ? '跳过' : '失败'} · {item.error ?? '未知原因'}</span>
        </li>
      ))}
      {shownDone.map((item) => (
        <li
          key={`${item.status}:${item.relative_path}:${item.parsed_doc_id ?? ''}`}
          className="import-result-done"
        >
          <strong>{item.title}</strong>
          <span>成功 · {item.chunk_count} chunks</span>
        </li>
      ))}
      {hiddenDone > 0 ? (
        <li className="import-result-done">还有 {hiddenDone} 个成功未展示（详见汇总数字）</li>
      ) : null}
    </ul>
  );
}
