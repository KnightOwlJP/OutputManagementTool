// 静的エクスポート用のダミーパラメータ生成
// この関数はビルド時に呼ばれ、動的ルートの静的HTMLを生成します
export function generateStaticParams() {
  // ダミーのIDを返す（実際のルーティングはクライアントサイドで行う）
  return [
    { id: 'index' }, // ダミーパラメータ
  ];
}
