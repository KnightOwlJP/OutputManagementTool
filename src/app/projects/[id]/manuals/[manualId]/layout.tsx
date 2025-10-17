// 動的ルート用のレイアウト（マニュアルID）

export function generateStaticParams() {
  return [{ manualId: 'placeholder' }];
}

export default function ManualIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
