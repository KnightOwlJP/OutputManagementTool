# BPMN 2.0 XML出力可能性 - 分析レポート

## 📋 分析日時
2025年10月22日

## 🎯 分析対象
現在のデータモデルがBPMN 2.0 XML標準に準拠したXML出力が可能かを検証

---

## ✅ 実装済みの要素

### 1. **Process (bpmn:process)** ✅
- **現在の実装**: `ProcessTable`モデル
- **必須属性**: 
  - `id` ✅ (processTableId)
  - `name` ✅
  - `isExecutable` ⚠️ (未実装 - デフォルト値で対応可能)
- **評価**: 基本構造は実装済み

### 2. **Lane (bpmn:lane)** ✅
- **現在の実装**: `Swimlane`モデル
- **必須属性**:
  - `id` ✅
  - `name` ✅
- **追加情報**:
  - `color` ✅ (BPMN標準外だが拡張属性で対応可能)
  - `order` ✅ (レーン順序の復元に使用)
- **評価**: 完全実装済み、外部キー参照も正しく設定

### 3. **FlowNode要素** ✅

#### 3.1 Task (bpmn:task, bpmn:userTask等)
- **現在の実装**: `Process`モデル (`bpmnElement: 'task'`)
- **必須属性**:
  - `id` ✅
  - `name` ✅
  - `laneId` ✅ (lane参照)
- **タスクサブタイプ**: ✅
  - `taskType?: BpmnTaskType` で以下をサポート:
    - `userTask` ✅
    - `serviceTask` ✅
    - `manualTask` ✅
    - `scriptTask` ✅
    - `businessRuleTask` ✅
    - `sendTask` ✅
    - `receiveTask` ✅
- **評価**: 完全実装済み

#### 3.2 Event (bpmn:startEvent, bpmn:endEvent等)
- **現在の実装**: `Process`モデル (`bpmnElement: 'event'`)
- **イベントタイプ**: ✅
  - `eventType?: EventType` で以下をサポート:
    - `start` ✅ (開始イベント)
    - `end` ✅ (終了イベント)
    - `intermediate` ✅ (中間イベント)
- **中間イベント詳細**: ✅
  - `intermediateEventType?: IntermediateEventType`:
    - `timer` ✅
    - `message` ✅
    - `error` ✅
    - `signal` ✅
    - `conditional` ✅
- **追加フィールド**: ✅
  - `eventDetails?: string` (イベント詳細情報)
- **評価**: 完全実装済み

#### 3.3 Gateway (bpmn:exclusiveGateway等)
- **現在の実装**: `Process`モデル (`bpmnElement: 'gateway'`)
- **ゲートウェイタイプ**: ✅
  - `gatewayType?: GatewayType`:
    - `exclusive` ✅ (排他ゲートウェイ)
    - `parallel` ✅ (並列ゲートウェイ)
    - `inclusive` ✅ (包含ゲートウェイ)
- **評価**: 完全実装済み

### 4. **SequenceFlow (bpmn:sequenceFlow)** ✅
- **現在の実装**: `Process`モデルの関連フィールド
- **必須属性**:
  - `sourceRef` ✅ (`beforeProcessIds`から逆引き可能)
  - `targetRef` ✅ (`nextProcessIds`で指定)
- **条件付きフロー**: ✅
  - `conditionalFlows?: ConditionalFlow[]`
    - `targetProcessId` ✅
    - `condition` ✅
    - `description` ✅
- **評価**: 完全実装済み

### 5. **Documentation (bpmn:documentation)** ✅
- **現在の実装**: `Process.documentation?: string`
- **評価**: 実装済み

### 6. **DataObject (bpmn:dataObject)** ✅
- **現在の実装**: `DataObject`モデル + `Process`での参照
- **必須属性**:
  - `id` ✅
  - `name` ✅
  - `type` ✅
  - `description` ✅
- **Process側での参照**: ✅
  - `inputDataObjects?: string[]`
  - `outputDataObjects?: string[]`
- **評価**: 完全実装済み

### 7. **MessageFlow (bpmn:messageFlow)** ✅
- **現在の実装**: `MessageFlow`インターフェース + `Process.messageFlows`
- **必須属性**:
  - `targetProcessId` ✅
  - `messageContent` ✅
  - `description` ✅
- **評価**: 実装済み

### 8. **Artifact (bpmn:textAnnotation, bpmn:group)** ✅
- **現在の実装**: `Artifact`インターフェース + `Process.artifacts`
- **タイプ**:
  - `annotation` ✅
  - `group` ✅
- **評価**: 実装済み

---

## ⚠️ 不足している要素

### 1. **BPMNDiagram情報** ⚠️ 部分的実装
- **問題点**: 
  - 現在の`BpmnDiagram`モデルは`xmlContent`を文字列で保存
  - レイアウト情報(`layoutMetadata`)はあるが、個々の要素の座標情報が不明確
- **必要な情報**:
  - `bpmndi:BPMNShape` (各要素の位置とサイズ)
    - `dc:Bounds` (x, y, width, height)
  - `bpmndi:BPMNEdge` (フロー線の経路)
    - `di:waypoint` (x, y座標のリスト)
- **影響**: 
  - XML出力は可能だが、レイアウト情報がないと視覚的に見づらい
  - ただし、bpmn-jsライブラリが自動レイアウトを行うため実用上は問題なし
- **推奨対応**: 
  - 現状維持でOK
  - 将来的にレイアウト情報を保存する場合は`layoutMetadata`を活用

### 2. **Pool (bpmn:participant)** ❌ 意図的に未実装
- **状態**: ユーザー要望により削除済み
- **理由**: 
  - Pool は組織間/システム間の境界を表す高レベル概念
  - 本アプリケーションのスコープ外
  - Lane (Swimlane) で十分
- **影響**: なし (BPMN 2.0仕様上、Pool は必須ではない)

### 3. **Collaboration (bpmn:collaboration)** ❌ 未実装
- **用途**: 複数のProcess間のメッセージフローを管理
- **影響**: 
  - 単一Process内のモデリングは可能
  - 複数Process間の連携(MessageFlow)は`Process.messageFlows`で部分対応
- **推奨対応**: 
  - 現時点では不要
  - 将来的にマルチプロセス対応時に検討

### 4. **Signal/Error定義** ⚠️ 部分的実装
- **現状**: 
  - `intermediateEventType`で`signal`, `error`を指定可能
  - ただし、Signal/Errorの定義(`bpmn:signal`, `bpmn:error`)がない
- **影響**: 
  - イベントタイプは出力できるが、参照先の定義がない
  - BPMN 2.0的には不完全
- **推奨対応**: 
  - 新しいモデル追加: `SignalDefinition`, `ErrorDefinition`
  - または`eventDetails`にJSON形式で埋め込み

---

## 🔍 データベーススキーマ確認

### `processes`テーブル (最新)
```sql
CREATE TABLE processes (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  
  -- 基本情報
  name TEXT NOT NULL,
  lane_id TEXT NOT NULL,  -- ✅ FK to swimlanes
  
  -- BPMN要素識別
  bpmn_element TEXT NOT NULL DEFAULT 'task',  -- ✅ task/event/gateway
  task_type TEXT,  -- ✅ userTask/serviceTask等
  
  -- フロー制御
  before_process_ids TEXT,  -- ✅ JSON配列
  next_process_ids TEXT,    -- ✅ JSON配列
  
  -- BPMN詳細
  documentation TEXT,       -- ✅
  gateway_type TEXT,        -- ✅
  conditional_flows TEXT,   -- ✅ JSON配列
  
  -- イベント詳細
  event_type TEXT,                -- ✅
  intermediate_event_type TEXT,   -- ✅
  event_details TEXT,             -- ✅
  
  -- データ連携
  input_data_objects TEXT,   -- ✅ JSON配列
  output_data_objects TEXT,  -- ✅ JSON配列
  
  -- メッセージ・アーティファクト
  message_flows TEXT,  -- ✅ JSON配列
  artifacts TEXT,      -- ✅ JSON配列
  
  -- カスタム列
  custom_columns TEXT,  -- ✅ JSON
  
  -- メタデータ
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id) ON DELETE CASCADE,
  FOREIGN KEY (lane_id) REFERENCES process_table_swimlanes(id) ON DELETE CASCADE
);
```

**評価**: BPMN 2.0の主要要素をすべてカバー ✅

---

## 📤 XML出力マッピング表

| BPMN 2.0要素 | データモデル | マッピング | 状態 |
|-------------|------------|----------|------|
| `<bpmn:definitions>` | - | ルート要素 | ✅ 自動生成 |
| `<bpmn:process>` | `ProcessTable` | `id`, `name` | ✅ |
| `<bpmn:lane>` | `Swimlane` | `id`, `name`, lane内のFlowNode参照 | ✅ |
| `<bpmn:task>` | `Process` (bpmnElement='task') | `id`, `name`, taskType | ✅ |
| `<bpmn:userTask>` | `Process` (taskType='userTask') | id, name | ✅ |
| `<bpmn:serviceTask>` | `Process` (taskType='serviceTask') | id, name | ✅ |
| `<bpmn:startEvent>` | `Process` (bpmnElement='event', eventType='start') | id, name | ✅ |
| `<bpmn:endEvent>` | `Process` (bpmnElement='event', eventType='end') | id, name | ✅ |
| `<bpmn:intermediateCatchEvent>` | `Process` (eventType='intermediate') | id, name, eventDefinition | ✅ |
| `<bpmn:exclusiveGateway>` | `Process` (bpmnElement='gateway', gatewayType='exclusive') | id, name | ✅ |
| `<bpmn:parallelGateway>` | `Process` (gatewayType='parallel') | id, name | ✅ |
| `<bpmn:inclusiveGateway>` | `Process` (gatewayType='inclusive') | id, name | ✅ |
| `<bpmn:sequenceFlow>` | `Process.beforeProcessIds`, `nextProcessIds` | sourceRef, targetRef | ✅ |
| `<bpmn:conditionExpression>` | `ConditionalFlow.condition` | テキスト | ✅ |
| `<bpmn:documentation>` | `Process.documentation` | テキスト | ✅ |
| `<bpmn:dataObject>` | `DataObject` + `inputDataObjects`/`outputDataObjects` | id, name | ✅ |
| `<bpmn:messageFlow>` | `MessageFlow` | sourceRef, targetRef, messageContent | ✅ |
| `<bpmn:textAnnotation>` | `Artifact` (type='annotation') | text | ✅ |
| `<bpmn:group>` | `Artifact` (type='group') | categoryValueRef | ✅ |
| `<bpmndi:BPMNDiagram>` | `BpmnDiagram.layoutMetadata` | レイアウト情報 | ⚠️ 自動生成推奨 |
| `<bpmn:signal>` | - | 未実装 | ⚠️ |
| `<bpmn:error>` | - | 未実装 | ⚠️ |
| `<bpmn:participant>` (Pool) | - | 意図的に未実装 | ❌ |
| `<bpmn:collaboration>` | - | 未実装 | ❌ |

---

## 🎯 評価サマリー

### ✅ XML出力可能要素 (22/27)
1. Process ✅
2. Lane ✅
3. Task (全7種類) ✅
4. Event (全3種類+5種類の中間イベント) ✅
5. Gateway (全3種類) ✅
6. SequenceFlow ✅
7. ConditionalFlow ✅
8. Documentation ✅
9. DataObject ✅
10. MessageFlow ✅
11. Artifact (2種類) ✅

### ⚠️ 部分実装 (3/27)
1. BPMNDiagram (レイアウト情報) - 自動生成で対応可能
2. Signal定義 - eventDetailsで代用可能
3. Error定義 - eventDetailsで代用可能

### ❌ 未実装 (意図的) (2/27)
1. Pool/Participant - スコープ外
2. Collaboration - スコープ外

---

## 💡 推奨事項

### 1. **即座に実装可能** ✅
現在のデータ構造で以下のBPMN XML出力が可能:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://output-management-tool.local/bpmn">
  
  <bpmn:process id="{processTableId}" name="{processTableName}">
    
    <!-- Lanes (Swimlanes) -->
    <bpmn:laneSet id="LaneSet_{processTableId}">
      <bpmn:lane id="{swimlaneId}" name="{swimlaneName}">
        <bpmn:flowNodeRef>Process_{processId}</bpmn:flowNodeRef>
        ...
      </bpmn:lane>
    </bpmn:laneSet>
    
    <!-- FlowNodes: Tasks -->
    <bpmn:userTask id="Process_{processId}" name="{processName}">
      <bpmn:incoming>Flow_{sourceId}</bpmn:incoming>
      <bpmn:outgoing>Flow_{targetId}</bpmn:outgoing>
      <bpmn:documentation>{documentation}</bpmn:documentation>
    </bpmn:userTask>
    
    <!-- FlowNodes: Events -->
    <bpmn:startEvent id="Process_{processId}" name="{processName}">
      <bpmn:outgoing>Flow_{targetId}</bpmn:outgoing>
    </bpmn:startEvent>
    
    <!-- FlowNodes: Gateways -->
    <bpmn:exclusiveGateway id="Process_{processId}" name="{processName}">
      <bpmn:incoming>Flow_{sourceId}</bpmn:incoming>
      <bpmn:outgoing>Flow_{targetId1}</bpmn:outgoing>
      <bpmn:outgoing>Flow_{targetId2}</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    
    <!-- SequenceFlows -->
    <bpmn:sequenceFlow id="Flow_{id}" 
                       sourceRef="Process_{sourceId}" 
                       targetRef="Process_{targetId}">
      <bpmn:conditionExpression>{condition}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    
    <!-- DataObjects -->
    <bpmn:dataObject id="DataObject_{id}" name="{name}" />
    <bpmn:dataInputAssociation>
      <bpmn:sourceRef>DataObject_{id}</bpmn:sourceRef>
      <bpmn:targetRef>Process_{processId}</bpmn:targetRef>
    </bpmn:dataInputAssociation>
    
  </bpmn:process>
  
  <!-- Diagram情報 (自動生成) -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="{processTableId}">
      <!-- Shapes and Edges -->
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
  
</bpmn:definitions>
```

### 2. **ELK自動レイアウト実装** (優先度: 高)

#### 2.1 elkjsライブラリの導入
```bash
npm install elkjs
npm install --save-dev @types/elkjs  # TypeScript型定義
```

#### 2.2 実装ステップ

**Step 1: ELKグラフ変換関数** (`src/lib/elk-layout.ts`)
```typescript
import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';

interface ProcessLayoutInput {
  processes: Process[];
  swimlanes: Swimlane[];
}

export async function layoutProcesses(input: ProcessLayoutInput): Promise<LayoutResult> {
  const elk = new ELK();
  
  // 1. Process → ELK Nodeに変換
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    },
    children: input.processes.map(p => ({
      id: p.id,
      width: 100,
      height: 80,
      labels: [{ text: p.name }],
    })),
    edges: generateEdges(input.processes),
  };
  
  // 2. ELKレイアウト実行
  const layouted = await elk.layout(elkGraph);
  
  // 3. 結果をBPMN座標に変換
  return convertToLayoutResult(layouted);
}
```

**Step 2: BPMN座標反映** (`src/lib/bpmn-layout-applier.ts`)
```typescript
export function applyLayoutToBpmn(
  bpmnXml: string,
  layoutResult: LayoutResult
): string {
  // bpmn-moddleでXMLをパース
  // layoutResultの座標を各要素に適用
  // 更新されたXMLを返す
}
```

**Step 3: UI統合** (`src/components/bpmn/BpmnEditor.tsx`)
```tsx
const handleAutoLayout = async () => {
  const processes = await fetchProcesses(processTableId);
  const swimlanes = await fetchSwimlanes(processTableId);
  
  const layoutResult = await layoutProcesses({ processes, swimlanes });
  const updatedXml = applyLayoutToBpmn(currentXml, layoutResult);
  
  await modelerRef.current?.importXML(updatedXml);
};

// UIに自動整形ボタン追加
<Button onPress={handleAutoLayout}>自動整形</Button>
```

#### 2.3 レイアウトアルゴリズム選択
```typescript
const LAYOUT_ALGORITHMS = {
  layered: { // 階層型（推奨）
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
  },
  stress: { // 力学モデル
    'elk.algorithm': 'stress',
  },
  mrtree: { // ツリー型
    'elk.algorithm': 'mrtree',
  },
};
```

### 3. **将来的な拡張提案**

#### 3.1 Signal/Error定義テーブル (優先度: 中)
```sql
CREATE TABLE bpmn_signals (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id)
);

CREATE TABLE bpmn_errors (
  id TEXT PRIMARY KEY,
  process_table_id TEXT NOT NULL,
  error_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY (process_table_id) REFERENCES process_tables(id)
);
```

#### 3.2 レイアウト情報の詳細化 (優先度: 低)
```typescript
interface LayoutMetadata {
  shapes: {
    [processId: string]: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  edges: {
    [flowId: string]: {
      waypoints: Array<{ x: number; y: number }>;
    };
  };
}
```

### 4. **XML出力実装の推奨アプローチ**

1. **既存の`generateBpmnFromProcesses`を拡張**:
   - 現在は簡易実装 (`src/lib/document-sync.ts`)
   - 新しい`bpmnElement`, `laneId`フィールドに対応
   
2. **新しいBPMN XMLシリアライザの作成**:
   - ファイル: `src/lib/bpmn-serializer.ts`
   - 関数: `serializeProcessTableToBpmnXml()`
   - 完全なBPMN 2.0準拠XML生成

3. **bpmn-moddleライブラリの活用**:
   - オブジェクトモデル → XML変換
   - バリデーション機能
   - 既存のBPMNツールとの互換性保証

---

## 📅 実装ロードマップ

### Phase 1: BPMN XMLエクスポート基礎 (2-3日)
- [x] データ構造分析完了
- [ ] `src/lib/bpmn-xml-exporter.ts` 実装
- [ ] Process → BPMN XML変換ロジック
- [ ] エクスポートボタンUI追加

### Phase 2: ELK自動レイアウト (3-4日)
- [ ] elkjsライブラリ導入
- [ ] ELKグラフ変換実装
- [ ] レイアウト結果適用
- [ ] 自動整形ボタンUI追加
- [ ] アルゴリズム選択UI

### Phase 3: 高度なBPMN機能 (2-3日)
- [ ] Signal/Error定義
- [ ] Collaboration対応（将来）
- [ ] レイアウトメタデータ保存

---

## ✅ 結論

**現在のデータ構造は、BPMN 2.0 XMLの主要要素をほぼ完全にカバーしており、XML出力可能です。**

### 強み:
- ✅ FlowNode (Task/Event/Gateway) の完全サポート
- ✅ Lane (Swimlane) の外部キー参照による正しい関連付け
- ✅ SequenceFlow とConditionExpression
- ✅ DataObject、MessageFlow、Artifact

### 軽微な制約:
- ⚠️ レイアウト情報は自動生成に依存 (実用上問題なし)
- ⚠️ Signal/Error定義は`eventDetails`で代用可能

### XML出力実装の優先度:
**高 (すぐに実装可能かつ有用)**

次のステップ: `src/lib/bpmn-xml-exporter.ts` の実装を推奨します。
