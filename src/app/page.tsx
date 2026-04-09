'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { Workspace, Conversation, Message, Plugin, AIModel } from '@/types';

const DEFAULT_PLUGINS: Plugin[] = [
  { id: 'web_search', name: '網頁搜尋', description: '即時網路搜尋', enabled: false, icon: '🌐' },
  { id: 'translation', name: '翻譯', description: '多語言翻譯', enabled: false, icon: '🌍' },
  { id: 'code_exec', name: '程式碼執行', description: '執行 Python / JS', enabled: false, icon: '💻' },
];

function generateDemoReply(model: AIModel, userMessage: string): string {
  const replies: Record<AIModel, string[]> = {
    'gpt-4o': [
      `GPT-4o 收到您的訊息：「${userMessage.slice(0, 30)}...」\n\n這是 GPT-4o 的回覆。作為 OpenAI 最強大的模型，我擅長創意寫作、複雜分析和多模態處理。`,
      `這是 GPT-4o 的回覆。\n\n我能理解上下文、生成創意內容、協助程式碼撰寫，以及處理各種複雜任務。`,
    ],
    'claude-3-5-sonnet': [
      `Claude 3.5 Sonnet 收到您的訊息：「${userMessage.slice(0, 30)}...」\n\n這是 Claude 3.5 的回覆。我擅長分析、推理，並提供深思熟慮的回答。`,
      `這是 Claude 3.5 Sonnet 的回覆。\n\n我專精於複雜推理、長上下文理解，以及精確的技術寫作。`,
    ],
    'gemini-1.5-pro': [
      `Gemini 1.5 Pro 收到您的訊息：「${userMessage.slice(0, 30)}...」\n\n這是 Gemini 1.5 的回覆。我具有超長上下文窗口，擅長處理大量資訊。`,
      `這是 Gemini 1.5 Pro 的回覆。\n\n我的上下文窗口可達 200 萬 tokens，適合處理長文件分析與複雜任務。`,
    ],
  };
  const pool = replies[model];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function HomePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [conversations, setConversations] = useState<Record<string, Conversation[]>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o');
  const [plugins, setPlugins] = useState<Plugin[]>(DEFAULT_PLUGINS);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedWs = localStorage.getItem('gs_workspaces');
      const savedConv = localStorage.getItem('gs_conversations');
      const savedPlugins = localStorage.getItem('gs_plugins');
      const savedMsgs = localStorage.getItem('gs_messages');
      const activeWs = localStorage.getItem('gs_active_ws');
      const activeConv = localStorage.getItem('gs_active_conv');
      const savedModel = localStorage.getItem('gs_model');

      if (savedWs) setWorkspaces(JSON.parse(savedWs));
      if (savedConv) setConversations(JSON.parse(savedConv));
      if (savedPlugins) setPlugins(JSON.parse(savedPlugins));
      if (savedMsgs) setMessages(JSON.parse(savedMsgs));
      if (activeWs) setActiveWorkspaceId(activeWs);
      if (activeConv) setActiveConversationId(activeConv);
      if (savedModel) setSelectedModel(savedModel as AIModel);
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('gs_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('gs_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('gs_plugins', JSON.stringify(plugins));
  }, [plugins]);

  useEffect(() => {
    if (activeWorkspaceId) localStorage.setItem('gs_active_ws', activeWorkspaceId);
    if (activeConversationId) localStorage.setItem('gs_active_conv', activeConversationId);
    localStorage.setItem('gs_model', selectedModel);
  }, [activeWorkspaceId, activeConversationId, selectedModel]);

  const activeConversation: Conversation = {
    id: activeConversationId || '',
    title: '新對話',
    workspaceId: activeWorkspaceId || '',
    messages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
  };

  const handleNewWorkspace = async () => {
    const name = prompt('輸入 Workspace 名稱：', '我的 Workspace');
    if (!name) return;
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userId: 'local_user' }),
    });
    const { workspace } = await res.json();
    setWorkspaces(prev => [...prev, workspace]);
    setConversations(prev => ({ ...prev, [workspace.id]: [] }));
    setActiveWorkspaceId(workspace.id);
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleNewConversation = async (workspaceId: string) => {
    const title = prompt('輸入對話標題：', '新對話');
    const res = await fetch('/api/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, title }),
    });
    const { conversation } = await res.json();
    setConversations(prev => ({
      ...prev,
      [workspaceId]: [...(prev[workspaceId] || []), conversation],
    }));
    setActiveWorkspaceId(workspaceId);
    setActiveConversationId(conversation.id);
    setMessages([]);
  };

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSelectConversation = (workspaceId: string, conversationId: string) => {
    setActiveWorkspaceId(workspaceId);
    setActiveConversationId(conversationId);
    const conv = conversations[workspaceId]?.find(c => c.id === conversationId);
    setMessages(conv?.messages || []);
  };

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => {
      const updated = [...prev, userMsg];
      localStorage.setItem('gs_messages', JSON.stringify(updated));
      return updated;
    });

    const enabledPlugins = plugins.filter(p => p.enabled).map(p => p.id);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], model: selectedModel, plugins: enabledPlugins }),
      });
      const data = await res.json();

      if (data.reply) {
        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply,
          model: selectedModel,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => {
          const updated = [...prev, aiMsg];
          localStorage.setItem('gs_messages', JSON.stringify(updated));
          return updated;
        });

        // Update conversation
        if (activeConversationId && activeWorkspaceId) {
          setConversations(prev => ({
            ...prev,
            [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map(c =>
              c.id === activeConversationId ? { ...c, messages: [...prev[activeWorkspaceId].find(x => x.id === activeConversationId)?.messages || [], userMsg, aiMsg], updatedAt: new Date().toISOString() } : c
            ),
          }));
        }
      }
    } catch {
      // Demo mode fallback
      const reply = generateDemoReply(selectedModel, content);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        model: selectedModel,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => {
        const updated = [...prev, aiMsg];
        localStorage.setItem('gs_messages', JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, selectedModel, plugins, activeConversationId, activeWorkspaceId]);

  const handleTogglePlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(p => p.id === pluginId ? { ...p, enabled: !p.enabled } : p));
  };

  const handleDeleteConversation = async (workspaceId: string, conversationId: string) => {
    setConversations(prev => ({
      ...prev,
      [workspaceId]: (prev[workspaceId] || []).filter(c => c.id !== conversationId),
    }));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (!confirm('刪除 Workspace 會連帶刪除所有對話？')) return;
    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    setConversations(prev => {
      const copy = { ...prev };
      delete copy[workspaceId];
      return copy;
    });
    if (activeWorkspaceId === workspaceId) {
      setActiveWorkspaceId(null);
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleSwitchModel = async (messageId: string, model: AIModel) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const enabledPlugins = plugins.filter(p => p.enabled).map(p => p.id);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.filter(m => m.id !== messageId).concat([msg]), model, plugins: enabledPlugins }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: data.reply, model } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: generateDemoReply(model, m.content), model } : m));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('檔案超過 50MB 限制');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      let content = '';
      if (data.type?.startsWith('image/')) {
        content = `[圖片: ${file.name}] 已上傳，請描述這張圖片`;
      } else if (data.type === 'application/pdf') {
        content = `[PDF: ${file.name}] 已上傳，請分析這個 PDF 的內容`;
      } else if (data.content) {
        content = `[檔案: ${file.name}]\n${data.content.slice(0, 500)}`;
      }

      await handleSend(content);
    } catch {
      await handleSend(`[檔案上傳失敗: ${file.name}]`);
    }
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspaces={workspaces}
        conversations={conversations}
        activeWorkspaceId={activeWorkspaceId}
        activeConversationId={activeConversationId}
        plugins={plugins}
        onSelectWorkspace={handleSelectWorkspace}
        onSelectConversation={handleSelectConversation}
        onNewWorkspace={handleNewWorkspace}
        onNewConversation={handleNewConversation}
        onTogglePlugin={handleTogglePlugin}
        onDeleteConversation={handleDeleteConversation}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {activeWorkspaceId ? (
          <>
            <ChatPanel
              conversation={activeConversation}
              messages={messages}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onSend={handleSend}
              onSwitchModel={handleSwitchModel}
            />

            {/* File upload button */}
            <div className="fixed bottom-20 right-6 z-10">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.md,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-lg cursor-pointer transition-all hover:scale-105 ${isLoading ? 'animate-pulse' : ''}`}
                title="上傳檔案 (PDF, 圖片, CSV, Markdown)"
              >
                📎
              </label>
            </div>

            {/* Model suggestion badge */}
            {selectedModel === 'gpt-4o' && (
              <div className="fixed top-4 right-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                💡 建議：翻譯/創意寫作 → GPT-4o | 分析/推理 → Claude 3.5 | 長文本 → Gemini 1.5
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-2xl font-bold mb-3">Genspark 全能 AI Workspace</h2>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md">
                多模型 AI 助手 × 檔案處理 × 團隊協作<br/>
                在左側建立 Workspace 開始使用
              </p>
              <button
                onClick={handleNewWorkspace}
                className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg font-medium transition-colors"
              >
                建立第一個 Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
