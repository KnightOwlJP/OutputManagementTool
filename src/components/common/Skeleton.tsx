'use client';

import React, { memo } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';

interface SkeletonProps {
  className?: string;
  /** アニメーションの遅延 (ms) - 連続するスケルトンに波を作る */
  delay?: number;
  /** 幅 */
  width?: string | number;
  /** 高さ */
  height?: string | number;
}

/**
 * 基本的なSkeleton要素（メモ化）
 */
export const Skeleton = memo(function Skeleton({ 
  className = '', 
  delay = 0,
  width,
  height,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    minHeight: height || '1rem',
    animationDelay: delay ? `${delay}ms` : undefined,
    width: width,
    height: height,
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={style}
    />
  );
});

/**
 * テキスト用Skeleton（メモ化）
 */
export const SkeletonText = memo(function SkeletonText({ 
  lines = 1, 
  className = '' 
}: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" delay={i * 50} />
      ))}
    </div>
  );
});

/**
 * カード用Skeleton（メモ化）
 */
export const SkeletonCard = memo(function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardBody className="space-y-3">
        <Skeleton className="h-4 w-full" delay={50} />
        <Skeleton className="h-4 w-5/6" delay={100} />
        <Skeleton className="h-4 w-4/6" delay={150} />
      </CardBody>
    </Card>
  );
});

/**
 * リスト用Skeleton（メモ化）
 */
export const SkeletonList = memo(function SkeletonList({ 
  items = 5, 
  className = '' 
}: { items?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg dark:border-gray-700">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" delay={i * 30} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" delay={i * 30 + 15} />
            <Skeleton className="h-3 w-1/2" delay={i * 30 + 30} />
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * テーブル用Skeleton（メモ化）
 */
export const SkeletonTable = memo(function SkeletonTable({ 
  rows = 5, 
  cols = 4, 
  className = '' 
}: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* ヘッダー */}
      <div className="flex gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" delay={i * 20} />
        ))}
      </div>
      {/* 行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b dark:border-gray-700">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className="h-4 flex-1" 
              delay={(rowIndex * cols + colIndex) * 10} 
            />
          ))}
        </div>
      ))}
    </div>
  );
});

/**
 * ツリー用Skeleton（メモ化）
 */
export const SkeletonTree = memo(function SkeletonTree({ 
  depth = 3, 
  className = '' 
}: { depth?: number; className?: string }) {
  const renderNode = (level: number, baseDelay: number): React.ReactElement => {
    if (level > depth) return <></>;
    
    return (
      <div className="ml-6 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" delay={baseDelay} />
          <Skeleton className="h-4 w-48" delay={baseDelay + 20} />
        </div>
        {level < depth && (
          <>
            {renderNode(level + 1, baseDelay + 40)}
            {renderNode(level + 1, baseDelay + 80)}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" delay={i * 100} />
            <Skeleton className="h-4 w-64" delay={i * 100 + 20} />
          </div>
          {renderNode(1, i * 100 + 40)}
        </div>
      ))}
    </div>
  );
});

/**
 * フォーム用Skeleton（メモ化）
 */
export const SkeletonForm = memo(function SkeletonForm({ 
  fields = 4, 
  className = '' 
}: { fields?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" delay={i * 50} />
          <Skeleton className="h-10 w-full" delay={i * 50 + 25} />
        </div>
      ))}
      <div className="flex gap-2 justify-end mt-6">
        <Skeleton className="h-10 w-24" delay={fields * 50} />
        <Skeleton className="h-10 w-24" delay={fields * 50 + 25} />
      </div>
    </div>
  );
});

/**
 * 工程表ページ用Skeleton（メモ化）
 */
export const SkeletonProcessTablePage = memo(function SkeletonProcessTablePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" delay={20} />
            <Skeleton className="h-4 w-32" delay={40} />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" delay={60} />
          <Skeleton className="h-10 w-20" delay={80} />
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardBody className="p-4">
              <Skeleton className="h-4 w-24" delay={100 + i * 30} />
              <Skeleton className="h-8 w-12 mt-2" delay={115 + i * 30} />
            </CardBody>
          </Card>
        ))}
      </div>

      {/* タブとテーブル */}
      <Card className="shadow-sm">
        <CardBody className="p-0">
          <div className="flex gap-2 p-4 border-b dark:border-gray-700">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" delay={200 + i * 20} />
            ))}
          </div>
          <div className="p-6">
            <SkeletonTable rows={8} cols={6} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
});

/**
 * プロジェクト一覧ページ用Skeleton（メモ化）
 */
export const SkeletonProjectListPage = memo(function SkeletonProjectListPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" delay={20} />
      </div>

      {/* プロジェクトカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" delay={50 + i * 30} />
            </CardHeader>
            <CardBody className="space-y-3">
              <Skeleton className="h-4 w-full" delay={65 + i * 30} />
              <Skeleton className="h-4 w-2/3" delay={80 + i * 30} />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-16 rounded-full" delay={95 + i * 30} />
                <Skeleton className="h-6 w-16 rounded-full" delay={110 + i * 30} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
});
