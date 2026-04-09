'use client';

import { useState } from 'react';
import { Message, AIModel, Conversation } from '@/types';

const MODEL_LABELS: Record<AIModel, string> = {
  'gpt-4o': 'GPT-4o',
  'claude-3-5-sonnet': 'Claude 3.5',
  'gemini-1.5-pro': 'Gemini 1.5',
};

const MODEL_COLORS: Record<AIModel, string> = {
  'gpt-4o': 'model-badge-gpt',
  'claude-3-5-sonnet': 'model-badge-claude',
  'gemini-1.5-pro': 'model-badge-gemini',
};

interface ChatMessageProps {
  message: Message;
  onSwitchModel?: (model: AIModel) => void;
}

function ChatMessage({ message, onSwitchModel }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3 py-4 border-b border-[var(--border)] last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        message.role === 'user' ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
      }`}>
        {message.role === 'user' ? 'U' : 'AI'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {message.role === 'assistant' && message.model && (
            <button
              onClick={() => onSwitchModel?.(message.model!)}
              className={`text-xs px-2 py-0.5 rounded-full text-white ${MODEL_COLORS[message.model]} hover:opacity-80 transition-opacity`}
            >
              {MODEL_LABELS[message.model]}
            </button>
          )}
          <span className="text-xs text-[var(--text-secondary)]">
            {new Date(message.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.role === 'assistant' && (
            <button
              onClick={handleCopy}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-auto"
            >
              {copied ? '✓ 複製' : '複製'}
            </button>
          )}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

interface ModelSelectorProps {
  selected: AIModel;
  onChange: (model: AIModel) => void;
}

export function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  const models: AIModel[] = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'];
  return (
    <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
      {models.map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`text-xs px-3 py-1.5 rounded-md transition-all ${
            selected === m
              ? `bg-[var(--accent)] text-white shadow`
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {MODEL_LABELS[m]}
        </button>
      ))}
    </div>
  );
}

interface ChatPanelProps {
  conversation: Conversation;
  messages: Message[];
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onSend: (content: string) => void;
  onSwitchModel?: (messageId: string, model: AIModel) => void;
}

export function ChatPanel({
  conversation,
  messages,
  selectedModel,
  onModelChange,
  onSend,
  onSwitchModel,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // messages scroll handled via CSS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setInput('');
    setIsLoading(true);
    await onSend(input.trim());
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">{conversation.title || '新對話'}</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {conversation.createdAt ? new Date(conversation.createdAt).toLocaleDateString('zh-TW') : ''}
          </p>
        </div>
        <ModelSelector selected={selectedModel} onChange={onModelChange} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">開始新對話</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">
              選擇上方模型，輸入訊息開始與 AI 對話。支援 GPT-4o、Claude 3.5、Gemini 1.5。
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSwitchModel={(model) => onSwitchModel?.(msg.id, model)}
            />
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-[var(--text-secondary)]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="text-sm">思考中...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="輸入訊息... (Shift+Enter 換行)"
            className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            送出
          </button>
        </div>
      </form>
    </div>
  );
}
