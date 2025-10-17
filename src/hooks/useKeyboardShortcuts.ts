'use client';

import { useEffect } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  callback: () => void;
  description?: string;
}

/**
 * キーボードショートカットを登録するフック
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * 一般的なショートカットの定義
 */
export const commonShortcuts = {
  save: { key: 's', ctrl: true, description: '保存' },
  new: { key: 'n', ctrl: true, description: '新規作成' },
  delete: { key: 'Delete', description: '削除' },
  search: { key: 'f', ctrl: true, description: '検索' },
  undo: { key: 'z', ctrl: true, description: '元に戻す' },
  redo: { key: 'y', ctrl: true, description: 'やり直し' },
  close: { key: 'Escape', description: '閉じる' },
  refresh: { key: 'r', ctrl: true, description: '更新' },
};
