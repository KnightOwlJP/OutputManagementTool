/**
 * BPMN 2.0 XMLエクスポーター
 * Processデータから標準的なBPMN 2.0 XML形式を生成
 */

import { Process, Swimlane, ProcessTable, ConditionalFlow } from '@/types/models';
import { layoutBpmnProcess, type BpmnLayoutResult } from './elk-layout';

function toRgb(color: string): { r: number; g: number; b: number } | null {
  const hex = color?.trim();
  const full = /^#?([0-9a-fA-F]{6})$/;
  const short = /^#?([0-9a-fA-F]{3})$/;
  if (full.test(hex)) {
    const [, body] = hex.match(full)!;
    return {
      r: parseInt(body.slice(0, 2), 16),
      g: parseInt(body.slice(2, 4), 16),
      b: parseInt(body.slice(4, 6), 16),
    };
  }
  if (short.test(hex)) {
    const [, body] = hex.match(short)!;
    return {
      r: parseInt(body[0] + body[0], 16),
      g: parseInt(body[1] + body[1], 16),
      b: parseInt(body[2] + body[2], 16),
    };
  }
  return null;
}

function lighten(color: string | undefined, ratio = 0.7): string {
  const rgb = color ? toRgb(color) : null;
  const base = rgb ?? { r: 229, g: 231, b: 235 }; // fallback: #e5e7eb
  const mix = (channel: number) => Math.round(channel + (255 - channel) * (1 - ratio));
  const r = mix(base.r);
  const g = mix(base.g);
  const b = mix(base.b);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function laneColors(color: string | undefined): { fill: string; stroke: string; font: string } {
  const stroke = color && toRgb(color) ? color : '#4b5563'; // gray-600 fallback
  return {
    fill: lighten(color, 0.75),
    stroke,
    font: '#111827', // gray-900 for readability
  };
}

// ==========================================
// ユーティリティ関数
// ==========================================

/**
 * XML特殊文字をエスケープ
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==========================================
// 型定義
// ==========================================

interface BpmnExportInput {
  processTable: ProcessTable;
  processes: Process[];
  swimlanes: Swimlane[];
  autoLayout?: boolean; // ELK自動レイアウトを適用するか（デフォルト: true）
}

interface BpmnExportResult {
  xml: string;
  processCount: number;
  laneCount: number;
}

/**
 * ProcessTableからBPMN 2.0 XMLを生成
 */
export async function exportProcessTableToBpmnXml(input: BpmnExportInput): Promise<BpmnExportResult> {
  const { processTable, processes, swimlanes, autoLayout = true } = input;

  console.log('[BPMN Export] Starting export with:', {
    processCount: processes.length,
    swimlaneCount: swimlanes.length,
    autoLayout,
  });

  // ELK自動レイアウトを実行（オプション）
  let layoutResult: BpmnLayoutResult | null = null;
  if (autoLayout && processes.length > 0 && swimlanes.length > 0) {
    try {
      layoutResult = await layoutBpmnProcess(processes, swimlanes);
      console.log('[BPMN Export] ELK layout completed:', {
        nodeCount: layoutResult.nodes.size,
        edgeCount: layoutResult.edges.size,
        laneCount: layoutResult.lanes.size,
      });
    } catch (error) {
      console.error('[BPMN Export] ELK layout failed, falling back to simple layout:', error);
      layoutResult = null;
    }
  }

  // XMLヘッダー
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_${processTable.id}"
                  targetNamespace="http://output-management-tool.local/bpmn"
                  exporter="Output Management Tool"
                  exporterVersion="0.7.0">
`;

  // Process要素
  xml += `  <bpmn:process id="Process_${processTable.id}" name="${escapeXml(processTable.name)}" isExecutable="false">
`;

  // LaneSet
  if (swimlanes.length > 0) {
    xml += `    <bpmn:laneSet id="LaneSet_${processTable.id}">
`;
    swimlanes.forEach((lane) => {
      // このレーンに属する工程を取得
      const laneProcesses = processes.filter((p) => p.laneId === lane.id);

      xml += `      <bpmn:lane id="Lane_${lane.id}" name="${escapeXml(lane.name)}">
`;
      if (laneProcesses.length > 0) {
        laneProcesses.forEach((p) => {
          xml += `        <bpmn:flowNodeRef>Process_${p.id}</bpmn:flowNodeRef>
`;
        });
      }
      xml += `      </bpmn:lane>
`;
    });
    xml += `    </bpmn:laneSet>
`;
  }

  // FlowNode要素（Task/Event/Gateway）
  processes.forEach((process) => {
    xml += generateFlowNode(process);
  });

  // SequenceFlow要素
  processes.forEach((process) => {
    if (process.nextProcessIds && process.nextProcessIds.length > 0) {
      process.nextProcessIds.forEach((targetId: string) => {
        const flowId = `Flow_${process.id}_${targetId}`;
        xml += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="Process_${process.id}" targetRef="Process_${targetId}" />
`;
      });
    }

    // 条件付きフロー
    if (process.conditionalFlows && process.conditionalFlows.length > 0) {
      process.conditionalFlows.forEach((cFlow: ConditionalFlow, index: number) => {
        const flowId = `ConditionalFlow_${process.id}_${cFlow.targetProcessId}_${index}`;
        xml += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="Process_${process.id}" targetRef="Process_${cFlow.targetProcessId}">
`;
        if (cFlow.condition) {
          xml += `      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(cFlow.condition)}</bpmn:conditionExpression>
`;
        }
        xml += `    </bpmn:sequenceFlow>
`;
      });
    }
  });

  xml += `  </bpmn:process>
`;

  // BPMNDiagram（レイアウト情報 - ELK自動レイアウト適用）
  xml += generateBpmnDiagram(processTable, processes, swimlanes, layoutResult);

  xml += `</bpmn:definitions>`;

  console.log('[BPMN Export] XML generation completed:', {
    xmlLength: xml.length,
    processCount: processes.length,
    laneCount: swimlanes.length,
  });

  // デバッグ: 生成されたXMLの一部をコンソールに出力
  if (processes.length > 0) {
    console.log('[BPMN Export] Generated XML (first 2000 chars):', xml.substring(0, 2000));
  }

  return {
    xml,
    processCount: processes.length,
    laneCount: swimlanes.length,
  };
}

/**
 * FlowNode（Task/Event/Gateway）を生成
 */
function generateFlowNode(process: Process): string {
  let xml = '';

  const incoming = getIncomingFlows(process);
  const outgoing = getOutgoingFlows(process);

  switch (process.bpmnElement) {
    case 'task':
      xml += generateTask(process, incoming, outgoing);
      break;
    case 'event':
      xml += generateEvent(process, incoming, outgoing);
      break;
    case 'gateway':
      xml += generateGateway(process, incoming, outgoing);
      break;
  }

  return xml;
}

/**
 * Task要素を生成
 */
function generateTask(process: Process, incoming: string[], outgoing: string[]): string {
  const taskType = process.taskType || 'userTask';
  let xml = `    <bpmn:${taskType} id="Process_${process.id}" name="${escapeXml(process.name)}">
`;

  incoming.forEach((flowId) => {
    xml += `      <bpmn:incoming>${flowId}</bpmn:incoming>
`;
  });

  outgoing.forEach((flowId) => {
    xml += `      <bpmn:outgoing>${flowId}</bpmn:outgoing>
`;
  });

  if (process.documentation) {
    xml += `      <bpmn:documentation>${escapeXml(process.documentation)}</bpmn:documentation>
`;
  }

  xml += `    </bpmn:${taskType}>
`;

  return xml;
}

/**
 * Event要素を生成
 */
function generateEvent(process: Process, incoming: string[], outgoing: string[]): string {
  const eventType = process.eventType || 'start';
  let elementName = '';

  switch (eventType) {
    case 'start':
      elementName = 'startEvent';
      break;
    case 'end':
      elementName = 'endEvent';
      break;
    case 'intermediate':
      elementName = 'intermediateCatchEvent';
      break;
  }

  let xml = `    <bpmn:${elementName} id="Process_${process.id}" name="${escapeXml(process.name)}">
`;

  incoming.forEach((flowId) => {
    xml += `      <bpmn:incoming>${flowId}</bpmn:incoming>
`;
  });

  outgoing.forEach((flowId) => {
    xml += `      <bpmn:outgoing>${flowId}</bpmn:outgoing>
`;
  });

  // 中間イベントの詳細
  if (eventType === 'intermediate' && process.intermediateEventType) {
    xml += `      <bpmn:${process.intermediateEventType}EventDefinition />
`;
  }

  if (process.eventDetails) {
    xml += `      <bpmn:documentation>${escapeXml(process.eventDetails)}</bpmn:documentation>
`;
  }

  xml += `    </bpmn:${elementName}>
`;

  return xml;
}

/**
 * Gateway要素を生成
 */
function generateGateway(process: Process, incoming: string[], outgoing: string[]): string {
  const gatewayType = process.gatewayType || 'exclusive';
  let elementName = '';

  switch (gatewayType) {
    case 'exclusive':
      elementName = 'exclusiveGateway';
      break;
    case 'parallel':
      elementName = 'parallelGateway';
      break;
    case 'inclusive':
      elementName = 'inclusiveGateway';
      break;
  }

  let xml = `    <bpmn:${elementName} id="Process_${process.id}" name="${escapeXml(process.name)}">
`;

  incoming.forEach((flowId) => {
    xml += `      <bpmn:incoming>${flowId}</bpmn:incoming>
`;
  });

  outgoing.forEach((flowId) => {
    xml += `      <bpmn:outgoing>${flowId}</bpmn:outgoing>
`;
  });

  if (process.documentation) {
    xml += `      <bpmn:documentation>${escapeXml(process.documentation)}</bpmn:documentation>
`;
  }

  xml += `    </bpmn:${elementName}>
`;

  return xml;
}

/**
 * 入力フローIDを取得
 */
function getIncomingFlows(process: Process): string[] {
  const flows: string[] = [];

  if (process.beforeProcessIds && process.beforeProcessIds.length > 0) {
    process.beforeProcessIds.forEach((sourceId: string) => {
      flows.push(`Flow_${sourceId}_${process.id}`);
    });
  }

  return flows;
}

/**
 * 出力フローIDを取得
 */
function getOutgoingFlows(process: Process): string[] {
  const flows: string[] = [];

  if (process.nextProcessIds && process.nextProcessIds.length > 0) {
    process.nextProcessIds.forEach((targetId: string) => {
      flows.push(`Flow_${process.id}_${targetId}`);
    });
  }

  if (process.conditionalFlows && process.conditionalFlows.length > 0) {
    process.conditionalFlows.forEach((cFlow: ConditionalFlow, index: number) => {
      flows.push(`ConditionalFlow_${process.id}_${cFlow.targetProcessId}_${index}`);
    });
  }

  return flows;
}

/**
 * BPMNDiagram（レイアウト情報）を生成
 * ELKレイアウト結果を使用、または簡易的な自動レイアウト
 */
function generateBpmnDiagram(
  processTable: ProcessTable,
  processes: Process[],
  swimlanes: Swimlane[],
  layoutResult: BpmnLayoutResult | null
): string {
  let xml = `  <bpmndi:BPMNDiagram id="BPMNDiagram_${processTable.id}">
    <bpmndi:BPMNLabelStyle id="LaneLabelStyle">
      <dc:Font color="#111827" size="12" />
    </bpmndi:BPMNLabelStyle>
    <bpmndi:BPMNPlane id="BPMNPlane_${processTable.id}" bpmnElement="Process_${processTable.id}">
`;

  if (layoutResult) {
    // ELKレイアウト結果を使用
    xml += generateElkBasedDiagram(processes, swimlanes, layoutResult);
  } else {
    // フォールバック: 簡易レイアウト
    xml += generateSimpleDiagram(processes, swimlanes);
  }

  xml += `    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
`;

  return xml;
}

/**
 * ELKレイアウト結果を使用してBPMNDI要素を生成
 */
function generateElkBasedDiagram(
  processes: Process[],
  swimlanes: Swimlane[],
  layout: BpmnLayoutResult
): string {
  let xml = '';

  // Lane形状
  swimlanes.forEach((lane) => {
    const laneLayout = layout.lanes.get(lane.id);
    if (laneLayout) {
      const colors = laneColors(lane.color);
      xml += `      <bpmndi:BPMNShape id="Lane_${lane.id}_di" bpmnElement="Lane_${lane.id}" bioc:fill="${colors.fill}" bioc:stroke="${colors.stroke}" bioc:fontcolor="${colors.font}" bpmndi:labelStyle="LaneLabelStyle">
        <dc:Bounds x="${Math.round(laneLayout.x)}" y="${Math.round(laneLayout.y)}" width="${Math.round(laneLayout.width)}" height="${Math.round(laneLayout.height)}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
`;
    }
  });

  // FlowNode形状
  processes.forEach((process) => {
    const nodeLayout = layout.nodes.get(process.id);
    if (nodeLayout) {
      xml += `      <bpmndi:BPMNShape id="Process_${process.id}_di" bpmnElement="Process_${process.id}">
        <dc:Bounds x="${Math.round(nodeLayout.x)}" y="${Math.round(nodeLayout.y)}" width="${Math.round(nodeLayout.width)}" height="${Math.round(nodeLayout.height)}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
`;
    }
  });

  // SequenceFlow形状（エッジ）
  processes.forEach((process) => {
    if (process.nextProcessIds && process.nextProcessIds.length > 0) {
      process.nextProcessIds.forEach((targetId: string) => {
        const flowId = `Flow_${process.id}_${targetId}`;
        const edgeLayout = layout.edges.get(`flow_${process.id}_to_${targetId}`);
        
        xml += `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
`;
        if (edgeLayout && edgeLayout.waypoints.length > 0) {
          edgeLayout.waypoints.forEach((wp) => {
            xml += `        <di:waypoint x="${Math.round(wp.x)}" y="${Math.round(wp.y)}" />
`;
          });
        } else {
          // フォールバック: 始点と終点の中心を結ぶ
          const sourceLayout = layout.nodes.get(process.id);
          const targetLayout = layout.nodes.get(targetId);
          if (sourceLayout && targetLayout) {
            const sourceX = sourceLayout.x + sourceLayout.width / 2;
            const sourceY = sourceLayout.y + sourceLayout.height / 2;
            const targetX = targetLayout.x + targetLayout.width / 2;
            const targetY = targetLayout.y + targetLayout.height / 2;
            xml += `        <di:waypoint x="${Math.round(sourceX)}" y="${Math.round(sourceY)}" />
`;
            xml += `        <di:waypoint x="${Math.round(targetX)}" y="${Math.round(targetY)}" />
`;
          }
        }
        xml += `      </bpmndi:BPMNEdge>
`;
      });
    }

    // 条件付きフロー
    if (process.conditionalFlows && process.conditionalFlows.length > 0) {
      process.conditionalFlows.forEach((cFlow: ConditionalFlow, index: number) => {
        const flowId = `ConditionalFlow_${process.id}_${cFlow.targetProcessId}_${index}`;
        const edgeLayout = layout.edges.get(`flow_${process.id}_to_${cFlow.targetProcessId}`);
        
        xml += `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
`;
        if (edgeLayout && edgeLayout.waypoints.length > 0) {
          edgeLayout.waypoints.forEach((wp) => {
            xml += `        <di:waypoint x="${Math.round(wp.x)}" y="${Math.round(wp.y)}" />
`;
          });
        } else {
          const sourceLayout = layout.nodes.get(process.id);
          const targetLayout = layout.nodes.get(cFlow.targetProcessId);
          if (sourceLayout && targetLayout) {
            const sourceX = sourceLayout.x + sourceLayout.width / 2;
            const sourceY = sourceLayout.y + sourceLayout.height / 2;
            const targetX = targetLayout.x + targetLayout.width / 2;
            const targetY = targetLayout.y + targetLayout.height / 2;
            xml += `        <di:waypoint x="${Math.round(sourceX)}" y="${Math.round(sourceY)}" />
`;
            xml += `        <di:waypoint x="${Math.round(targetX)}" y="${Math.round(targetY)}" />
`;
          }
        }
        xml += `      </bpmndi:BPMNEdge>
`;
      });
    }
  });

  return xml;
}

/**
 * 簡易レイアウト（ELK使用不可時のフォールバック）
 */
function generateSimpleDiagram(
  processes: Process[],
  swimlanes: Swimlane[]
): string {
  let xml = '';

  const nodeWidth = 100;
  const nodeHeight = 80;
  const horizontalSpacing = 150;
  const laneHeight = 200;
  const leftPadding = 80;

  let currentX = leftPadding;

  // Lane形状
  swimlanes.forEach((lane, laneIndex) => {
    const laneY = laneIndex * laneHeight;
    const colors = laneColors(lane.color);
    xml += `      <bpmndi:BPMNShape id="Lane_${lane.id}_di" bpmnElement="Lane_${lane.id}" bioc:fill="${colors.fill}" bioc:stroke="${colors.stroke}" bioc:fontcolor="${colors.font}" bpmndi:labelStyle="LaneLabelStyle">
        <dc:Bounds x="${leftPadding - 20}" y="${laneY}" width="1000" height="${laneHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
`;
  });

  // FlowNode形状
  processes.forEach((process) => {
    const laneIndex = swimlanes.findIndex((l) => l.id === process.laneId);
    const laneY = laneIndex >= 0 ? laneIndex * laneHeight : 0;
    const y = laneY + (laneHeight - nodeHeight) / 2;

    xml += `      <bpmndi:BPMNShape id="Process_${process.id}_di" bpmnElement="Process_${process.id}">
        <dc:Bounds x="${currentX}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
`;

    currentX += horizontalSpacing;
  });

  // SequenceFlow形状（簡易）
  processes.forEach((process) => {
    if (process.nextProcessIds && process.nextProcessIds.length > 0) {
      process.nextProcessIds.forEach((targetId: string) => {
        const flowId = `Flow_${process.id}_${targetId}`;
        xml += `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>
`;
      });
    }
  });

  return xml;
}

// ==========================================
// エクスポート関数
// ==========================================

/**
 * XMLファイルとしてダウンロード
 */
export function downloadBpmnXml(xml: string, fileName: string): void {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.bpmn') ? fileName : `${fileName}.bpmn`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
