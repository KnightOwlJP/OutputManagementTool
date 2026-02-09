'use client';

import { useEffect, useCallback, useState } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  callback: () => void;
  description?: string;
  /** ショートカットのカテゴリ */
  category?: string;
  /** 入力フィールド内でも有効にするか */
  enableInInput?: boolean;
}

export interface ShortcutGroup {
  category: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

/**
 * ショートカットキーを表示用文字列に変換
 */
export function formatShortcutKeys(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  
  // 特殊キーの表示名
  const keyDisplayNames: Record<string, string> = {
    'escape': 'Esc',
    'delete': 'Del',
    'backspace': '⌫',
    'enter': '↵',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    ' ': 'Space',
  };
  
  const keyDisplay = keyDisplayNames[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase();
  parts.push(keyDisplay);
  
  return parts.join(' + ');
}

/**
 * キーボードショートカットを登録するフック
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 入力フィールド内かチェック
      const isInputField = 
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable;

      for (const shortcut of shortcuts) {
        // 入力フィールド内で無効なショートカットはスキップ
        if (isInputField && !shortcut.enableInInput) {
          continue;
        }

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
 * ショートカットヘルプの表示状態を管理するフック
 */
export function useShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  // ?キーでヘルプを開く
  useKeyboardShortcuts([
    {
      key: '?',
      shift: true,
      callback: toggle,
      description: 'ショートカットヘルプを表示',
      enableInInput: false,
    },
  ]);
  
  return { isOpen, open, close, toggle };
}

/**
 * ショートカットをカテゴリ別にグループ化
 */
export function groupShortcuts(shortcuts: ShortcutConfig[]): ShortcutGroup[] {
  const groups = new Map<string, ShortcutGroup>();
  
  for (const shortcut of shortcuts) {
    if (!shortcut.description) continue;
    
    const category = shortcut.category || '一般';
    
    if (!groups.has(category)) {
      groups.set(category, { category, shortcuts: [] });
    }
    
    groups.get(category)!.shortcuts.push({
      keys: formatShortcutKeys(shortcut),
      description: shortcut.description,
    });
  }
  
  return Array.from(groups.values());
}

/**
 * 一般的なショートカットの定義
 */
export const commonShortcuts = {
  save: { key: 's', ctrl: true, description: '保存', category: 'ファイル' },
  new: { key: 'n', ctrl: true, description: '新規作成', category: 'ファイル' },
  delete: { key: 'Delete', description: '削除', category: '編集' },
  search: { key: 'f', ctrl: true, description: '検索', category: '検索' },
  undo: { key: 'z', ctrl: true, description: '元に戻す', category: '編集' },
  redo: { key: 'y', ctrl: true, description: 'やり直し', category: '編集' },
  close: { key: 'Escape', description: '閉じる/キャンセル', category: 'ナビゲーション' },
  refresh: { key: 'r', ctrl: true, description: '更新', category: 'ナビゲーション' },
  help: { key: '?', shift: true, description: 'ショートカットヘルプ', category: 'ヘルプ' },
};

/**
 * 工程表用ショートカット
 */
export const processTableShortcuts = {
  ...commonShortcuts,
  addProcess: { key: 'n', ctrl: true, shift: true, description: '新しい工程を追加', category: '工程' },
  editProcess: { key: 'e', ctrl: true, description: '選択した工程を編集', category: '工程' },
  duplicateProcess: { key: 'd', ctrl: true, description: '選択した工程を複製', category: '工程' },
  selectAll: { key: 'a', ctrl: true, description: 'すべて選択', category: '選択' },
  deselectAll: { key: 'Escape', description: '選択を解除', category: '選択' },
  moveUp: { key: 'ArrowUp', alt: true, description: '工程を上に移動', category: '並び替え' },
  moveDown: { key: 'ArrowDown', alt: true, description: '工程を下に移動', category: '並び替え' },
  expandAll: { key: '+', ctrl: true, description: 'すべて展開', category: '表示' },
  collapseAll: { key: '-', ctrl: true, description: 'すべて折りたたむ', category: '表示' },
};

/**
 * プロジェクト用ショートカット
 */
export const projectShortcuts = {
  ...commonShortcuts,
  newProject: { key: 'n', ctrl: true, shift: true, description: '新しいプロジェクトを作成', category: 'プロジェクト' },
  openProject: { key: 'o', ctrl: true, description: 'プロジェクトを開く', category: 'プロジェクト' },
  closeProject: { key: 'w', ctrl: true, description: 'プロジェクトを閉じる', category: 'プロジェクト' },
};
