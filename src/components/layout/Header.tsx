'use client';

import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  
  // パスからページタイトルを生成
  const getPageTitle = () => {
    if (pathname === '/') return 'ホーム';
    if (pathname === '/projects') return 'プロジェクト一覧';
    if (pathname.startsWith('/projects/')) return 'プロジェクト詳細';
    if (pathname === '/manual') return 'マニュアル';
    return 'Output Management Tool';
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        {getPageTitle()}
      </h2>
    </header>
  );
}
