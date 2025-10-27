'use client';

import React, { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/Viewer';
import { Process } from '@/types/models';
import { processToBpmnXml } from '@/utils/processToBpmn';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { 
  MagnifyingGlassMinusIcon, 
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

interface BpmnViewerProps {
  processes: Process[];
  projectId: string;
  onElementClick?: (elementId: string) => void;
  height?: string | number;
  className?: string;
}

export const BpmnViewer: React.FC<BpmnViewerProps> = ({
  processes,
  projectId,
  onElementClick,
  height = '600px',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnJS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bpmnXml, setBpmnXml] = useState<string>('');

  // BPMNビューアの初期化
  useEffect(() => {
    if (!containerRef.current) return;

    // ビューアインスタンスの作成
    const viewer = new BpmnJS({
      container: containerRef.current,
      keyboard: {
        bindTo: document,
      },
    });

    viewerRef.current = viewer;

    // クリーンアップ
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Process配列からBPMN XMLを生成して表示
  useEffect(() => {
    const loadDiagram = async () => {
      if (!viewerRef.current || processes.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Process配列からBPMN XMLを生成
        const xml = await processToBpmnXml(processes, projectId);
        setBpmnXml(xml);

        // BPMNダイアグラムをインポート
        await viewerRef.current.importXML(xml);

        // キャンバスをフィット
        const canvas = viewerRef.current.get('canvas') as any;
        canvas.zoom('fit-viewport');

        setIsLoading(false);
      } catch (err) {
        console.error('BPMN diagram loading error:', err);
        setError(err instanceof Error ? err.message : 'BPMN図の読み込みに失敗しました');
        setIsLoading(false);
      }
    };

    loadDiagram();
  }, [processes, projectId]);

  // 要素クリックイベントの設定
  useEffect(() => {
    if (!viewerRef.current || !onElementClick) return;

    const eventBus = viewerRef.current.get('eventBus') as any;

    const handleElementClick = (event: any) => {
      const { element } = event;
      if (element && element.id) {
        onElementClick(element.id);
      }
    };

    eventBus.on('element.click', handleElementClick);

    return () => {
      eventBus.off('element.click', handleElementClick);
    };
  }, [onElementClick]);

  // ズーム操作
  const handleZoomIn = () => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas') as any;
    canvas.zoom(canvas.zoom() + 0.1);
  };

  const handleZoomOut = () => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas') as any;
    canvas.zoom(canvas.zoom() - 0.1);
  };

  const handleZoomReset = () => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas') as any;
    canvas.zoom('fit-viewport');
  };

  // SVGエクスポート
  const handleExportSvg = async () => {
    if (!viewerRef.current) return;

    try {
      const { svg } = await viewerRef.current.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `process-diagram-${projectId}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('SVG export error:', err);
      alert('SVGのエクスポートに失敗しました');
    }
  };

  // 空データの場合
  if (processes.length === 0) {
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">工程データがありません</p>
            <p className="text-sm">工程を追加すると、BPMN図が自動生成されます</p>
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
              BPMN プロセスフロー図
            </span>
            <span className="text-xs text-gray-500">
              ({processes.length} 工程)
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleZoomIn}
              title="拡大"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleZoomOut}
              title="縮小"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleZoomReset}
              title="フィット"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleExportSvg}
              title="SVGエクスポート"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* BPMNダイアグラムコンテナ */}
        <div className="relative" style={{ height }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">BPMN図を生成中...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium mb-2">エラー</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className="bpmn-container w-full h-full"
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </div>
      </CardBody>
    </Card>
  );
};
