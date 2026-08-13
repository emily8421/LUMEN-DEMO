// CQ-P1-008 App 减压：悬浮覆盖层（命令面板 + AI 助手抽屉，原 App.tsx overlay shell 段）。
import { CommandPalette } from '../features/CommandPalette';
import { AiAssistant } from '../features/AiAssistant';
import type { useCommandPalette } from './useCommandPalette';
import type { useAiAssistant } from './useAiAssistant';
import type { useDocuments } from './useDocuments';

interface OverlayShellProps {
  sessionActive: boolean;
  palette: ReturnType<typeof useCommandPalette>;
  aiAssistant: ReturnType<typeof useAiAssistant>;
  handleOpenDocument: ReturnType<typeof useDocuments>['handleOpenDocument'];
}

export function OverlayShell({ sessionActive, palette, aiAssistant, handleOpenDocument }: OverlayShellProps) {
  return (
    <>
      {sessionActive ? (
        <CommandPalette
          isOpen={palette.isOpen}
          query={palette.query}
          searching={palette.searching}
          items={palette.items}
          activeIndex={palette.activeIndex}
          onQueryChange={palette.setQuery}
          onActiveIndexChange={palette.setActiveIndex}
          onKeyDown={palette.onKeyDown}
          onExecute={palette.execute}
          onClose={palette.close}
        />
      ) : null}

      {sessionActive ? (
        <AiAssistant
          isOpen={aiAssistant.isOpen}
          messages={aiAssistant.messages}
          draft={aiAssistant.draft}
          sending={aiAssistant.sending}
          useKnowledgeBase={aiAssistant.useKnowledgeBase}
          llmConfigs={aiAssistant.llmConfigs}
          llmProvider={aiAssistant.llmProvider}
          onLlmProviderChange={aiAssistant.setLlmProvider}
          onOpen={() => aiAssistant.open()}
          onClose={aiAssistant.close}
          onDraftChange={aiAssistant.setDraft}
          onToggleKnowledgeBase={aiAssistant.toggleKnowledgeBase}
          onSend={() => void aiAssistant.handleSend()}
          onOpenDocument={handleOpenDocument}
        />
      ) : null}
    </>
  );
}
