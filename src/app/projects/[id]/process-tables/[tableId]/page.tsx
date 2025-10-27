/**
 * ProcessTable詳細ページ（V2対応） - Server Component
 * Next.js 15対応: Client Componentを直接インポート
 */

import { ProcessTableDetailClientPage } from './ClientPage';

// 静的エクスポート用（プレースホルダーページを生成）
export async function generateStaticParams() {
  console.log('[page.tsx] generateStaticParams called');
  // プレースホルダーとして使用するパラメータを返す
  // Electron側でこのHTMLファイルをロードし、実際のURLに書き換える
  return [{ id: 'placeholder', tableId: 'placeholder' }];
}

export default function ProcessTableDetailPage() {
  console.log('[page.tsx] ProcessTableDetailPage rendering');
  
  return <ProcessTableDetailClientPage />;
}
