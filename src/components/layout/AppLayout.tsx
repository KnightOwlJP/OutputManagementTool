 'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Sidebar,Header } from './index';
import { useSettings } from '@/contexts/SettingsContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { settings } = useSettings();
  const [effectiveTheme, setEffectiveTheme] = useState<string>(settings.ui.theme);

  useEffect(() => {
    if (settings.ui.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => setEffectiveTheme(mq.matches ? 'dark' : 'light');
      handler();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    else {
      setEffectiveTheme(settings.ui.theme);
    }
  }, [settings.ui.theme]);

  return (
    <div className={`flex h-screen overflow-hidden ${effectiveTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* サイドバー */}
      <Sidebar />

      {/* メインコンテンツエリア */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ヘッダー */}
        <Header />

        {/* コンテンツ */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
