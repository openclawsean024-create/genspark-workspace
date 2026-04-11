'use client';

import React, { useState } from 'react';

interface DebugPanelProps {
  isOpen?: boolean;
  state?: {
    workspaces: number;
    conversations: number;
    messages: number;
    activeWorkspace: string | null;
    activeConversation: string | null;
    model: string;
    plugins: string[];
  };
}

export function DebugPanel({ isOpen: controlledOpen, state }: DebugPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  const toggle = () => setInternalOpen(prev => !prev);

  return (
    <>
      <button
        onClick={toggle}
        className="fixed bottom-6 left-6 z-50 w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-sm shadow-lg hover:border-[var(--accent)] transition-colors"
        title="Debug Panel"
      >
        🐛
      </button>

      {isOpen && (
        <div className="fixed bottom-20 left-6 z-50 w-80 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">🐛 Debug Panel</h3>
            <button
              onClick={toggle}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xs"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs font-mono">
            {state ? (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Workspaces</span>
                  <span className="text-[var(--text-primary)]">{state.workspaces}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Conversations</span>
                  <span className="text-[var(--text-primary)]">{state.conversations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Messages</span>
                  <span className="text-[var(--text-primary)]">{state.messages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Active WS</span>
                  <span className="text-[var(--text-primary)] truncate ml-2">{state.activeWorkspace || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Active Conv</span>
                  <span className="text-[var(--text-primary)] truncate ml-2">{state.activeConversation || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Model</span>
                  <span className="text-[var(--text-primary)]">{state.model}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Plugins</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {state.plugins.length === 0 ? (
                      <span className="text-[var(--text-secondary)]">-</span>
                    ) : (
                      state.plugins.map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-[var(--accent)] text-white rounded text-xs">{p}</span>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-[var(--text-secondary)] py-4">
                Pass <code>state</code> prop to see runtime data
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border)]">
              <div className="text-[var(--text-secondary)] mb-1">Environment</div>
              <div className="flex justify-between">
                <span>Platform</span>
                <span>{typeof window !== 'undefined' ? window.location.hostname : 'server'}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage</span>
                <span>{typeof window !== 'undefined' && 'storage' in navigator ? 'Available' : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
