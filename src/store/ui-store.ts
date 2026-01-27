import { create } from 'zustand';

// Types
export type ModalType =
  | 'settings'
  | 'commandPalette'
  | 'login'
  | 'register'
  | 'profile'
  | 'leaderboard'
  | 'about'
  | 'keybinds'
  | 'themes'
  | 'languages'
  | 'testConfig'
  | 'results'
  | 'confirm';

export interface ModalState {
  isOpen: boolean;
  data?: Record<string, unknown>;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  createdAt: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TooltipState {
  isVisible: boolean;
  content: string;
  x: number;
  y: number;
}

export interface UIState {
  // Modals
  modals: Record<ModalType, ModalState>;
  activeModal: ModalType | null;

  // Notifications
  notifications: Notification[];

  // Tooltip
  tooltip: TooltipState;

  // Global UI state
  isSidebarOpen: boolean;
  isMenuOpen: boolean;
  isFocusMode: boolean;
  isFullscreen: boolean;

  // Chat
  isChatOpen: boolean;
  chatRoomId: string | null;
  chatRoomType: 'global' | 'direct' | 'group' | null;
  chatRoomName: string | null;

  // Keyboard
  capsLockWarning: boolean;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Command palette
  commandPaletteQuery: string;

  // Actions - Modals
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: (modal?: ModalType) => void;
  closeAllModals: () => void;
  toggleModal: (modal: ModalType, data?: Record<string, unknown>) => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Tooltip
  showTooltip: (content: string, x: number, y: number) => void;
  hideTooltip: () => void;

  // Actions - UI toggles
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleMenu: () => void;
  setMenuOpen: (isOpen: boolean) => void;
  toggleFocusMode: () => void;
  setFocusMode: (isFocusMode: boolean) => void;
  toggleFullscreen: () => void;
  setFullscreen: (isFullscreen: boolean) => void;

  // Actions - Keyboard
  setCapsLockWarning: (show: boolean) => void;

  // Actions - Loading
  setGlobalLoading: (isLoading: boolean, message?: string | null) => void;

  // Actions - Command palette
  setCommandPaletteQuery: (query: string) => void;

  // Actions - Chat
  toggleChat: () => void;
  setChatRoom: (roomId: string | null, roomType?: 'global' | 'direct' | 'group' | null, roomName?: string | null) => void;
  openDirectMessage: (roomId: string, friendName: string) => void;
}

const createInitialModals = (): Record<ModalType, ModalState> => ({
  settings: { isOpen: false },
  commandPalette: { isOpen: false },
  login: { isOpen: false },
  register: { isOpen: false },
  profile: { isOpen: false },
  leaderboard: { isOpen: false },
  about: { isOpen: false },
  keybinds: { isOpen: false },
  themes: { isOpen: false },
  languages: { isOpen: false },
  testConfig: { isOpen: false },
  results: { isOpen: false },
  confirm: { isOpen: false },
});

const generateNotificationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  modals: createInitialModals(),
  activeModal: null,
  notifications: [],
  tooltip: {
    isVisible: false,
    content: '',
    x: 0,
    y: 0,
  },
  isSidebarOpen: false,
  isMenuOpen: false,
  isFocusMode: false,
  isFullscreen: false,
  isChatOpen: false,
  chatRoomId: null,
  chatRoomType: null,
  chatRoomName: null,
  capsLockWarning: false,
  globalLoading: false,
  loadingMessage: null,
  commandPaletteQuery: '',

  // Modal actions
  openModal: (modal, data) => set((state) => ({
    modals: {
      ...state.modals,
      [modal]: { isOpen: true, data },
    },
    activeModal: modal,
  })),

  closeModal: (modal) => set((state) => {
    const modalToClose = modal ?? state.activeModal;
    if (!modalToClose) return state;

    return {
      modals: {
        ...state.modals,
        [modalToClose]: { isOpen: false, data: undefined },
      },
      activeModal: modalToClose === state.activeModal ? null : state.activeModal,
    };
  }),

  closeAllModals: () => set({
    modals: createInitialModals(),
    activeModal: null,
  }),

  toggleModal: (modal, data) => {
    const { modals } = get();
    if (modals[modal].isOpen) {
      get().closeModal(modal);
    } else {
      get().openModal(modal, data);
    }
  },

  // Notification actions
  addNotification: (notification) => {
    const id = generateNotificationId();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  clearNotifications: () => set({ notifications: [] }),

  // Tooltip actions
  showTooltip: (content, x, y) => set({
    tooltip: { isVisible: true, content, x, y },
  }),

  hideTooltip: () => set((state) => ({
    tooltip: { ...state.tooltip, isVisible: false },
  })),

  // UI toggle actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),

  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFocusMode: (isFocusMode) => set({ isFocusMode }),

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),

  // Keyboard actions
  setCapsLockWarning: (capsLockWarning) => set({ capsLockWarning }),

  // Loading actions
  setGlobalLoading: (globalLoading, loadingMessage = null) => set({
    globalLoading,
    loadingMessage,
  }),

  // Command palette actions
  setCommandPaletteQuery: (commandPaletteQuery) => set({ commandPaletteQuery }),

  // Chat actions
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChatRoom: (chatRoomId, chatRoomType = null, chatRoomName = null) => set({
    chatRoomId,
    chatRoomType,
    chatRoomName
  }),
  openDirectMessage: (roomId, friendName) => set({
    chatRoomId: roomId,
    chatRoomType: 'direct',
    chatRoomName: friendName,
    isChatOpen: true,
  }),
}));

// Convenience functions for common notification types
export const notify = {
  success: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useUIStore.getState().addNotification({ type: 'info', title, message }),
};
