/**
 * ELK (Eclipse Layout Kernel) Auto-Layout Engine
 * 
 * BPMNフローノードの座標を自動計算するためのレイアウトエンジン
 */

import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import { Process, Swimlane } from '@/types/models';

// ==========================================
// 型定義
// ==========================================

export interface LayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeLayout extends LayoutPosition {
  id: string;
}

export interface EdgeLayout {
  id: string;
  waypoints: Array<{ x: number; y: number }>;
}

export interface BpmnLayoutResult {
  nodes: Map<string, NodeLayout>;
  edges: Map<string, EdgeLayout>;
  lanes: Map<string, LayoutPosition>;
  totalWidth: number;
  totalHeight: number;
}

// ==========================================
// 定数
// ==========================================

const NODE_SIZES = {
  task: { width: 120, height: 80 },
  event: { width: 36, height: 36 },
  gateway: { width: 50, height: 50 }
} as const;

const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '50',
  'elk.spacing.edgeNode': '30',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
} as const;

const MIN_LANE_HEIGHT = 150; // 最低レーン高さ

// ==========================================
// ELKレイアウトエンジン
// ==========================================

/**
 * BPMNプロセスをELKレイアウトでレイアウト
 */
export async function layoutBpmnProcess(
  processes: Process[],
  swimlanes: Swimlane[]
): Promise<BpmnLayoutResult> {
  const elk = new ELK();

  // ELKグラフに変換
  const elkGraph = convertToElkGraph(processes, swimlanes);

  // レイアウト実行
  const layoutedGraph = await elk.layout(elkGraph);

  // BPMN座標形式に変換
  const result = convertToBpmnLayout(layoutedGraph, processes, swimlanes);

  return result;
}

/**
 * ProcessデータをELKグラフ形式に変換
 */
function convertToElkGraph(
  processes: Process[],
  swimlanes: Swimlane[]
): ElkNode {
  // ルートノード（プロセス全体）
  const rootNode: ElkNode = {
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: [],
    edges: []
  };

  // スイムレーンごとにグループ化
  const laneChildren: Map<string, ElkNode[]> = new Map();

  processes.forEach(process => {
    const nodeSize = getNodeSize(process);
    
    const elkNode: ElkNode = {
      id: process.id,
      width: nodeSize.width,
      height: nodeSize.height,
      labels: process.name ? [{ text: process.name }] : undefined
    };

    // レーンごとにノードを分類
    if (!laneChildren.has(process.laneId)) {
      laneChildren.set(process.laneId, []);
    }
    laneChildren.get(process.laneId)!.push(elkNode);
  });

  // レーンをELKの子ノードとして追加
  swimlanes
    .sort((a, b) => a.order - b.order)
    .forEach(lane => {
      const nodesInLane = laneChildren.get(lane.id) || [];
      
      // レーン高さ計算: 内容物に応じて動的だが最低高さを保証
      const contentHeight = Math.max(
        ...nodesInLane.map(n => n.height || 0),
        MIN_LANE_HEIGHT
      );

      const laneNode: ElkNode = {
        id: `lane_${lane.id}`,
        children: nodesInLane,
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.padding': '[top=20,left=20,bottom=20,right=20]'
        },
        labels: [{ text: lane.name }],
        // レーン高さは内容物+パディングで自動計算されるが、最小値を設定
        height: contentHeight + 60 // パディング分を追加
      };

      rootNode.children!.push(laneNode);
    });

  // エッジ（シーケンスフロー）を追加
  const edges: ElkExtendedEdge[] = [];
  processes.forEach(process => {
    (process.nextProcessIds || []).forEach(targetId => {
      // エッジが同じレーン内か、異なるレーン間かを判定
      const targetProcess = processes.find(p => p.id === targetId);
      if (!targetProcess) return;

      edges.push({
        id: `flow_${process.id}_to_${targetId}`,
        sources: [process.id],
        targets: [targetId]
      });
    });
  });

  rootNode.edges = edges;

  return rootNode;
}

/**
 * レイアウト済みELKグラフをBPMN座標形式に変換
 */
function convertToBpmnLayout(
  layoutedGraph: ElkNode,
  processes: Process[],
  swimlanes: Swimlane[]
): BpmnLayoutResult {
  const nodes = new Map<string, NodeLayout>();
  const edges = new Map<string, EdgeLayout>();
  const lanes = new Map<string, LayoutPosition>();

  let totalWidth = 0;
  let totalHeight = 0;

  // レーンとノードの座標を抽出
  (layoutedGraph.children || []).forEach(laneNode => {
    const laneId = laneNode.id.replace('lane_', '');
    
    // レーン座標
    const lanePos: LayoutPosition = {
      x: laneNode.x || 0,
      y: laneNode.y || 0,
      width: laneNode.width || 0,
      height: laneNode.height || 0
    };
    lanes.set(laneId, lanePos);

    totalWidth = Math.max(totalWidth, lanePos.x + lanePos.width);
    totalHeight = Math.max(totalHeight, lanePos.y + lanePos.height);

    // レーン内のノード座標（レーン基準の相対座標→絶対座標に変換）
    (laneNode.children || []).forEach(node => {
      const nodeLayout: NodeLayout = {
        id: node.id,
        x: (laneNode.x || 0) + (node.x || 0),
        y: (laneNode.y || 0) + (node.y || 0),
        width: node.width || 0,
        height: node.height || 0
      };
      nodes.set(node.id, nodeLayout);
    });
  });

  // エッジのウェイポイントを抽出
  (layoutedGraph.edges || []).forEach(edge => {
    const waypoints: Array<{ x: number; y: number }> = [];

    // ELKのエッジセクション情報を使用
    if (edge.sections && edge.sections.length > 0) {
      const section = edge.sections[0];
      
      // 始点
      waypoints.push({
        x: section.startPoint.x,
        y: section.startPoint.y
      });

      // 中間点（ベンドポイント）
      if (section.bendPoints) {
        section.bendPoints.forEach(bp => {
          waypoints.push({ x: bp.x, y: bp.y });
        });
      }

      // 終点
      waypoints.push({
        x: section.endPoint.x,
        y: section.endPoint.y
      });
    } else {
      // セクション情報がない場合は、始点と終点を直線で結ぶ
      const sourceId = Array.isArray(edge.sources) ? edge.sources[0] : edge.sources;
      const targetId = Array.isArray(edge.targets) ? edge.targets[0] : edge.targets;
      
      const sourceNode = nodes.get(sourceId);
      const targetNode = nodes.get(targetId);

      if (sourceNode && targetNode) {
        waypoints.push({
          x: sourceNode.x + sourceNode.width / 2,
          y: sourceNode.y + sourceNode.height / 2
        });
        waypoints.push({
          x: targetNode.x + targetNode.width / 2,
          y: targetNode.y + targetNode.height / 2
        });
      }
    }

    edges.set(edge.id, { id: edge.id, waypoints });
  });

  return {
    nodes,
    edges,
    lanes,
    totalWidth,
    totalHeight
  };
}

/**
 * Processのタイプに応じたノードサイズを取得
 */
function getNodeSize(process: Process): { width: number; height: number } {
  switch (process.bpmnElement) {
    case 'task':
      return NODE_SIZES.task;
    case 'event':
      return NODE_SIZES.event;
    case 'gateway':
      return NODE_SIZES.gateway;
    default:
      return NODE_SIZES.task;
  }
}

/**
 * 手動レイアウト: 既存のプロセス配置を維持しつつ、未配置のものだけレイアウト
 * （将来的な拡張用）
 */
export async function layoutUnpositionedNodes(
  processes: Process[],
  swimlanes: Swimlane[],
  existingLayout?: Map<string, NodeLayout>
): Promise<BpmnLayoutResult> {
  // 未実装の場合は全体レイアウトにフォールバック
  return layoutBpmnProcess(processes, swimlanes);
}
