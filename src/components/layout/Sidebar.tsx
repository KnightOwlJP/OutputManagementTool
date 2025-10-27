'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'ホーム', href: '/', icon: HomeIcon },
  { name: 'プロジェクト', href: '/projects', icon: FolderIcon },
  { 
    name: 'マニュアル', 
    href: '/manual', 
    icon: BookOpenIcon,
    children: [
      { name: '基本ガイド', href: '/manual', icon: BookOpenIcon },
      { name: 'BPMN 2.0', href: '/manual/bpmn', icon: BookOpenIcon },
    ]
  },
  { name: '設定', href: '/settings', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['/manual']));
  const pathname = usePathname();

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  };

  return (
    <aside
      className={`
        flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out shadow-sm
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* ロゴ・タイトル */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <h1 className="text-lg font-bold text-gray-800 dark:text-white truncate">
            Output Tool
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* ナビゲーションメニュー */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
          const isExpanded = expandedItems.has(item.href);
          const Icon = item.icon;

          return (
            <div key={item.name}>
              {item.children && !collapsed ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.href)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all group
                      ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`
                              flex items-center px-3 py-2 rounded-md transition-all text-sm
                              ${
                                isChildActive
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-750'
                              }
                            `}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2.5 rounded-md transition-all group
                    ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  {!collapsed && <span className="ml-3 text-sm font-medium">{item.name}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* フッター */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            v2.0.0 (Phase 9)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            100% Complete
          </p>
        </div>
      )}
    </aside>
  );
}
