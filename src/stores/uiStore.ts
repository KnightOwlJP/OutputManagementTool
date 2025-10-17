import { create } from 'zustand';

interface UIState {
  // サイドバー
  sidebarCollapsed: boolean;
  
  // モーダル
  activeModal: string | null;
  modalData: any;
  
  // テーマ
  theme: 'light' | 'dark' | 'system';
  
  // 通知
  notifications: Notification[];
  
  // ローディング状態
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
  duration?: number;
}

let notificationId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  // 初期状態
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  theme: 'system',
  notifications: [],
  globalLoading: false,
  loadingMessage: null,

  // サイドバー
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  // モーダル
  openModal: (modalId, data) =>
    set({ activeModal: modalId, modalData: data }),
  
  closeModal: () =>
    set({ activeModal: null, modalData: null }),
  
  // テーマ
  setTheme: (theme) => {
    set({ theme });
    
    // システムテーマに基づいてダークモードを適用
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // ローカルストレージに保存
    localStorage.setItem('theme', theme);
  },
  
  // 通知
  addNotification: (notification) => {
    const id = `notification-${notificationId++}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration || 5000,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // 自動削除
    if (newNotification.duration) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },
  
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  // グローバルローディング
  setGlobalLoading: (loading, message) =>
    set({ globalLoading: loading, loadingMessage: message || null }),
}));
