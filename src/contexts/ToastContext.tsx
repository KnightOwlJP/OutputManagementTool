'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  /** アクションボタンのラベル */
  label: string;
  /** アクションボタンクリック時のコールバック */
  onClick: () => void | Promise<void>;
  /** アクション実行後にトーストを閉じるか */
  closeOnClick?: boolean;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** 詳細メッセージ（オプション） */
  description?: string;
  duration?: number;
  /** アクションボタン */
  action?: ToastAction;
  /** アンドゥアクション（削除操作など用） */
  undoAction?: () => void | Promise<void>;
  /** プログレスバーを表示するか */
  showProgress?: boolean;
  /** 作成時刻 */
  createdAt: number;
}

export interface ShowToastOptions {
  /** 詳細メッセージ */
  description?: string;
  /** 表示時間 (ms)。0で無限 */
  duration?: number;
  /** アクションボタン */
  action?: ToastAction;
  /** アンドゥアクション */
  undoAction?: () => void | Promise<void>;
  /** プログレスバーを表示 */
  showProgress?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  /** 基本的なトースト表示 */
  showToast: (type: ToastType, message: string, duration?: number) => string;
  /** オプション付きトースト表示 */
  showToastWithOptions: (type: ToastType, message: string, options?: ShowToastOptions) => string;
  /** アンドゥ付きトースト（削除操作用） */
  showUndoToast: (message: string, undoAction: () => void | Promise<void>, duration?: number) => string;
  /** エラートースト（詳細付き） */
  showErrorToast: (message: string, errorDetail?: string) => string;
  /** 成功トースト */
  showSuccessToast: (message: string) => string;
  /** トースト削除 */
  removeToast: (id: string) => void;
  /** すべてのトーストをクリア */
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    // タイマーをクリア
    const timer = timerRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerRefs.current.delete(id);
    }
    
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToastWithOptions = useCallback(
    (type: ToastType, message: string, options: ShowToastOptions = {}): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const duration = options.duration ?? (type === 'error' ? 5000 : 3000);
      
      const newToast: Toast = {
        id,
        type,
        message,
        description: options.description,
        duration,
        action: options.action,
        undoAction: options.undoAction,
        showProgress: options.showProgress ?? (duration > 0),
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timerRefs.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  const showToast = useCallback(
    (type: ToastType, message: string, duration?: number): string => {
      return showToastWithOptions(type, message, { duration });
    },
    [showToastWithOptions]
  );

  const showUndoToast = useCallback(
    (message: string, undoAction: () => void | Promise<void>, duration = 5000): string => {
      return showToastWithOptions('success', message, {
        duration,
        undoAction,
        showProgress: true,
      });
    },
    [showToastWithOptions]
  );

  const showErrorToast = useCallback(
    (message: string, errorDetail?: string): string => {
      return showToastWithOptions('error', message, {
        description: errorDetail,
        duration: 6000,
      });
    },
    [showToastWithOptions]
  );

  const showSuccessToast = useCallback(
    (message: string): string => {
      return showToastWithOptions('success', message, { duration: 3000 });
    },
    [showToastWithOptions]
  );

  const clearAllToasts = useCallback(() => {
    // すべてのタイマーをクリア
    timerRefs.current.forEach((timer) => clearTimeout(timer));
    timerRefs.current.clear();
    
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showToastWithOptions,
        showUndoToast,
        showErrorToast,
        showSuccessToast,
        removeToast,
        clearAllToasts,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
