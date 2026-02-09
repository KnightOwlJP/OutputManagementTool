'use client';

import React, { useMemo, useState, useRef } from 'react';
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
}

interface ProcessPosition {
  x: number;
  y: number;
  width: number;
  startTime: number;
  endTime: number;
}

interface TimeScale {
  unit: TimeUnit;
  unitLabel: string;
  unitSeconds: number;
  pixelsPerUnit: number;
  totalUnits: number;
  totalSeconds: number;
}

// ==========================================
// 定数
// ==========================================

const LANE_HEIGHT = 80;
const LANE_HEADER_WIDTH = 150;
const PROCESS_HEIGHT = 50;
const PROCESS_GAP = 10;
const PROCESS_PADDING = 20;
const NORMAL_BOX_WIDTH = 120;
const TIMELINE_HEIGHT = 40;
const MIN_BOX_WIDTH = 40;
const PIXELS_PER_UNIT = 80; // 1単位あたりのピクセル数

// スイムレーンの色を取得（明度を上げた背景色）
const getLaneBackgroundColor = (color: string, alpha = 0.1): string => {
  return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
};

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * 秒数を指定された単位で表示
 */
const formatDuration = (seconds: number | undefined, unit: TimeUnit): string => {
  if (seconds === undefined || seconds === 0) return '-';
  
  const unitSeconds = TIME_UNIT_SECONDS[unit];
  const value = seconds / unitSeconds;
  
  // 小数点以下の桁数を調整
  if (value >= 100) {
    return `${Math.round(value)}${TIME_UNIT_LABELS[unit]}`;
  } else if (value >= 10) {
    return `${value.toFixed(1)}${TIME_UNIT_LABELS[unit]}`;
  } else {
    return `${value.toFixed(2)}${TIME_UNIT_LABELS[unit]}`;
  }
};

/**
 * 工程データから適切な時間単位を選択
 */
const selectOptimalTimeUnit = (processes: Process[]): TimeUnit => {
  // 工程に設定されている単位を収集
  const unitCounts = new Map<TimeUnit, number>();
  let maxLeadTime = 0;

  processes.forEach(p => {
    if (p.leadTimeSeconds) {
      maxLeadTime = Math.max(maxLeadTime, p.leadTimeSeconds);
    }
    if (p.leadTimeUnit) {
      unitCounts.set(p.leadTimeUnit, (unitCounts.get(p.leadTimeUnit) || 0) + 1);
    }
  });

  // 最も多く使われている単位があればそれを使用
  let mostUsedUnit: TimeUnit | null = null;
  let maxCount = 0;
  unitCounts.forEach((count, unit) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedUnit = unit;
    }
  });

  if (mostUsedUnit && maxCount > 0) {
    return mostUsedUnit;
  }

  // 設定された単位がない場合は、最大リードタイムから適切な単位を選択
  if (maxLeadTime >= TIME_UNIT_SECONDS.months) {
    return 'months';
  } else if (maxLeadTime >= TIME_UNIT_SECONDS.weeks) {
    return 'weeks';
  } else if (maxLeadTime >= TIME_UNIT_SECONDS.days) {
    return 'days';
  } else if (maxLeadTime >= TIME_UNIT_SECONDS.hours) {
    return 'hours';
  } else if (maxLeadTime >= TIME_UNIT_SECONDS.minutes) {
    return 'minutes';
  }
  return 'hours'; // デフォルト
};

/**
 * 工程の開始時刻を計算（前工程終了位置から）
 * トポロジカルソートを使用して依存関係を解決
 */
const calculateProcessStartTimes = (
  processes: Process[]
): Map<string, { startTime: number; endTime: number }> => {
  const result = new Map<string, { startTime: number; endTime: number }>();
  const processMap = new Map(processes.map(p => [p.id, p]));
  
  // 入次数を計算（何個の前工程があるか）
  const inDegree = new Map<string, number>();
  const successors = new Map<string, string[]>();
  
  processes.forEach(p => {
    inDegree.set(p.id, 0);
    successors.set(p.id, []);
  });

  processes.forEach(p => {
    if (p.beforeProcessIds) {
      inDegree.set(p.id, p.beforeProcessIds.length);
    }
    if (p.nextProcessIds) {
      p.nextProcessIds.forEach(nextId => {
        const list = successors.get(p.id) || [];
        list.push(nextId);
        successors.set(p.id, list);
      });
    }
  });

  // 前工程がないものから処理開始（入次数0のノード）
  const queue: string[] = [];
  processes.forEach(p => {
    if ((inDegree.get(p.id) || 0) === 0) {
      queue.push(p.id);
      const leadTime = p.leadTimeSeconds || 0;
      result.set(p.id, { startTime: 0, endTime: leadTime });
    }
  });

  // BFSでトポロジカル順序に処理
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = processMap.get(currentId);
    const currentTiming = result.get(currentId);
    
    if (!current || !currentTiming) continue;

    const nextIds = successors.get(currentId) || [];
    nextIds.forEach(nextId => {
      const nextProcess = processMap.get(nextId);
      if (!nextProcess) return;

      // 次工程の開始時刻を更新（前工程の終了時刻の最大値）
      const existingTiming = result.get(nextId);
      const newStartTime = currentTiming.endTime;
      
      if (!existingTiming || newStartTime > existingTiming.startTime) {
        const leadTime = nextProcess.leadTimeSeconds || 0;
        result.set(nextId, {
          startTime: newStartTime,
          endTime: newStartTime + leadTime,
        });
      }

      // 入次数を減らす
      const newInDegree = (inDegree.get(nextId) || 1) - 1;
      inDegree.set(nextId, newInDegree);
      
      if (newInDegree === 0) {
        queue.push(nextId);
      }
    });
  }

  // まだ処理されていない工程（循環参照や孤立ノード）
  processes.forEach(p => {
    if (!result.has(p.id)) {
      const leadTime = p.leadTimeSeconds || 0;
      result.set(p.id, { startTime: 0, endTime: leadTime });
    }
  });

  return result;
};

/**
 * 時間軸スケールを計算
 */
const calculateTimeScale = (
  processes: Process[],
  processTimes: Map<string, { startTime: number; endTime: number }>,
  unit: TimeUnit
): TimeScale => {
  let maxEndTime = 0;
  processTimes.forEach(timing => {
    maxEndTime = Math.max(maxEndTime, timing.endTime);
  });

  // 最低でも1単位分は確保
  const unitSeconds = TIME_UNIT_SECONDS[unit];
  const totalUnits = Math.max(1, Math.ceil(maxEndTime / unitSeconds));
  
  return {
    unit,
    unitLabel: TIME_UNIT_LABELS[unit],
    unitSeconds,
    pixelsPerUnit: PIXELS_PER_UNIT,
    totalUnits,
    totalSeconds: totalUnits * unitSeconds,
  };
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

  // 適切な時間単位を選択
  const timeUnit = useMemo(() => {
    return selectOptimalTimeUnit(processes);
  }, [processes]);

  // 工程の開始・終了時刻を計算
  const processTimes = useMemo(() => {
    return calculateProcessStartTimes(sortedProcesses);
  }, [sortedProcesses]);

  // 時間軸スケールを計算
  const timeScale = useMemo(() => {
    return calculateTimeScale(processes, processTimes, timeUnit);
  }, [processes, processTimes, timeUnit]);

  // 工程のレイアウト計算
  const layout = useMemo(() => {
    const positions: Map<string, ProcessPosition> = new Map();

    if (viewMode === 'normal') {
      // 通常モード：各レーン内で順番に配置
      const laneXOffsets: Map<string, number> = new Map();
      sortedLanes.forEach(lane => {
        laneXOffsets.set(lane.id, LANE_HEADER_WIDTH + PROCESS_PADDING);
      });

      sortedProcesses.forEach(process => {
        const laneIndex = laneIndexMap.get(process.laneId) ?? 0;
        const currentX = laneXOffsets.get(process.laneId) ?? LANE_HEADER_WIDTH + PROCESS_PADDING;
        const y = laneIndex * LANE_HEIGHT + (LANE_HEIGHT - PROCESS_HEIGHT) / 2;

        positions.set(process.id, {
          x: currentX,
          y,
          width: NORMAL_BOX_WIDTH,
          startTime: 0,
          endTime: 0,
        });

        laneXOffsets.set(process.laneId, currentX + NORMAL_BOX_WIDTH + PROCESS_GAP);
      });

      let maxX = LANE_HEADER_WIDTH;
      laneXOffsets.forEach(x => {
        maxX = Math.max(maxX, x);
      });

      return {
        positions,
        width: maxX + PROCESS_PADDING,
        height: sortedLanes.length * LANE_HEIGHT,
        timelineWidth: 0,
      };
    } else {
      // リードタイムモード：時間軸に基づいて配置
      const timelineWidth = timeScale.totalUnits * timeScale.pixelsPerUnit;

      sortedProcesses.forEach(process => {
        const laneIndex = laneIndexMap.get(process.laneId) ?? 0;
        const timing = processTimes.get(process.id) || { startTime: 0, endTime: 0 };
        
        // 時間から位置を計算
        const startX = LANE_HEADER_WIDTH + PROCESS_PADDING + 
          (timing.startTime / timeScale.unitSeconds) * timeScale.pixelsPerUnit;
        
        // 幅はリードタイムに基づく
        const leadTimeSeconds = process.leadTimeSeconds || timeScale.unitSeconds * 0.5;
        const width = Math.max(
          MIN_BOX_WIDTH,
          (leadTimeSeconds / timeScale.unitSeconds) * timeScale.pixelsPerUnit
        );

        const y = TIMELINE_HEIGHT + laneIndex * LANE_HEIGHT + (LANE_HEIGHT - PROCESS_HEIGHT) / 2;

        positions.set(process.id, {
          x: startX,
          y,
          width,
          startTime: timing.startTime,
          endTime: timing.endTime,
        });
      });

      return {
        positions,
        width: LANE_HEADER_WIDTH + PROCESS_PADDING + timelineWidth + PROCESS_PADDING,
        height: TIMELINE_HEIGHT + sortedLanes.length * LANE_HEIGHT,
        timelineWidth,
      };
    }
  }, [sortedProcesses, sortedLanes, laneIndexMap, viewMode, processTimes, timeScale]);

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

  // 時間軸目盛りのレンダリング
  const renderTimeline = () => {
    if (viewMode !== 'leadtime') return null;

    const ticks: JSX.Element[] = [];
    const majorTickInterval = 1; // 1単位ごとにメジャー目盛り
    const minorTickInterval = 0.5; // 0.5単位ごとにマイナー目盛り

    for (let i = 0; i <= timeScale.totalUnits; i += minorTickInterval) {
      const x = LANE_HEADER_WIDTH + PROCESS_PADDING + i * timeScale.pixelsPerUnit;
      const isMajor = i % majorTickInterval === 0;

      ticks.push(
        <g key={`tick-${i}`}>
          {/* 目盛り線 */}
          <line
            x1={x}
            y1={isMajor ? TIMELINE_HEIGHT - 15 : TIMELINE_HEIGHT - 8}
            x2={x}
            y2={TIMELINE_HEIGHT}
            stroke={isMajor ? '#374151' : '#9CA3AF'}
            strokeWidth={isMajor ? 1.5 : 1}
          />
          {/* グリッド線（メジャー目盛りのみ） */}
          {isMajor && (
            <line
              x1={x}
              y1={TIMELINE_HEIGHT}
              x2={x}
              y2={TIMELINE_HEIGHT + sortedLanes.length * LANE_HEIGHT}
              stroke="#E5E7EB"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          {/* ラベル（メジャー目盛りのみ） */}
          {isMajor && (
            <text
              x={x}
              y={TIMELINE_HEIGHT - 20}
              textAnchor="middle"
              fontSize="11"
              fill="#374151"
              fontWeight={i === 0 ? 'bold' : 'normal'}
            >
              {i}{timeScale.unitLabel}
            </text>
          )}
        </g>
      );
    }

    return (
      <g>
        {/* 時間軸背景 */}
        <rect
          x={LANE_HEADER_WIDTH}
          y={0}
          width={layout.width - LANE_HEADER_WIDTH}
          height={TIMELINE_HEIGHT}
          fill="#F9FAFB"
        />
        {/* 時間軸ヘッダー */}
        <rect
          x={0}
          y={0}
          width={LANE_HEADER_WIDTH}
          height={TIMELINE_HEIGHT}
          fill="#F3F4F6"
        />
        <text
          x={LANE_HEADER_WIDTH / 2}
          y={TIMELINE_HEIGHT / 2 + 4}
          textAnchor="middle"
          fontSize="12"
          fill="#6B7280"
          fontWeight="medium"
        >
          時間軸
        </text>
        {/* 時間軸ライン */}
        <line
          x1={LANE_HEADER_WIDTH + PROCESS_PADDING}
          y1={TIMELINE_HEIGHT}
          x2={layout.width - PROCESS_PADDING}
          y2={TIMELINE_HEIGHT}
          stroke="#374151"
          strokeWidth={2}
        />
        {ticks}
      </g>
    );
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
        
        {/* 工程名とリードタイム */}
        <foreignObject x={4} y={4} width={pos.width - 8} height={PROCESS_HEIGHT - 8}>
          <div
            className="h-full flex flex-col justify-center text-white overflow-hidden"
            style={{ fontSize: '11px', lineHeight: '1.2' }}
          >
            <div className="font-medium truncate" title={process.name}>
              {process.name}
            </div>
            {/* リードタイムを常に表示 */}
            {process.leadTimeSeconds && (
              <div 
                className="text-white/90 mt-0.5 font-medium" 
                style={{ fontSize: '10px' }}
              >
                LT: {formatDuration(process.leadTimeSeconds, timeUnit)}
              </div>
            )}
            {/* 通常モードでは工数も表示 */}
            {viewMode === 'normal' && process.workSeconds && (
              <div className="text-white/80" style={{ fontSize: '9px' }}>
                工数: {formatDuration(process.workSeconds, timeUnit)}
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

        // 同じレーン内か異なるレーンか
        const sameRow = Math.abs(startY - endY) < 5;

        if (sameRow) {
          // 同じ行：直線
          connections.push(
            <g key={`${process.id}-${nextId}`}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#6B7280"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        } else {
          // 異なる行：ベジェ曲線
          const midX = startX + (endX - startX) * 0.5;
          connections.push(
            <g key={`${process.id}-${nextId}`}>
              <path
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                fill="none"
                stroke="#6B7280"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        }
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
            {viewMode === 'leadtime' && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                単位: {TIME_UNIT_LABELS[timeUnit]}
              </span>
            )}
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
              <Tooltip content="LT表示（リードタイムで幅と位置を表現）">
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
            width={Math.max(layout.width * zoom, 800)}
            height={Math.max(layout.height * zoom, 400)}
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
                <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
              </marker>
            </defs>

            {/* 時間軸（LTモードのみ） */}
            {renderTimeline()}

            {/* スイムレーン背景 */}
            {sortedLanes.map((lane, index) => {
              const yOffset = viewMode === 'leadtime' ? TIMELINE_HEIGHT : 0;
              return (
                <g key={lane.id}>
                  {/* レーン背景 */}
                  <rect
                    x={0}
                    y={yOffset + index * LANE_HEIGHT}
                    width={layout.width}
                    height={LANE_HEIGHT}
                    fill={getLaneBackgroundColor(lane.color, index % 2 === 0 ? 0.05 : 0.1)}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                  />
                  {/* レーンヘッダー */}
                  <rect
                    x={0}
                    y={yOffset + index * LANE_HEIGHT}
                    width={LANE_HEADER_WIDTH}
                    height={LANE_HEIGHT}
                    fill={getLaneBackgroundColor(lane.color, 0.2)}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                  />
                  {/* レーン名 */}
                  <foreignObject
                    x={8}
                    y={yOffset + index * LANE_HEIGHT}
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
              );
            })}

            {/* 接続線 */}
            {renderConnections()}

            {/* 工程ノード */}
            {sortedProcesses.map(renderProcessNode)}
          </svg>

          {/* LTモードの凡例 */}
          {viewMode === 'leadtime' && (
            <div className="absolute bottom-4 right-4 bg-white/95 rounded-lg shadow-md px-3 py-2 text-xs border border-gray-200">
              <div className="font-medium text-gray-800 mb-1">LT表示モード</div>
              <ul className="text-gray-600 space-y-0.5">
                <li>• 横位置 = 開始タイミング</li>
                <li>• 横幅 = リードタイム</li>
                <li>• 前工程終了後に次工程開始</li>
              </ul>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LeadTimeFlowViewer;
