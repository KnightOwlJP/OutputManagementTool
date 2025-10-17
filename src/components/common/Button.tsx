'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button as HeroButton } from '@heroui/react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  fullWidth?: boolean;
  onPress?: () => void;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'solid',
      color = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      startContent,
      endContent,
      fullWidth = false,
      className,
      onPress,
      onClick,
      ...props
    },
    ref
  ) => {
    // プロジェクト詳細ページのスタイルを適用
    let baseClassName = 'flex flex-row items-center justify-center gap-2 whitespace-nowrap font-semibold';
    
    // カラーとバリアント別のスタイル
    if (color === 'primary' && variant === 'solid') {
      baseClassName += ' shadow-md hover:shadow-lg transition-shadow bg-blue-600 hover:bg-blue-700 text-white';
    } else if (color === 'default' && variant === 'flat') {
      baseClassName += ' border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
    }
    
    const combinedClassName = `${baseClassName} ${className || ''}`;
    
    return (
      <HeroButton
        ref={ref}
        variant={variant}
        color={color}
        size={size}
        isLoading={isLoading}
        isDisabled={isDisabled}
        startContent={startContent}
        endContent={endContent}
        fullWidth={fullWidth}
        className={combinedClassName}
        onPress={onPress || onClick}
        {...(props as any)}
      >
        {children}
      </HeroButton>
    );
  }
);

Button.displayName = 'Button';
