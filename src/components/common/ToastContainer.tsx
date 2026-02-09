'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { useToast, ToastType, Toast } from '@/contexts/ToastContext';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

const iconMap: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  info: 'text-blue-500 dark:text-blue-400',
};

const progressColorMap: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

/**
 * 個別のトーストアイテム（メモ化）
 */
const ToastItem = memo(function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[toast.type];

  // プログレスバーのアニメーション
  useEffect(() => {
    if (!toast.showProgress || !toast.duration || toast.duration <= 0 || isHovered) {
      return;
    }

    const startTime = toast.createdAt;
    const endTime = startTime + toast.duration;
    
    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / toast.duration) * 100;
      setProgress(newProgress);
      
      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationId);
  }, [toast.showProgress, toast.duration, toast.createdAt, isHovered]);

  const handleUndoClick = useCallback(async () => {
    if (toast.undoAction) {
      await toast.undoAction();
      onRemove(toast.id);
    }
  }, [toast, onRemove]);

  const handleActionClick = useCallback(async () => {
    if (toast.action) {
      await toast.action.onClick();
      if (toast.action.closeOnClick !== false) {
        onRemove(toast.id);
      }
    }
  }, [toast, onRemove]);

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-out animate-in slide-in-from-right ${colorMap[toast.type]}`}
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.message}</p>
          {toast.description && (
            <p className="mt-1 text-xs opacity-80">{toast.description}</p>
          )}
          
          {/* アクションボタン */}
          <div className="flex items-center gap-2 mt-2">
            {toast.undoAction && (
              <button
                onClick={handleUndoClick}
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline focus:outline-none focus:underline"
              >
                <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                元に戻す
              </button>
            )}
            {toast.action && (
              <button
                onClick={handleActionClick}
                className="text-xs font-medium hover:underline focus:outline-none focus:underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="閉じる"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* プログレスバー */}
      {toast.showProgress && toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-black/5 dark:bg-white/5">
          <div
            className={`h-full transition-all duration-100 ${progressColorMap[toast.type]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
});

/**
 * トーストコンテナ
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
