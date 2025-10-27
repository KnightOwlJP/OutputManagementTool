'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings.types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  // テーマが変更されたらHTML要素にクラスを適用
  useEffect(() => {
    applyTheme(settings.ui.theme);

    // システムテーマの変更を監視
    if (settings.ui.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.ui.theme]);

  // アニメーション設定が変更されたらHTML要素にクラスを適用
  useEffect(() => {
    applyAnimationSettings(settings.ui.animationsEnabled);
  }, [settings.ui.animationsEnabled]);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const html = document.documentElement;
    
    if (theme === 'system') {
      // システム設定を確認
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const applyAnimationSettings = (enabled: boolean) => {
    const html = document.documentElement;
    if (enabled) {
      html.classList.remove('reduce-motion');
    } else {
      html.classList.add('reduce-motion');
    }
  };

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        // 読み込み時にもテーマとアニメーションを適用
        applyTheme(parsed.ui.theme);
        applyAnimationSettings(parsed.ui.animationsEnabled);
      } else {
        // デフォルト設定を適用
        applyTheme(DEFAULT_SETTINGS.ui.theme);
        applyAnimationSettings(DEFAULT_SETTINGS.ui.animationsEnabled);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      applyTheme(DEFAULT_SETTINGS.ui.theme);
      applyAnimationSettings(DEFAULT_SETTINGS.ui.animationsEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('appSettings', JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
