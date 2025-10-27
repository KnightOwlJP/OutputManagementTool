import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import { Process } from '@/types/models';

const elk = new ELK();

// BPMNノードのサイズ定義
const NODE_SIZES = {
  startEvent: { width: 36, height: 36 },
  endEvent: { width: 36, height: 36 },
  task: { width: 100, height: 80 },
  gateway: { width: 50, height: 50 },
  intermediateEvent: { width: 36, height: 36 },
};

// レイアウトオプション
const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.edgeNode': '40',
  'elk.spacing.edgeEdge': '20',
  'elk.layered.nodePlacement.strategy': 'SIMPLE',
};

interface BpmnElement {
  id: string;
  type: 'startEvent' | 'endEvent' | 'task' | 'gateway' | 'intermediateEvent';
  name: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  gatewayType?: 'exclusive' | 'parallel' | 'inclusive';
  eventType?: 'start' | 'end' | 'timer' | 'message' | 'error' | 'signal' | 'conditional';
}

interface BpmnFlow {
  id: string;
  sourceId: string;
  targetId: string;
  name?: string;
  condition?: string;
}

export interface BpmnLayout {
  elements: BpmnElement[];
  flows: BpmnFlow[];
}

/**
 * Process配列からBPMN要素とフローを抽出
 */
function extractBpmnElements(processes: Process[]): { elements: BpmnElement[]; flows: BpmnFlow[] } {
  const elements: BpmnElement[] = [];
  const flows: BpmnFlow[] = [];

  // 工程をdisplayOrderでソート
  const sortedProcesses = [...processes].sort((a, b) => a.displayOrder - b.displayOrder);

  // 開始イベントを追加
  elements.push({
    id: 'start-event',
    type: 'startEvent',
    name: '開始',
    ...NODE_SIZES.startEvent,
  });

  let previousId = 'start-event';

  // 各工程をBPMNタスクに変換
  sortedProcesses.forEach((process) => {
    const taskId = `task-${process.id}`;
    
    // ゲートウェイの処理
    if (process.bpmnElement === 'gateway' && process.gatewayType) {
      const gatewayId = `gateway-${process.id}`;
      elements.push({
        id: gatewayId,
        type: 'gateway',
        name: process.gatewayType === 'exclusive' ? 'XOR' : 
              process.gatewayType === 'parallel' ? '+' : 'O',
        gatewayType: process.gatewayType,
        ...NODE_SIZES.gateway,
      });
      
      // 前のノードからゲートウェイへ
      flows.push({
        id: `flow-${previousId}-${gatewayId}`,
        sourceId: previousId,
        targetId: gatewayId,
      });
      
      previousId = gatewayId;
    }

    // 中間イベントの処理
    if (process.bpmnElement === 'event' && process.eventType === 'intermediate' && process.intermediateEventType) {
      const eventId = `event-${process.id}`;
      elements.push({
        id: eventId,
        type: 'intermediateEvent',
        name: process.intermediateEventType || 'イベント',
        eventType: process.intermediateEventType as any,
        ...NODE_SIZES.intermediateEvent,
      });
      
      flows.push({
        id: `flow-${previousId}-${eventId}`,
        sourceId: previousId,
        targetId: eventId,
      });
      
      previousId = eventId;
    }

    // タスクノードを追加
    elements.push({
      id: taskId,
      type: 'task',
      name: process.name,
      ...NODE_SIZES.task,
    });

    // シーケンスフローを追加
    const flowId = `flow-${previousId}-${taskId}`;
    flows.push({
      id: flowId,
      sourceId: previousId,
      targetId: taskId,
    });

    previousId = taskId;

    // 条件付きフローの処理（分岐）
    if (process.conditionalFlows && Array.isArray(process.conditionalFlows)) {
      process.conditionalFlows.forEach((condFlow, cfIndex) => {
        if (condFlow.targetProcessId) {
          const targetTaskId = `task-${condFlow.targetProcessId}`;
          flows.push({
            id: `cond-flow-${process.id}-${cfIndex}`,
            sourceId: taskId,
            targetId: targetTaskId,
            name: condFlow.condition,
            condition: condFlow.condition,
          });
        }
      });
    }
  });

  // 終了イベントを追加
  const endId = 'end-event';
  elements.push({
    id: endId,
    type: 'endEvent',
    name: '終了',
    ...NODE_SIZES.endEvent,
  });

  flows.push({
    id: `flow-${previousId}-${endId}`,
    sourceId: previousId,
    targetId: endId,
  });

  return { elements, flows };
}

/**
 * ELKを使用してBPMN要素の自動レイアウトを計算
 */
export async function calculateBpmnLayout(processes: Process[]): Promise<BpmnLayout> {
  const { elements, flows } = extractBpmnElements(processes);

  // ELKグラフの構築
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: elements.map((elem) => ({
      id: elem.id,
      width: elem.width || NODE_SIZES.task.width,
      height: elem.height || NODE_SIZES.task.height,
    })),
    edges: flows.map((flow) => ({
      id: flow.id,
      sources: [flow.sourceId],
      targets: [flow.targetId],
    })),
  };

  try {
    // レイアウト計算を実行
    const layoutedGraph = await elk.layout(elkGraph);

    // 計算結果を要素に反映
    const layoutedElements = elements.map((elem) => {
      const node = layoutedGraph.children?.find((n) => n.id === elem.id);
      if (node) {
        return {
          ...elem,
          x: node.x,
          y: node.y,
        };
      }
      return elem;
    });

    return {
      elements: layoutedElements,
      flows,
    };
  } catch (error) {
    console.error('ELK layout calculation failed:', error);
    // フォールバック: シンプルな水平レイアウト
    return applySimpleLayout(elements, flows);
  }
}

/**
 * フォールバック: シンプルな水平レイアウト
 */
function applySimpleLayout(elements: BpmnElement[], flows: BpmnFlow[]): BpmnLayout {
  const HORIZONTAL_SPACING = 150;
  const VERTICAL_POSITION = 150;

  const layoutedElements = elements.map((elem, index) => ({
    ...elem,
    x: index * HORIZONTAL_SPACING + 50,
    y: VERTICAL_POSITION,
  }));

  return {
    elements: layoutedElements,
    flows,
  };
}

/**
 * Process配列からBPMN XMLを生成（レイアウト込み）
 */
export async function processToBpmnXml(processes: Process[], projectId: string): Promise<string> {
  const layout = await calculateBpmnLayout(processes);

  // BPMN XML生成
  const processElements = layout.elements
    .map((elem) => {
      const x = elem.x || 0;
      const y = elem.y || 0;
      const width = elem.width || NODE_SIZES.task.width;
      const height = elem.height || NODE_SIZES.task.height;

      if (elem.type === 'startEvent') {
        return `    <bpmn:startEvent id="${elem.id}" name="${elem.name}" />`;
      } else if (elem.type === 'endEvent') {
        return `    <bpmn:endEvent id="${elem.id}" name="${elem.name}" />`;
      } else if (elem.type === 'task') {
        return `    <bpmn:task id="${elem.id}" name="${elem.name}" />`;
      } else if (elem.type === 'gateway') {
        const gwType = elem.gatewayType || 'exclusive';
        if (gwType === 'exclusive') {
          return `    <bpmn:exclusiveGateway id="${elem.id}" name="${elem.name}" />`;
        } else if (gwType === 'parallel') {
          return `    <bpmn:parallelGateway id="${elem.id}" name="${elem.name}" />`;
        } else {
          return `    <bpmn:inclusiveGateway id="${elem.id}" name="${elem.name}" />`;
        }
      } else if (elem.type === 'intermediateEvent') {
        return `    <bpmn:intermediateCatchEvent id="${elem.id}" name="${elem.name}" />`;
      }
      return '';
    })
    .join('\n');

  const sequenceFlows = layout.flows
    .map((flow) => {
      const nameAttr = flow.name ? ` name="${flow.name}"` : '';
      return `    <bpmn:sequenceFlow id="${flow.id}" sourceRef="${flow.sourceId}" targetRef="${flow.targetId}"${nameAttr} />`;
    })
    .join('\n');

  const shapes = layout.elements
    .map((elem) => {
      const x = elem.x || 0;
      const y = elem.y || 0;
      const width = elem.width || NODE_SIZES.task.width;
      const height = elem.height || NODE_SIZES.task.height;

      return `      <bpmndi:BPMNShape id="${elem.id}_di" bpmnElement="${elem.id}">
        <dc:Bounds x="${x}" y="${y}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>`;
    })
    .join('\n');

  const edges = layout.flows
    .map((flow, index) => {
      const sourceElem = layout.elements.find((e) => e.id === flow.sourceId);
      const targetElem = layout.elements.find((e) => e.id === flow.targetId);

      if (!sourceElem || !targetElem) return '';

      const sourceX = (sourceElem.x || 0) + (sourceElem.width || 0);
      const sourceY = (sourceElem.y || 0) + (sourceElem.height || 0) / 2;
      const targetX = targetElem.x || 0;
      const targetY = (targetElem.y || 0) + (targetElem.height || 0) / 2;

      return `      <bpmndi:BPMNEdge id="${flow.id}_di" bpmnElement="${flow.id}">
        <di:waypoint x="${sourceX}" y="${sourceY}" />
        <di:waypoint x="${targetX}" y="${targetY}" />
      </bpmndi:BPMNEdge>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_${projectId}"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_${projectId}" isExecutable="false">
${processElements}
${sequenceFlows}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_${projectId}">
${shapes}
${edges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return xml;
}
