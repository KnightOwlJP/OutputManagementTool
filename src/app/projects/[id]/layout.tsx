// 動的ルート用のレイアウト
// 静的エクスポート時のダミーパラメータを生成

export function generateStaticParams() {
  // ダミーのパラメータを返す（実際のルーティングはクライアントサイドで行う）
  return [{ id: 'placeholder' }];
}

export default function ProjectIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
