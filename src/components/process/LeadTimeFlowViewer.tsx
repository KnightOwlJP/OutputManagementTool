'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardBody, Button, Tooltip, ButtonGroup } from '@heroui/react';
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon,
  ClockIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';
import type { Process, Swimlane } from '@/types/models';
import { TIME_UNIT_SECONDS, TIME_UNIT_LABELS, type TimeUnit } from '@/lib/common';

// ==========================================
// 型定義
// ==========================================

export type ViewMode = 'normal' | 'leadtime';

interface LeadTimeFlowViewerProps {
  processes: Process[];
  swimlanes: Swimlane[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onProcessClick?: (processId: string) => void;
  height?: string | number;
  className?: string;
  /** LT表示の時間スケール（1px = 何秒か） */
  timeScale?: number;
  /** LT表示の最小ボックス幅 */
  minBoxWidth?: number;
  /** LT表示の最大ボックス幅 */
  maxBoxWidth?: number;
}

// ==========================================
// 定数
// ==========================================

const LANE_HEIGHT = 80;
const LANE_HEADER_WIDTH = 150;
const PROCESS_HEIGHT = 50;
const PROCESS_GAP = 20;
const PROCESS_PADDING = 15;
const NORMAL_BOX_WIDTH = 120;
const MIN_LT_BOX_WIDTH = 60;
const MAX_LT_BOX_WIDTH = 400;
const DEFAULT_TIME_SCALE = 3600; // 1px = 1秒、デフォルト1時間=1px

// スイムレーンの色を取得（明度を上げた背景色）
const getLaneBackgroundColor = (color: string, alpha = 0.1): string => {
  return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
};

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * 秒数を人間が読みやすい形式に変換
 */
const formatDuration = (seconds: number | undefined, unit?: TimeUnit): string => {
  if (seconds === undefined || seconds === 0) return '-';
  
  if (unit && TIME_UNIT_SECONDS[unit]) {
    const value = seconds / TIME_UNIT_SECONDS[unit];
    return `${value.toFixed(1)}${TIME_UNIT_LABELS[unit]}`;
  }
  
  // 自動フォーマット
  if (seconds >= 86400) {
    return `${(seconds / 86400).toFixed(1)}日`;
  } else if (seconds >= 3600) {
    return `${(seconds / 3600).toFixed(1)}時間`;
  } else if (seconds >= 60) {
    return `${(seconds / 60).toFixed(0)}分`;
  }
  return `${seconds}秒`;
};

/**
 * LTに基づいてボックス幅を計算
 */
const calculateBoxWidth = (
  leadTimeSeconds: number | undefined,
  timeScale: number,
  minWidth: number,
  maxWidth: number
): number => {
  if (!leadTimeSeconds || leadTimeSeconds <= 0) {
    return minWidth;
  }
  const width = leadTimeSeconds / timeScale;
  return Math.max(minWidth, Math.min(maxWidth, width));
};

// ==========================================
// コンポーネント
// ==========================================

export const LeadTimeFlowViewer: React.FC<LeadTimeFlowViewerProps> = ({
  processes,
  swimlanes,
  viewMode = 'normal',
  onViewModeChange,
  onProcessClick,
  height = '600px',
  className = '',
  timeScale = DEFAULT_TIME_SCALE,
  minBoxWidth = MIN_LT_BOX_WIDTH,
  maxBoxWidth = MAX_LT_BOX_WIDTH,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // スイムレーンをorderでソート
  const sortedLanes = useMemo(() => {
    return [...swimlanes].sort((a, b) => a.order - b.order);
  }, [swimlanes]);

  // レーンIDからインデックスへのマップ
  const laneIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedLanes.forEach((lane, index) => {
      map.set(lane.id, index);
    });
    return map;
  }, [sortedLanes]);

  // 工程をdisplayOrderでソート
  const sortedProcesses = useMemo(() => {
    return [...processes].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [processes]);

  // 工程のレイアウト計算
  const layout = useMemo(() => {
    const positions: Map<string, { x: number; y: number; width: number }> = new Map();
    const laneXOffsets: Map<string, number> = new Map();

    // 各レーンの開始X位置を初期化
    sortedLanes.forEach(lane => {
      laneXOffsets.set(lane.id, LANE_HEADER_WIDTH + PROCESS_PADDING);
    });

    // 各工程の位置を計算
    sortedProcesses.forEach(process => {
      const laneIndex = laneIndexMap.get(process.laneId) ?? 0;
      const currentX = laneXOffsets.get(process.laneId) ?? LANE_HEADER_WIDTH + PROCESS_PADDING;
      
      // ボックス幅の計算
      let boxWidth = NORMAL_BOX_WIDTH;
      if (viewMode === 'leadtime') {
        boxWidth = calculateBoxWidth(
          process.leadTimeSeconds,
          timeScale,
          minBoxWidth,
          maxBoxWidth
        );
      }

      // Y位置はレーンの中央
      const y = laneIndex * LANE_HEIGHT + (LANE_HEIGHT - PROCESS_HEIGHT) / 2;

      positions.set(process.id, {
        x: currentX,
        y,
        width: boxWidth,
      });

      // 次の工程のX位置を更新
      laneXOffsets.set(process.laneId, currentX + boxWidth + PROCESS_GAP);
    });

    // キャンバス全体のサイズを計算
    let maxX = LANE_HEADER_WIDTH;
    laneXOffsets.forEach(x => {
      maxX = Math.max(maxX, x);
    });

    return {
      positions,
      width: maxX + PROCESS_PADDING,
      height: sortedLanes.length * LANE_HEIGHT,
    };
  }, [sortedProcesses, sortedLanes, laneIndexMap, viewMode, timeScale, minBoxWidth, maxBoxWidth]);

  // ズーム操作
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // パン操作
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 工程ノードのレンダリング
  const renderProcessNode = (process: Process) => {
    const pos = layout.positions.get(process.id);
    if (!pos) return null;

    const lane = sortedLanes.find(l => l.id === process.laneId);
    const bgColor = lane?.color || '#3B82F6';

    return (
      <g
        key={process.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        onClick={() => onProcessClick?.(process.id)}
        style={{ cursor: onProcessClick ? 'pointer' : 'default' }}
      >
        {/* ボックス */}
        <rect
          x={0}
          y={0}
          width={pos.width}
          height={PROCESS_HEIGHT}
          rx={4}
          ry={4}
          fill={bgColor}
          stroke={bgColor}
          strokeWidth={2}
          opacity={0.9}
        />
        
        {/* 工程名 */}
        <foreignObject x={4} y={4} width={pos.width - 8} height={PROCESS_HEIGHT - 8}>
          <div
            className="h-full flex flex-col justify-center text-white text-xs overflow-hidden"
            style={{ fontSize: '11px', lineHeight: '1.2' }}
          >
            <div className="font-medium truncate" title={process.name}>
              {process.name}
            </div>
            {viewMode === 'leadtime' && process.leadTimeSeconds && (
              <div className="text-white/80 mt-0.5" style={{ fontSize: '9px' }}>
                LT: {formatDuration(process.leadTimeSeconds, process.leadTimeUnit)}
              </div>
            )}
            {viewMode === 'normal' && process.workSeconds && (
              <div className="text-white/80 mt-0.5" style={{ fontSize: '9px' }}>
                工数: {formatDuration(process.workSeconds, process.workUnitPref)}
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  // 接続線のレンダリング
  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    sortedProcesses.forEach(process => {
      const fromPos = layout.positions.get(process.id);
      if (!fromPos || !process.nextProcessIds) return;

      process.nextProcessIds.forEach(nextId => {
        const toPos = layout.positions.get(nextId);
        if (!toPos) return;

        const startX = fromPos.x + fromPos.width;
        const startY = fromPos.y + PROCESS_HEIGHT / 2;
        const endX = toPos.x;
        const endY = toPos.y + PROCESS_HEIGHT / 2;

        // カーブの制御点
        const midX = (startX + endX) / 2;

        connections.push(
          <g key={`${process.id}-${nextId}`}>
            <path
              d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      });
    });

    return connections;
  };

  // 空データの場合
  if (processes.length === 0) {
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">工程データがありません</p>
            <p className="text-sm">工程を追加すると、フロー図が表示されます</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardBody className="p-0">
        {/* ツールバー */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              プロセスフロー図
            </span>
            <span className="text-xs text-gray-500">
              ({processes.length} 工程)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 表示モード切替 */}
            <ButtonGroup size="sm" variant="flat">
              <Tooltip content="通常表示">
                <Button
                  isIconOnly
                  color={viewMode === 'normal' ? 'primary' : 'default'}
                  onPress={() => onViewModeChange?.('normal')}
                >
                  <Square3Stack3DIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="LT表示（リードタイムで幅を表現）">
                <Button
                  isIconOnly
                  color={viewMode === 'leadtime' ? 'primary' : 'default'}
                  onPress={() => onViewModeChange?.('leadtime')}
                >
                  <ClockIcon className="w-4 h-4" />
                </Button>
              </Tooltip>
            </ButtonGroup>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* ズーム */}
            <Button isIconOnly size="sm" variant="light" onPress={handleZoomIn} title="拡大">
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </Button>
            <Button isIconOnly size="sm" variant="light" onPress={handleZoomOut} title="縮小">
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </Button>
            <Button isIconOnly size="sm" variant="light" onPress={handleZoomReset} title="リセット">
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-500 ml-1">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>

        {/* フロー図コンテナ */}
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-gray-50"
          style={{ height, cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            width="100%"
            height="100%"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <defs>
              {/* 矢印マーカー */}
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
              </marker>
            </defs>

            {/* スイムレーン背景 */}
            {sortedLanes.map((lane, index) => (
              <g key={lane.id}>
                {/* レーン背景 */}
                <rect
                  x={0}
                  y={index * LANE_HEIGHT}
                  width={layout.width}
                  height={LANE_HEIGHT}
                  fill={getLaneBackgroundColor(lane.color, index % 2 === 0 ? 0.05 : 0.1)}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />
                {/* レーンヘッダー */}
                <rect
                  x={0}
                  y={index * LANE_HEIGHT}
                  width={LANE_HEADER_WIDTH}
                  height={LANE_HEIGHT}
                  fill={getLaneBackgroundColor(lane.color, 0.2)}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />
                {/* レーン名 */}
                <foreignObject
                  x={8}
                  y={index * LANE_HEIGHT}
                  width={LANE_HEADER_WIDTH - 16}
                  height={LANE_HEIGHT}
                >
                  <div className="h-full flex items-center">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: lane.color }}
                      title={lane.name}
                    >
                      {lane.name}
                    </span>
                  </div>
                </foreignObject>
              </g>
            ))}

            {/* 接続線 */}
            {renderConnections()}

            {/* 工程ノード */}
            {sortedProcesses.map(renderProcessNode)}
          </svg>

          {/* LTモードの凡例 */}
          {viewMode === 'leadtime' && (
            <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg shadow-md px-3 py-2 text-xs">
              <div className="font-medium mb-1">LT表示モード</div>
              <div className="text-gray-600">
                ボックスの幅がリードタイムを表します
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LeadTimeFlowViewer;
