'use client';

import { useState } from 'react';
import { Conversation, Workspace, Plugin } from '@/types';

interface SidebarProps {
  workspaces: Workspace[];
  conversations: Record<string, Conversation[]>;
  activeWorkspaceId: string | null;
  activeConversationId: string | null;
  plugins: Plugin[];
  onSelectWorkspace: (id: string) => void;
  onSelectConversation: (workspaceId: string, conversationId: string) => void;
  onNewWorkspace: () => void;
  onNewConversation: (workspaceId: string) => void;
  onTogglePlugin: (pluginId: string) => void;
  onDeleteConversation: (workspaceId: string, conversationId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
}

export function Sidebar({
  workspaces,
  conversations,
  activeWorkspaceId,
  activeConversationId,
  plugins,
  onSelectWorkspace,
  onSelectConversation,
  onNewWorkspace,
  onNewConversation,
  onTogglePlugin,
  onDeleteConversation,
  onDeleteWorkspace,
}: SidebarProps) {
  const [expandedWs, setExpandedWs] = useState<string | null>(activeWorkspaceId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlugins, setShowPlugins] = useState(false);

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 h-full bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚡</span>
          <h1 className="font-bold text-lg">Genspark</h1>
        </div>
        <input
          type="text"
          placeholder="搜尋 Workspace..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Actions */}
      <div className="p-2 flex gap-2 border-b border-[var(--border)]">
        <button
          onClick={onNewWorkspace}
          className="flex-1 text-xs py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          + 新建 Workspace
        </button>
        <button
          onClick={() => setShowPlugins(!showPlugins)}
          className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
        >
          🔌
        </button>
      </div>

      {/* Plugins panel */}
      {showPlugins && (
        <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">外掛系統</p>
          {plugins.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm">{p.icon}</span>
                <span className="text-xs ml-1">{p.name}</span>
              </div>
              <button
                onClick={() => onTogglePlugin(p.id)}
                className={`w-8 h-4 rounded-full transition-colors ${
                  p.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  p.enabled ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto scrollbar">
        {filteredWorkspaces.map(ws => {
          const isExpanded = expandedWs === ws.id;
          const wsConversations = conversations[ws.id] || [];
          return (
            <div key={ws.id} className="border-b border-[var(--border)]">
              <div
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors ${
                  activeWorkspaceId === ws.id ? 'bg-[var(--bg-tertiary)]' : ''
                }`}
              >
                <button
                  onClick={() => setExpandedWs(isExpanded ? null : ws.id)}
                  className="text-xs text-[var(--text-secondary)]"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
                <div
                  className="flex-1 min-w-0"
                  onClick={() => { onSelectWorkspace(ws.id); setExpandedWs(ws.id); }}
                >
                  <p className="text-sm font-medium truncate">{ws.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {wsConversations.length} 對話
                    {ws.members.length > 1 && ` · ${ws.members.length} 人`}
                  </p>
                </div>
                <button
                  onClick={() => onNewConversation(ws.id)}
                  className="text-xs text-[var(--accent)] hover:text-[var(--accent-light)]"
                  title="新對話"
                >
                  +
                </button>
                <button
                  onClick={() => onDeleteWorkspace(ws.id)}
                  className="text-xs text-[var(--error)] hover:opacity-70"
                  title="刪除 Workspace"
                >
                  ✕
                </button>
              </div>

              {isExpanded && wsConversations.length > 0 && (
                <div className="ml-6">
                  {wsConversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg text-xs hover:bg-[var(--bg-tertiary)] transition-colors ${
                        activeConversationId === conv.id ? 'bg-[var(--bg-tertiary)] text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                      }`}
                      onClick={() => onSelectConversation(ws.id, conv.id)}
                    >
                      <span className="truncate flex-1">{conv.title || '新對話'}</span>
                      {conv.pinned && <span title="已釘選">📌</span>}
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteConversation(ws.id, conv.id); }}
                        className="opacity-0 group-hover:opacity-100 hover:text-[var(--error)]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredWorkspaces.length === 0 && (
          <div className="p-6 text-center text-[var(--text-secondary)] text-sm">
            {searchQuery ? '找不到符合的 Workspace' : '尚無 Workspace，點擊上方建立'}
          </div>
        )}
      </div>
    </div>
  );
}
