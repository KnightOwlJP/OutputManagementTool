/**
 * BPMNフローノードの座標を自動計算するレイアウトエンジン
 * ELK の代わりに要件に沿った独自配置ルールを実装:
 * - 同一スイムレーン内は基本的に水平方向に並べる
 * - 同一スイムレーン内で垂直方向に並ぶのは、並列許可かつ前工程集合が同じものだけ
 * - ランク（X方向）は前工程の最大ランク+1、前工程なしは0
 */

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

const MIN_LANE_HEIGHT = 180; // 最低レーン高さ
const LEFT_PADDING = 80;
const RIGHT_PADDING = 80;
const LANE_TOP_PADDING = 30;
const LANE_BOTTOM_PADDING = 30;
const H_SPACING = 220; // 水平方向の並び間隔
const PARALLEL_V_SPACING = 110; // 同一ランク内での縦並び間隔
const EDGE_HORIZONTAL_OFFSET = 24; // エッジを曲げる際の水平オフセット
const EDGE_LANE_CLEARANCE = 10; // レーン上部に逃がすクリアランス
const EDGE_VERTICAL_CLEARANCE = 30; // ノードを避けるために上方向へ持ち上げる量
const EDGE_TRACK_SPACING = 12; // レーン上部を使う際のトラック間隔

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
  return computeManualLayout(processes, swimlanes);
}

/**
 * ProcessデータをELKグラフ形式に変換
 */
// =============================================================
// 手動レイアウト実装
// =============================================================

type RankMap = Map<string, number>;

function computeRanks(processes: Process[]): RankMap {
  const rankMap: RankMap = new Map();
  const processMap = new Map(processes.map(p => [p.id, p]));
  const predsMap = new Map<string, string[]>(
    processes.map(p => [p.id, (p.beforeProcessIds || []).filter(id => processMap.has(id))])
  );

  const unassigned = new Set(processes.map(p => p.id));

  const samePredKey = (p: Process) => {
    const preds = predsMap.get(p.id) || [];
    return preds.length === 0 ? '' : preds.slice().sort().join('|');
  };

  while (unassigned.size > 0) {
    let progress = false;

    for (const pid of Array.from(unassigned)) {
      const preds = predsMap.get(pid) || [];
      const allResolved = preds.every(pr => rankMap.has(pr));
      if (!allResolved) continue;

      const baseRank = preds.length === 0 ? 0 : Math.max(...preds.map(pr => (rankMap.get(pr) ?? 0) + 1));
      const proc = processMap.get(pid)!;

      if (proc.parallelAllowed && preds.length > 0) {
        const key = samePredKey(proc);
        const parallelGroup = Array.from(unassigned)
          .map(id => processMap.get(id)!)
          .filter(p => p.id === proc.id || (p.parallelAllowed && samePredKey(p) === key));

        parallelGroup.forEach(p => {
          rankMap.set(p.id, baseRank);
          unassigned.delete(p.id);
        });
      } else {
        rankMap.set(pid, baseRank);
        unassigned.delete(pid);
      }

      progress = true;
    }

    if (!progress) {
      // サイクルなどで進まない場合は残りを順番に配置
      for (const pid of Array.from(unassigned)) {
        rankMap.set(pid, (rankMap.size === 0 ? 0 : Math.max(...rankMap.values()) + 1));
        unassigned.delete(pid);
      }
    }
  }

  return rankMap;
}

function computeManualLayout(processes: Process[], swimlanes: Swimlane[]): BpmnLayoutResult {
  const ranks = computeRanks(processes);
  const maxRank = Math.max(...Array.from(ranks.values()), 0);

  const nodes = new Map<string, NodeLayout>();
  const lanes = new Map<string, LayoutPosition>();
  const edges = new Map<string, EdgeLayout>();

  // スイムレーン順を order でソート
  const sortedLanes = [...swimlanes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  let currentY = 0;
  let totalWidth = LEFT_PADDING + RIGHT_PADDING + (maxRank + 1) * H_SPACING + NODE_SIZES.task.width;
  let totalHeight = 0;

  sortedLanes.forEach(lane => {
    const laneProcesses = processes.filter(p => p.laneId === lane.id);

    // ランク→同一ランク内ノード配列
    const laneByRank = new Map<number, Process[]>();
    laneProcesses.forEach(p => {
      const r = ranks.get(p.id) ?? 0;
      if (!laneByRank.has(r)) laneByRank.set(r, []);
      laneByRank.get(r)!.push(p);
    });

    let laneHeight = MIN_LANE_HEIGHT;
    laneByRank.forEach(nodesAtRank => {
      // 並列を縦に並べる（並列許可かつ同じ前工程のものが同じランクに来ている）
      // それ以外でも同ランクが複数ある場合は縦に積む
      const verticalCount = nodesAtRank.length;
      const heightNeeded = LANE_TOP_PADDING + verticalCount * PARALLEL_V_SPACING + NODE_SIZES.task.height + LANE_BOTTOM_PADDING;
      laneHeight = Math.max(laneHeight, heightNeeded);
    });

    const laneTop = currentY;
    const lanePos: LayoutPosition = {
      x: 0,
      y: laneTop,
      width: totalWidth,
      height: laneHeight,
    };
    lanes.set(lane.id, lanePos);

    // ノード配置
    laneByRank.forEach((nodesAtRank, rank) => {
      nodesAtRank.sort((a, b) => a.name.localeCompare(b.name));
      nodesAtRank.forEach((p, idx) => {
        const size = getNodeSize(p);
        const x = LEFT_PADDING + rank * H_SPACING;
        const y = laneTop + LANE_TOP_PADDING + idx * PARALLEL_V_SPACING;

        nodes.set(p.id, {
          id: p.id,
          x,
          y,
          width: size.width,
          height: size.height,
        });
      });
    });

    currentY += laneHeight;
    totalHeight = Math.max(totalHeight, laneTop + laneHeight);
  });

  // エッジのウェイポイント（折れ線）。同一レーン間ではレーン上部のトラックを使いノード重なりを回避。
  const laneDetourUsage = new Map<string, number>();
  processes.forEach(p => {
    (p.nextProcessIds || []).forEach(targetId => {
      const sourceNode = nodes.get(p.id);
      const targetNode = nodes.get(targetId);
      if (!sourceNode || !targetNode) return;

      const startX = sourceNode.x + sourceNode.width;
      const startY = sourceNode.y + sourceNode.height / 2;
      const endX = targetNode.x;
      const endY = targetNode.y + targetNode.height / 2;

      const sameLane = p.laneId === processes.find(proc => proc.id === targetId)?.laneId;
      const sourceLane = p.laneId ? lanes.get(p.laneId) : undefined;

      if (sameLane && sourceLane) {
        const preX = startX + EDGE_HORIZONTAL_OFFSET;
        const postX = endX - EDGE_HORIZONTAL_OFFSET;
        const laneTop = sourceLane.y + EDGE_LANE_CLEARANCE;
        const maxTrackY = sourceLane.y + LANE_TOP_PADDING - EDGE_LANE_CLEARANCE;

        const used = laneDetourUsage.get(p.laneId) ?? 0;
        laneDetourUsage.set(p.laneId, used + 1);
        const trackY = Math.min(laneTop + used * EDGE_TRACK_SPACING, maxTrackY);
        const detourY = Math.min(trackY, Math.min(startY, endY) - EDGE_VERTICAL_CLEARANCE);

        const waypoints = [
          { x: startX, y: startY },
          { x: preX, y: startY },
          { x: preX, y: detourY },
          { x: postX, y: detourY },
          { x: postX, y: endY },
          { x: endX, y: endY },
        ];

        edges.set(`flow_${p.id}_to_${targetId}`, {
          id: `flow_${p.id}_to_${targetId}`,
          waypoints,
        });
        return;
      }

      // 異なるレーン間はシンプルな折れ線
      const midX = (startX + endX) / 2;
      const waypoints = [
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: endY },
        { x: endX, y: endY },
      ];

      edges.set(`flow_${p.id}_to_${targetId}`, {
        id: `flow_${p.id}_to_${targetId}`,
        waypoints,
      });
    });
  });

  return {
    nodes,
    edges,
    lanes,
    totalWidth,
    totalHeight,
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
  // 既存実装に統一
  return layoutBpmnProcess(processes, swimlanes);
}
