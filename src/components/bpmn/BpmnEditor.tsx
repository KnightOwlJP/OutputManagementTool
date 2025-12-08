'use client';

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { Button, Card, CardBody } from '@heroui/react';

interface BpmnEditorProps {
  projectId: string;
  diagramId?: string;
  initialXml?: string;
  onSave?: (xml: string) => void;
  onError?: (error: Error) => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

const EMPTY_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const BpmnEditor = memo(function BpmnEditor({
  projectId,
  diagramId,
  initialXml,
  onSave,
  onError,
  onUnsavedChanges,
}: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * BPMNモデラーの初期化
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: {
        bindTo: document,
      },
    });

    modelerRef.current = modeler;

    // XMLをロード
    const xmlToLoad = initialXml || EMPTY_BPMN;
    console.log('[BpmnEditor] Loading XML, length:', xmlToLoad?.length);
    console.log('[BpmnEditor] XML preview:', xmlToLoad?.substring(0, 500));
    
    modeler
      .importXML(xmlToLoad)
      .then(() => {
        console.log('[BpmnEditor] Successfully loaded BPMN diagram');
        const canvas = modeler.get('canvas') as any;
        canvas.zoom('fit-viewport');
        const viewbox = canvas.viewbox();
        canvas.viewbox({
          ...viewbox,
          x: viewbox.x - 60, // 左に余白を作り初期配置を少し右へ寄せる
        });
        setIsLoading(false);
      })
      .catch((err: any) => {
        console.error('Failed to load BPMN diagram:', err);
        console.error('Error message:', err?.message);
        console.error('Error stack:', err?.stack);
        console.error('Error warnings:', err?.warnings);
        if (onError) onError(err);
        setIsLoading(false);
      });

    // 変更検知
    const eventBus = modeler.get('eventBus') as any;
    const changeHandler = () => {
      setHasChanges(true);
      if (onUnsavedChanges) {
        onUnsavedChanges(true);
      }
    };

    eventBus.on('commandStack.changed', changeHandler);

    return () => {
      eventBus.off('commandStack.changed', changeHandler);
      modeler.destroy();
    };
  }, [initialXml, onError]);

  /**
   * 保存処理
   */
  const handleSave = useCallback(async () => {
    if (!modelerRef.current) return;

    setIsSaving(true);

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      const xml = result.xml;

      if (!xml) {
        throw new Error('Failed to generate XML');
      }

      if (onSave) {
        await onSave(xml);
      }

      setHasChanges(false);
      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to save BPMN diagram:', err);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onError]);

  /**
   * ズーム操作
   */
  const handleZoomIn = useCallback(() => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas') as any;
    canvas.zoom(canvas.zoom() + 0.1);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas') as any;
    canvas.zoom(canvas.zoom() - 0.1);
  }, []);

  const handleZoomReset = useCallback(() => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas') as any;
    canvas.zoom('fit-viewport');
  }, []);

  /**
   * 元に戻す/やり直し
   */
  const handleUndo = useCallback(() => {
    if (!modelerRef.current) return;
    const commandStack = modelerRef.current.get('commandStack') as any;
    if (commandStack.canUndo()) {
      commandStack.undo();
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (!modelerRef.current) return;
    const commandStack = modelerRef.current.get('commandStack') as any;
    if (commandStack.canRedo()) {
      commandStack.redo();
    }
  }, []);

  /**
   * XMLエクスポート
   */
  const handleExportXml = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveXML({ format: true });
      const xml = result.xml;

      if (!xml) {
        throw new Error('Failed to generate XML');
      }

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bpmn_diagram_${diagramId || 'new'}.bpmn`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export XML:', err);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  }, [diagramId, onError]);

  /**
   * SVGエクスポート
   */
  const handleExportSvg = useCallback(async () => {
    if (!modelerRef.current) return;

    try {
      const result = await modelerRef.current.saveSVG();
      const svg = result.svg;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bpmn_diagram_${diagramId || 'new'}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export SVG:', err);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  }, [diagramId, onError]);

  return (
    <div className="flex flex-col w-full" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
      {/* ツールバー */}
      <div className="mb-4">
        <Card>
          <CardBody className="py-3">
            <div className="flex items-center justify-between gap-4">
              {/* 左側: 編集操作 */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleUndo}
                  isDisabled={isLoading}
                >
                  元に戻す
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleRedo}
                  isDisabled={isLoading}
                >
                  やり直し
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleZoomIn}
                  isDisabled={isLoading}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleZoomOut}
                  isDisabled={isLoading}
                >
                  -
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleZoomReset}
                  isDisabled={isLoading}
                >
                  フィット
                </Button>
              </div>

              {/* 右側: 保存・エクスポート */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleExportXml}
                  isDisabled={isLoading}
                >
                  XML出力
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleExportSvg}
                  isDisabled={isLoading}
                >
                  SVG出力
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleSave}
                  isLoading={isSaving}
                  isDisabled={isLoading || !hasChanges}
                >
                  {isSaving ? '保存中...' : hasChanges ? '保存' : '保存済み'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* BPMNエディタコンテナ */}
      <div className="flex-1 min-h-0">
        <Card className="h-full">
          <CardBody className="p-0 h-full">
            <div
              ref={containerRef}
              className="w-full h-full bpmn-editor-container"
              style={{ position: 'relative', backgroundColor: '#ffffff' }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">BPMNエディタを読み込んでいます...</p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* bpmn-jsの背景色をオーバーライド */}
      <style jsx global>{`
        .bpmn-editor-container .djs-container {
          background-color: #ffffff !important;
        }
        .bpmn-editor-container .djs-palette {
          background-color: #fafafa !important;
        }
        .bpmn-editor-container svg {
          background-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
});
