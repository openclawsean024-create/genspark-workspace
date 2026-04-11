/**
 * Genspark Workspace — UI State Machine (Spec v1.1)
 *
 * Defines all UI states, events, and transitions for the workspace application.
 * Follows XState-like statechart patterns adapted for React.
 */

// ─── Core UI States ───────────────────────────────────────────────────────────

export type AppScreen =
  | 'EMPTY'           // No workspace selected
  | 'WORKSPACE_LIST'  // Workspace selected, no conversation
  | 'CONVERSATION'    // Active conversation
  | 'LOADING'         // Transitional loading state
  | 'ERROR';          // Error state

export type SendState =
  | 'IDLE'
  | 'SENDING'
  | 'RECEIVING'
  | 'STREAMING'
  | 'DONE'
  | 'FAILED';

export type UploadState =
  | 'IDLE'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED';

export type ModalState =
  | 'NONE'
  | 'NEW_WORKSPACE'
  | 'NEW_CONVERSATION'
  | 'DELETE_CONFIRM'
  | 'SETTINGS';

// ─── Events (actions that trigger transitions) ─────────────────────────────────

export type UIAction =
  // Navigation
  | { type: 'SELECT_WORKSPACE'; workspaceId: string }
  | { type: 'SELECT_CONVERSATION'; workspaceId: string; conversationId: string }
  | { type: 'GO_HOME' }
  // Conversations
  | { type: 'NEW_WORKSPACE' }
  | { type: 'NEW_CONVERSATION'; workspaceId: string }
  | { type: 'DELETE_WORKSPACE'; workspaceId: string }
  | { type: 'DELETE_CONVERSATION'; workspaceId: string; conversationId: string }
  | { type: 'PIN_CONVERSATION'; conversationId: string }
  // Messages
  | { type: 'SEND_MESSAGE'; content: string }
  | { type: 'MESSAGE_RECEIVED'; messageId: string }
  | { type: 'STREAM_CHUNK'; content: string }
  | { type: 'SEND_COMPLETE' }
  | { type: 'SEND_FAILED'; error: string }
  // Model
  | { type: 'SWITCH_MODEL'; model: string }
  | { type: 'REGENERATE'; messageId: string }
  // Plugins
  | { type: 'TOGGLE_PLUGIN'; pluginId: string }
  | { type: 'OPEN_PLUGINS' }
  | { type: 'CLOSE_PLUGINS' }
  // File
  | { type: 'UPLOAD_FILE'; file: File }
  | { type: 'UPLOAD_PROGRESS'; percent: number }
  | { type: 'UPLOAD_COMPLETE' }
  | { type: 'UPLOAD_FAILED'; error: string }
  // Modals
  | { type: 'OPEN_MODAL'; modal: ModalState }
  | { type: 'CLOSE_MODAL' }
  // Search
  | { type: 'SET_SEARCH'; query: string }
  // Debug
  | { type: 'TOGGLE_DEBUG' }
  // Internal
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR_ERROR' };

// ─── UI Machine Context (extended state) ───────────────────────────────────────

export interface UIMachineContext {
  screen: AppScreen;
  sendState: SendState;
  uploadState: UploadState;
  modalState: ModalState;
  showPlugins: boolean;
  showDebug: boolean;
  searchQuery: string;
  errorMessage: string | null;
  uploadProgress: number;
  lastSentMessageId: string | null;
}

// ─── Initial State ─────────────────────────────────────────────────────────────

export const INITIAL_UI_STATE: UIMachineContext = {
  screen: 'EMPTY',
  sendState: 'IDLE',
  uploadState: 'IDLE',
  modalState: 'NONE',
  showPlugins: false,
  showDebug: false,
  searchQuery: '',
  errorMessage: null,
  uploadProgress: 0,
  lastSentMessageId: null,
};

// ─── State Reducer ─────────────────────────────────────────────────────────────

export function uiReducer(state: UIMachineContext, action: UIAction): UIMachineContext {
  switch (action.type) {
    // Navigation ─────────────────────────────────────────────────────────────
    case 'SELECT_WORKSPACE':
      return {
        ...state,
        screen: 'WORKSPACE_LIST',
        sendState: 'IDLE',
        modalState: 'NONE',
      };

    case 'SELECT_CONVERSATION':
      return {
        ...state,
        screen: 'CONVERSATION',
        sendState: 'IDLE',
        modalState: 'NONE',
      };

    case 'GO_HOME':
      return {
        ...state,
        screen: 'EMPTY',
        sendState: 'IDLE',
        modalState: 'NONE',
      };

    // Sending Messages ────────────────────────────────────────────────────────
    case 'SEND_MESSAGE':
      return {
        ...state,
        sendState: 'SENDING',
        screen: state.screen === 'EMPTY' ? 'CONVERSATION' : state.screen,
      };

    case 'MESSAGE_RECEIVED':
      return {
        ...state,
        sendState: 'DONE',
        lastSentMessageId: action.messageId,
      };

    case 'STREAM_CHUNK':
      return {
        ...state,
        sendState: 'STREAMING',
      };

    case 'SEND_COMPLETE':
      return {
        ...state,
        sendState: 'IDLE',
        lastSentMessageId: null,
      };

    case 'SEND_FAILED':
      return {
        ...state,
        sendState: 'FAILED',
        errorMessage: action.error,
      };

    case 'REGENERATE':
      return {
        ...state,
        sendState: 'SENDING',
      };

    // Upload ──────────────────────────────────────────────────────────────────
    case 'UPLOAD_FILE':
      return {
        ...state,
        uploadState: 'UPLOADING',
        uploadProgress: 0,
      };

    case 'UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: action.percent,
        uploadState: 'UPLOADING',
      };

    case 'UPLOAD_COMPLETE':
      return {
        ...state,
        uploadState: 'DONE',
        uploadProgress: 100,
      };

    case 'UPLOAD_FAILED':
      return {
        ...state,
        uploadState: 'FAILED',
        errorMessage: action.error,
      };

    // Plugins ─────────────────────────────────────────────────────────────────
    case 'TOGGLE_PLUGIN':
      return {
        ...state,
        showPlugins: !state.showPlugins,
      };

    case 'OPEN_PLUGINS':
      return { ...state, showPlugins: true };

    case 'CLOSE_PLUGINS':
      return { ...state, showPlugins: false };

    // Modal ────────────────────────────────────────────────────────────────────
    case 'OPEN_MODAL':
      return { ...state, modalState: action.modal };

    case 'CLOSE_MODAL':
      return { ...state, modalState: 'NONE' };

    // Search ───────────────────────────────────────────────────────────────────
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };

    // Debug ─────────────────────────────────────────────────────────────────────
    case 'TOGGLE_DEBUG':
      return { ...state, showDebug: !state.showDebug };

    // Error ─────────────────────────────────────────────────────────────────────
    case 'ERROR':
      return { ...state, errorMessage: action.message, screen: 'ERROR' };

    case 'CLEAR_ERROR':
      return { ...state, errorMessage: null, screen: state.screen === 'ERROR' ? 'EMPTY' : state.screen };

    default:
      return state;
  }
}

// ─── Selectors ─────────────────────────────────────────────────────────────────

export function canSendMessage(state: UIMachineContext): boolean {
  return state.sendState === 'IDLE' && state.screen === 'CONVERSATION';
}

export function isLoading(state: UIMachineContext): boolean {
  return state.sendState === 'SENDING' || state.sendState === 'RECEIVING' || state.sendState === 'STREAMING';
}

export function isUploading(state: UIMachineContext): boolean {
  return state.uploadState === 'UPLOADING' || state.uploadState === 'PROCESSING';
}

export function getScreenLabel(state: UIMachineContext): string {
  const labels: Record<AppScreen, string> = {
    EMPTY: '首頁',
    WORKSPACE_LIST: 'Workspace',
    CONVERSATION: '對話中',
    LOADING: '載入中...',
    ERROR: '錯誤',
  };
  return labels[state.screen];
}
