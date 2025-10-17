'use client';

import { ReactNode } from 'react';
import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  hideCloseButton?: boolean;
  isDismissable?: boolean;
  showConfirmButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  confirmIcon?: ReactNode;
  onConfirm?: () => void;
  isLoading?: boolean;
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  hideCloseButton = false,
  isDismissable = true,
  showConfirmButton = false,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmColor = 'primary',
  confirmIcon,
  onConfirm,
  isLoading = false,
  isConfirmLoading = false,
  isConfirmDisabled = false,
}: ModalProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <HeroModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      hideCloseButton={hideCloseButton}
      isDismissable={isDismissable}
      placement="center"
      backdrop="opaque"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/80",
        base: "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-2xl max-h-[90vh]",
        header: "border-b-2 border-gray-200 dark:border-gray-700 pb-4 px-6 pt-6",
        body: "px-6 py-6 overflow-y-auto",
        footer: "border-t-2 border-gray-200 dark:border-gray-700 pt-4 px-6 pb-6",
      }}
    >
      <ModalContent>
        {(onCloseHandler) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-gray-900 dark:text-gray-50">
              {title}
            </ModalHeader>
            <ModalBody className="text-gray-700 dark:text-gray-300">
              {children}
            </ModalBody>
            <ModalFooter className="flex flex-row items-center justify-end gap-3">
              {footer ? (
                footer
              ) : showConfirmButton ? (
                <>
                  <Button
                    variant="bordered"
                    onPress={onCloseHandler}
                    isDisabled={isLoading || isConfirmLoading}
                    className="font-semibold border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[100px]"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    color={confirmColor}
                    onPress={handleConfirm}
                    isLoading={isConfirmLoading || isLoading}
                    isDisabled={isConfirmDisabled}
                    startContent={confirmIcon}
                    className={`font-semibold shadow-md hover:shadow-lg transition-shadow min-w-[100px] ${
                      confirmColor === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                      confirmColor === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      confirmColor === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                      ''
                    }`}
                  >
                    {confirmText}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="bordered" 
                  onPress={onCloseHandler}
                  className="font-semibold border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[100px]"
                >
                  閉じる
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </HeroModal>
  );
}
