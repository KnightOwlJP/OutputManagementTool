'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';

interface ManualPreviewProps {
  title: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    level: number;
    displayOrder: number;
  }>;
  showTableOfContents?: boolean;
}

export const ManualPreview: React.FC<ManualPreviewProps> = ({
  title,
  sections,
  showTableOfContents = true,
}) => {
  /**
   * Markdownの簡易レンダリング
   * Phase 6: 基本的なフォーマットのみサポート
   * Phase 7: react-markdown等のライブラリ導入予定
   */
  const renderMarkdown = (content: string) => {
    let html = content;

    // 見出し
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

    // 太字・斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // リスト
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$1. $2</li>');

    // 段落
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = `<p class="mb-3">${html}</p>`;

    // コードブロック（簡易）
    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>');

    return html;
  };

  /**
   * 目次生成
   */
  const generateTableOfContents = () => {
    return sections
      .filter(s => s.level <= 2) // レベル1-2のみ目次に表示
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((section, index) => (
        <div
          key={section.id}
          className={`py-2 ${section.level === 1 ? 'font-semibold' : 'ml-4 text-sm'}`}
        >
          <a
            href={`#section-${section.id}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {section.level === 1 ? `${index + 1}. ` : `${index + 1}.1. `}
            {section.title}
          </a>
        </div>
      ));
  };

  /**
   * セクションの階層番号生成
   */
  const getSectionNumber = (section: typeof sections[0], index: number) => {
    // 簡易実装: レベル別の番号付け
    if (section.level === 1) {
      return `${index + 1}.`;
    } else if (section.level === 2) {
      return `${index + 1}.1.`;
    }
    return '';
  };

  // セクションを表示順にソート
  const sortedSections = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      {/* タイトルページ */}
      <Card className="shadow-sm print:shadow-none">
        <CardBody className="p-12 text-center print:p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4 print:text-3xl">
            {title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            作成日: {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardBody>
      </Card>

      {/* 目次 */}
      {showTableOfContents && sections.length > 0 && (
        <Card className="shadow-sm print:shadow-none print:break-after-page">
          <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700 print:p-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">目次</h2>
          </CardHeader>
          <CardBody className="p-6 print:p-4">
            <div className="space-y-1">
              {generateTableOfContents()}
            </div>
          </CardBody>
        </Card>
      )}

      {/* セクション内容 */}
      {sortedSections.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              セクションがありません
            </p>
          </CardBody>
        </Card>
      ) : (
        sortedSections.map((section, index) => (
          <Card
            key={section.id}
            id={`section-${section.id}`}
            className={`shadow-sm print:shadow-none ${
              section.level === 1 ? 'print:break-before-page' : ''
            }`}
          >
            <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700 print:p-4">
              <h2
                className={`font-bold text-gray-900 dark:text-gray-50 ${
                  section.level === 1
                    ? 'text-2xl'
                    : section.level === 2
                    ? 'text-xl'
                    : 'text-lg'
                }`}
              >
                {getSectionNumber(section, index)} {section.title}
              </h2>
            </CardHeader>
            <CardBody className="p-6 print:p-4">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(section.content),
                }}
              />
            </CardBody>
          </Card>
        ))
      )}

      {/* 印刷スタイル */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print\\:break-before-page {
            page-break-before: always;
          }
          .print\\:break-after-page {
            page-break-after: always;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ManualPreview;
