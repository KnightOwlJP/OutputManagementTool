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
    // 既存のclassNameを保持しつつ、横並びレイアウトを強制
    const combinedClassName = `flex flex-row items-center justify-center gap-2 whitespace-nowrap ${className || ''}`;
    
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
