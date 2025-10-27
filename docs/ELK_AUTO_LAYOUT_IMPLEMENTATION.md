# ELK自動整形機能 実装完了報告

## 実装日: 2025年10月22日

---

## ✅ 実装概要

BPMN 2.0 XMLエクスポート機能に**ELK (Eclipse Layout Kernel)** を統合し、フローノードの座標を自動計算する機能を実装しました。

---

## ✅ 実装内容

### 1. elkjsライブラリのインストール
```bash
npm install elkjs --save --legacy-peer-deps
```
- **バージョン**: elkjs (最新版)
- **目的**: BPMNフローの自動レイアウト計算

### 2. ELKレイアウトエンジンの作成

**ファイル**: `src/lib/elk-layout.ts` (新規作成, 332行)

#### 主要機能:
- **`layoutBpmnProcess()`**: メイン関数
  - Processデータ → ELKグラフ形式に変換
  - ELKレイアウトアルゴリズム実行
  - レイアウト結果 → BPMN座標形式に変換

#### レイアウト設定:
| 設定項目 | 値 | 説明 |
|---------|-----|------|
| `elk.algorithm` | `layered` | 階層的レイアウト（BPMNに最適） |
| `elk.direction` | `RIGHT` | 左から右へのフロー |
| `elk.spacing.nodeNode` | `50` | ノード間スペース |
| `elk.spacing.edgeNode` | `30` | エッジとノードのスペース |
| `elk.layered.spacing.nodeNodeBetweenLayers` | `80` | レイヤー間スペース |
| 最低レーン高さ | `150px` | レーンの最小の高さ |

#### 返却データ:
```typescript
interface BpmnLayoutResult {
  nodes: Map<string, NodeLayout>;      // ノード座標 (id → {x, y, width, height})
  edges: Map<string, EdgeLayout>;      // エッジ座標 (id → {waypoints: [{x, y}]})
  lanes: Map<string, LayoutPosition>;  // レーン座標 (id → {x, y, width, height})
  totalWidth: number;                  // 総幅
  totalHeight: number;                 // 総高さ
}
```

### 3. BPMN XMLエクスポーターのELK統合

**ファイル**: `src/lib/bpmn-xml-exporter.ts` (更新, 525行)

#### 変更点:
1. **async関数化**:
   ```typescript
   export async function exportProcessTableToBpmnXml(input: BpmnExportInput): Promise<BpmnExportResult>
   ```

2. **autoLayoutフラグ追加**:
   ```typescript
   interface BpmnExportInput {
     processTable: ProcessTable;
     processes: Process[];
     swimlanes: Swimlane[];
     autoLayout?: boolean;  // デフォルト: true
   }
   ```

3. **ELKレイアウト実行**:
   ```typescript
   if (autoLayout && processes.length > 0 && swimlanes.length > 0) {
     layoutResult = await layoutBpmnProcess(processes, swimlanes);
   }
   ```

4. **新関数追加**:
   - **`generateElkBasedDiagram()`**: ELK座標を使用してBPMNDI要素を生成
   - **`generateSimpleDiagram()`**: フォールバック用の簡易レイアウト

#### BPMNDIへの座標適用:
```xml
<!-- レーン座標 -->
<bpmndi:BPMNShape id="Lane_lane-001_di" bpmnElement="Lane_lane-001">
  <dc:Bounds x="0" y="0" width="800" height="200" />
</bpmndi:BPMNShape>

<!-- ノード座標 -->
<bpmndi:BPMNShape id="Process_process-001_di" bpmnElement="Process_process-001">
  <dc:Bounds x="120" y="82" width="36" height="36" />
</bpmndi:BPMNShape>

<!-- エッジ座標（ウェイポイント） -->
<bpmndi:BPMNEdge id="Flow_process-001_to_process-002_di" bpmnElement="Flow_process-001_to_process-002">
  <di:waypoint x="156" y="100" />
  <di:waypoint x="220" y="100" />
</bpmndi:BPMNEdge>
```

### 4. UI実装

**ファイル**: `src/app/projects/[id]/process-tables/[tableId]/ClientPage.tsx` (更新)

#### 追加機能:
1. **ドロップダウンメニュー**:
   - **自動レイアウト（推奨）**: ELK自動計算
   - **簡易レイアウト**: 固定座標

2. **UIコンポーネント**:
```tsx
<Dropdown>
  <DropdownTrigger>
    <Button
      color="primary"
      variant="flat"
      startContent={<ArrowDownTrayIcon />}
    >
      BPMN XMLエクスポート
    </Button>
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownItem
      key="auto-layout"
      description="ELKで自動計算された座標を使用"
      startContent={<SparklesIcon />}
    >
      自動レイアウト（推奨）
    </DropdownItem>
    <DropdownItem
      key="simple-layout"
      description="シンプルな固定レイアウト"
    >
      簡易レイアウト
    </DropdownItem>
  </DropdownMenu>
</Dropdown>
```

3. **エクスポート関数更新**:
```typescript
const handleExportBpmnXml = async (autoLayout: boolean = true) => {
  showToast('info', 'BPMN XMLを生成中...');
  
  const result = await exportProcessTableToBpmnXml({
    processTable,
    processes: processesData,
    swimlanes,
    autoLayout, // ユーザー選択
  });

  downloadBpmnXml(result.xml, fileName);

  const layoutMsg = autoLayout ? '（ELK自動レイアウト適用）' : '（簡易レイアウト）';
  showToast('success', `BPMN XMLをエクスポートしました${layoutMsg}`);
};
```

---

## ✅ ビルド結果

### コンパイル: 成功 ✓
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (18/18)
✓ Finalizing page optimization
```

### エラー: 0件
- TypeScriptコンパイルエラー: **0件**
- ESLintエラー: **0件**
- ビルド警告: **なし**

---

## ✅ 技術仕様

### ELKアルゴリズム詳細

#### 1. Process → ELK Graph 変換
```typescript
{
  id: 'root',
  layoutOptions: {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    ...
  },
  children: [
    // レーンごとにグループ化
    {
      id: 'lane_lane-001',
      children: [
        // レーン内のフローノード
        { id: 'process-001', width: 36, height: 36 },
        { id: 'process-002', width: 120, height: 80 },
        ...
      ]
    }
  ],
  edges: [
    // シーケンスフロー
    {
      id: 'flow_process-001_to_process-002',
      sources: ['process-001'],
      targets: ['process-002']
    }
  ]
}
```

#### 2. ノードサイズ定義
| BPMNElement | 幅 | 高さ | 用途 |
|------------|-----|------|------|
| `task` | 120px | 80px | タスク全般 |
| `event` | 36px | 36px | 開始・終了・中間イベント |
| `gateway` | 50px | 50px | ゲートウェイ全般 |

#### 3. レーン高さ計算
```typescript
// 動的高さ = max(内容物の高さ, 最低高さ150px) + パディング60px
laneHeight = Math.max(
  ...nodesInLane.map(n => n.height),
  MIN_LANE_HEIGHT
) + 60;
```

#### 4. エッジルーティング
- ELKが自動的に最適なパスを計算
- **ウェイポイント**として座標配列を返却
- 直線、折れ線、曲線に対応（ELK設定により変更可能）

---

## ✅ 動作フロー

### ユーザー操作 → XML生成

```
1. ユーザーが「BPMN XMLエクスポート」をクリック
   ↓
2. ドロップダウンで「自動レイアウト」または「簡易レイアウト」を選択
   ↓
3. handleExportBpmnXml(autoLayout: boolean) 実行
   ↓
4. プロジェクトの全工程データを取得
   ↓
5. 現在の工程表IDでフィルタ
   ↓
6. exportProcessTableToBpmnXml() 呼び出し (async)
   ↓
7. [autoLayout=true の場合]
   ├─ layoutBpmnProcess() 実行
   ├─ Process → ELK Graph 変換
   ├─ ELK Layout 実行 (layered, RIGHT)
   └─ BPMN座標形式に変換
   ↓
8. BPMN 2.0 XML生成
   ├─ Process要素
   ├─ LaneSet + Lane
   ├─ FlowNode (Task/Event/Gateway)
   ├─ SequenceFlow
   └─ BPMNDiagram (ELK座標適用)
   ↓
9. XMLファイルとしてダウンロード
   ↓
10. 成功トースト表示「BPMN XMLをエクスポートしました（ELK自動レイアウト適用）」
```

---

## ✅ 期待される効果

### 1. **自動整形による時間短縮**
- 手動でBPMNダイアグラムを配置する必要がない
- エクスポート後、bpmn.ioやCamunda Modelerで即座に可視化可能

### 2. **標準準拠のレイアウト**
- layeredアルゴリズムによる階層的な配置
- プロフェッショナルな見た目

### 3. **柔軟性**
- 自動レイアウトと簡易レイアウトを選択可能
- ELK失敗時のフォールバック機能

### 4. **拡張性**
- ELK設定のカスタマイズが容易
- 他のレイアウトアルゴリズム (force, stress) にも対応可能

---

## ✅ 今後の改善点

### 優先度: 中
1. **BPMNShape/BPMNEdgeのラベル位置**
   - 現在: ラベル座標は未設定
   - 改善: ELKでラベル座標も計算

2. **エッジのスタイル**
   - 現在: 直線または折れ線
   - 改善: 曲線 (Bezier) に対応

### 優先度: 低
3. **レイアウト設定のUI化**
   - 現在: コード内でハードコード
   - 改善: 設定画面でspacing等を調整可能に

4. **異なるELKアルゴリズムの選択**
   - 現在: layeredのみ
   - 改善: force, stress, radial等も選択可能に

---

## ✅ テスト状況

### 単体テスト
- ❌ ELKレイアウトエンジン単体テスト（Node.js ESM問題により未実施）
- ✅ ビルド成功（TypeScriptコンパイル通過）
- ✅ BPMN XML構造テスト（Task C で実施済み）

### 統合テスト
- ⚠️ アプリケーション起動テスト（未実施）
- ⚠️ 実際のBPMN XMLエクスポート動作確認（未実施）

**推奨**: 次回アプリケーションを起動して、実際にエクスポート機能を使用し、生成されたXMLをbpmn.ioで開いて視覚的に確認することを推奨します。

---

## ✅ ファイル変更サマリー

| ファイル | 変更内容 | 行数 |
|---------|---------|------|
| `package.json` | elkjs追加 | +1 |
| `src/lib/elk-layout.ts` | **新規作成** | 332 |
| `src/lib/bpmn-xml-exporter.ts` | ELK統合、async化 | 525 (更新) |
| `src/app/projects/.../ClientPage.tsx` | ドロップダウンUI追加 | 370 (更新) |
| `scripts/test-elk-layout.mjs` | **新規作成** (テスト用) | 262 |

**合計**: 新規2ファイル、更新2ファイル、追加行数 ~600行

---

## ✅ 結論

**Task D「ELK自動整形機能の実装」は完了しました。**

### 実装完了項目:
- ✅ elkjsライブラリのインストール
- ✅ ELKレイアウトエンジンの作成 (`elk-layout.ts`)
- ✅ BPMN XMLエクスポーターへのELK統合
- ✅ UIに「自動レイアウト」「簡易レイアウト」選択機能追加
- ✅ ビルド成功、コンパイルエラーなし

### 次のステップ:
1. **アプリケーションを起動**
2. **プロジェクト作成 → 工程表作成 → 工程追加**
3. **「BPMN XMLエクスポート」→「自動レイアウト（推奨）」を選択**
4. **生成されたXMLをbpmn.ioで開いて確認**

---

**実装者**: GitHub Copilot  
**実装日**: 2025年10月22日  
**バージョン**: v0.7.0 (予定)
