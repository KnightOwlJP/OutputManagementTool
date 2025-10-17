'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Skeleton } from '@heroui/react';
import { AppLayout } from '@/components/layout/AppLayout';
import Link from 'next/link';
import {
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  BookOpenIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface ProjectStats {
  totalProjects: number;
  totalProcesses: number;
  totalBpmnDiagrams: number;
  totalVersions: number;
}

export default function Home() {
  console.log('[HomePage] Component mounted');
  console.log('[HomePage] Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // データ読み込みをシミュレート
    const loadData = async () => {
      setIsLoading(true);
      // TODO: 実際のIPCでデータを取得
      await new Promise(resolve => setTimeout(resolve, 300));
      setStats({
        totalProjects: 0,
        totalProcesses: 0,
        totalBpmnDiagrams: 0,
        totalVersions: 0,
      });
      setIsLoading(false);
    };
    loadData();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* ヘッダー */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-gray-50">
            Output Management Tool
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            業務プロセスを一元管理
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardBody className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      プロジェクト
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      {stats?.totalProjects ?? 0}
                    </p>
                  </div>
                  <div className="bg-blue-500 bg-opacity-10 p-2 rounded-lg">
                    <FolderIcon className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="shadow-sm">
            <CardBody className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      工程
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      {stats?.totalProcesses ?? 0}
                    </p>
                  </div>
                  <div className="bg-green-500 bg-opacity-10 p-2 rounded-lg">
                    <ChartBarIcon className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="shadow-sm">
            <CardBody className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      BPMN
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      {stats?.totalBpmnDiagrams ?? 0}
                    </p>
                  </div>
                  <div className="bg-purple-500 bg-opacity-10 p-2 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="shadow-sm">
            <CardBody className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      バージョン
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      {stats?.totalVersions ?? 0}
                    </p>
                  </div>
                  <div className="bg-orange-500 bg-opacity-10 p-2 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* メインアクション */}
        <Card className="shadow-md">
          <CardBody className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-50">
              はじめる
            </h2>
            <div className="space-y-3">
              <Link href="/projects" className="block">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 bg-opacity-10 p-2 rounded-lg">
                      <PlusIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50">
                        新規プロジェクト
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        プロジェクトを作成して工程管理を開始
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </Link>

              <Link href="/manual" className="block">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 bg-opacity-10 p-2 rounded-lg">
                      <BookOpenIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50">
                        マニュアル
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        使い方を確認する
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* 主な機能 */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-50">
            主な機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 bg-opacity-10 p-2 rounded-lg flex-shrink-0">
                    <ChartBarIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      4段階階層管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      大工程→中工程→小工程→詳細工程の階層構造
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500 bg-opacity-10 p-2 rounded-lg flex-shrink-0">
                    <DocumentTextIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      BPMNエディタ
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ビジュアルなプロセス設計と編集
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 bg-opacity-10 p-2 rounded-lg flex-shrink-0">
                    <DocumentTextIcon className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      Excel連携
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Excelからインポート・エクスポート
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 bg-opacity-10 p-2 rounded-lg flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-50">
                      バージョン管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      スナップショットの作成と復元
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* クイックガイド */}
        <Card className="shadow-sm bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500">
          <CardBody className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-50">
              使い方
            </h2>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">1.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  プロジェクトを作成
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">2.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  工程を追加（手動入力またはExcelインポート）
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">3.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  階層構造を構築
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">4.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  必要に応じてBPMNダイアグラムを作成
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">5.</span>
                <span className="text-gray-700 dark:text-gray-300">
                  重要なタイミングでバージョンを保存
                </span>
              </li>
            </ol>
            <div className="mt-6 flex gap-3">
              <Button
                as={Link}
                href="/projects"
                color="primary"
                size="md"
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                今すぐ始める
              </Button>
              <Button
                as={Link}
                href="/manual"
                variant="bordered"
                size="md"
              >
                詳しく見る
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
