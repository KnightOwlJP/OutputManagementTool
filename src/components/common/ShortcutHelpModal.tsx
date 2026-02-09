/**
 * キーボードショートカットヘルプモーダル
 * 利用可能なショートカットを一覧表示
 */

'use client';

import React, { memo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Kbd,
} from '@heroui/react';
import { type ShortcutGroup } from '@/hooks/useKeyboardShortcuts';

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcutGroups: ShortcutGroup[];
  title?: string;
}

/**
 * ショートカットヘルプモーダル
 */
export const ShortcutHelpModal = memo(function ShortcutHelpModal({
  isOpen,
  onClose,
  shortcutGroups,
  title = 'キーボードショートカット',
}: ShortcutHelpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">⌨️</span>
                <span>{title}</span>
              </div>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Shift + ? でこのヘルプを表示できます
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="grid md:grid-cols-2 gap-6">
                {shortcutGroups.map((group) => (
                  <div key={group.category} className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {group.category}
                    </h3>
                    <ul className="space-y-2">
                      {group.shortcuts.map((shortcut, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {shortcut.description}
                          </span>
                          <ShortcutKeys keys={shortcut.keys} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              {shortcutGroups.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  ショートカットが登録されていません
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                閉じる
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});

/**
 * ショートカットキーの表示コンポーネント
 */
const ShortcutKeys = memo(function ShortcutKeys({ keys }: { keys: string }) {
  const parts = keys.split(' + ');
  
  return (
    <div className="flex items-center gap-1">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-gray-400 text-xs">+</span>}
          <Kbd className="text-xs px-1.5 py-0.5">{part}</Kbd>
        </React.Fragment>
      ))}
    </div>
  );
});

/**
 * 簡易的なショートカットヒント（ツールチップ用）
 */
export const ShortcutHint = memo(function ShortcutHint({
  keys,
  className = '',
}: {
  keys: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}
    >
      {keys.split(' + ').map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-0.5">+</span>}
          <Kbd className="text-xs px-1 py-0.5 min-w-[1.25rem] text-center">
            {part}
          </Kbd>
        </React.Fragment>
      ))}
    </span>
  );
});

export default ShortcutHelpModal;
