export type AIModel = 'gpt-4o' | 'claude-3-5-sonnet' | 'gemini-1.5-pro';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: AIModel;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  workspaceId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  content?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export type UI_LANGUAGE = 'zh-TW' | 'zh-CN' | 'en';
