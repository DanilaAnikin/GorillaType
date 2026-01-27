import { create } from 'zustand';

/* ============================================
   NOTIFICATIONS CENTER STORE
   Manages in-app notification center state
   (distinct from UI toast notifications in ui-store)
   ============================================ */

export type InboxNotificationType =
  | 'friend_request'
  | 'clan_invite'
  | 'pb_achieved'
  | 'tournament_start'
  | 'challenge_received'
  | 'challenge_result'
  | 'system';

export interface InboxNotification {
  id: string;
  user_id: string;
  type: InboxNotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface NotificationsState {
  notifications: InboxNotification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;

  setNotifications: (notifications: InboxNotification[]) => void;
  addNotification: (notification: InboxNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setIsOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  fetchNotifications: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isOpen: false,

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
  }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
  })),

  markAsRead: async (id) => {
    const notification = get().notifications.find((n) => n.id === id);
    if (!notification || notification.is_read) return;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: true }),
      });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  },

  removeNotification: async (id) => {
    const notification = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: notification && !notification.is_read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));

    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  },

  setIsOpen: (isOpen) => set({ isOpen }),
  setIsLoading: (isLoading) => set({ isLoading }),

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const notifications: InboxNotification[] = data.notifications || [];
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.is_read).length,
        });
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
