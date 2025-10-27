/**
 * ドキュメント同期ユーティリティ（Phase 8 - 廃止予定）
 * 
 * ⚠️ Phase 9では使用されていません ⚠️
 * Phase 9では工程表（ProcessTable）ベースのアーキテクチャに変更され、
 * BPMNフロー図とマニュアルは工程表から自動生成されます。
 * 
 * このファイルはPhase 8の三位一体同期機能の実装で、現在は使用されていません。
 * 将来的に削除される予定です。
 */

import { Process, BpmnDiagram, ProcessLevel } from '@/types/project.types';

/**
 * 工程データからBPMN XMLのたたきを生成
 */
export function generateBpmnFromProcesses(processes: Process[], diagramName: string): string {
  // ルート工程（親がない工程）を取得
  const rootProcesses = processes.filter(p => !p.parentId);
  
  // BPMNのヘッダー
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="開始">
      <bpmn:outgoing>Flow_start</bpmn:outgoing>
    </bpmn:startEvent>
`;

  let flowId = 1;
  let taskId = 1;
  let lastElementId = 'StartEvent_1';
  let yPosition = 100;

  // 工程をBPMNタスクに変換
  processes.forEach((process, index) => {
    const taskElementId = `Task_${taskId++}`;
    const flowElementId = `Flow_${flowId++}`;

    xml += `    <bpmn:task id="${taskElementId}" name="${process.name}">
      <bpmn:incoming>${index === 0 ? 'Flow_start' : `Flow_${flowId - 2}`}</bpmn:incoming>
      <bpmn:outgoing>${flowElementId}</bpmn:outgoing>
    </bpmn:task>
`;
  });

  // 終了イベント
  xml += `    <bpmn:endEvent id="EndEvent_1" name="終了">
      <bpmn:incoming>Flow_${flowId - 1}</bpmn:incoming>
    </bpmn:endEvent>
`;

  // シーケンスフロー
  xml += `    <bpmn:sequenceFlow id="Flow_start" sourceRef="StartEvent_1" targetRef="Task_1" />
`;

  for (let i = 1; i < processes.length; i++) {
    xml += `    <bpmn:sequenceFlow id="Flow_${i}" sourceRef="Task_${i}" targetRef="Task_${i + 1}" />
`;
  }

  xml += `    <bpmn:sequenceFlow id="Flow_${processes.length}" sourceRef="Task_${processes.length}" targetRef="EndEvent_1" />
`;

  xml += `  </bpmn:process>
`;

  // BPMNダイアグラム情報（視覚的配置）
  xml += `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="82" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="160" y="125" width="22" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
`;

  // タスクの配置
  processes.forEach((process, index) => {
    const x = 250 + (index * 150);
    const y = 60;
    xml += `      <bpmndi:BPMNShape id="Task_${index + 1}_di" bpmnElement="Task_${index + 1}">
        <dc:Bounds x="${x}" y="${y}" width="100" height="80" />
      </bpmndi:BPMNShape>
`;
  });

  // 終了イベントの配置
  const endX = 250 + (processes.length * 150);
  xml += `      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${endX}" y="82" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${endX + 6}" y="125" width="22" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
`;

  // エッジ（フロー線）の配置
  xml += `      <bpmndi:BPMNEdge id="Flow_start_di" bpmnElement="Flow_start">
        <di:waypoint x="188" y="100" />
        <di:waypoint x="250" y="100" />
      </bpmndi:BPMNEdge>
`;

  processes.forEach((process, index) => {
    const startX = 350 + (index * 150);
    const endX = 400 + (index * 150);
    xml += `      <bpmndi:BPMNEdge id="Flow_${index + 1}_di" bpmnElement="Flow_${index + 1}">
        <di:waypoint x="${startX}" y="100" />
        <di:waypoint x="${endX}" y="100" />
      </bpmndi:BPMNEdge>
`;
  });

  xml += `    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return xml;
}

/**
 * BPMNから工程データのたたきを生成
 */
export function generateProcessesFromBpmn(
  xmlContent: string,
  projectId: string
): Array<{
  name: string;
  level: ProcessLevel;
  parentId?: string;
  description?: string;
}> {
  const processes: Array<{
    name: string;
    level: ProcessLevel;
    parentId?: string;
    description?: string;
  }> = [];

  try {
    // XMLをパース（簡易版）
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // タスクを抽出
    const tasks = xmlDoc.getElementsByTagName('bpmn:task');
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const name = task.getAttribute('name') || `工程${i + 1}`;
      
      processes.push({
        name,
        level: 'large', // デフォルトは大工程
        description: `BPMNから自動生成: ${name}`,
      });
    }
  } catch (error) {
    console.error('Failed to parse BPMN XML:', error);
  }

  return processes;
}

/**
 * 工程データからマニュアルのたたきを生成
 */
export function generateManualFromProcesses(processes: Process[]): {
  title: string;
  sections: Array<{
    title: string;
    content: string;
    order: number;
  }>;
} {
  // レベル別に工程を分類
  const largeProcesses = processes.filter(p => p.level === 'large');
  const mediumProcesses = processes.filter(p => p.level === 'medium');
  const smallProcesses = processes.filter(p => p.level === 'small');
  const detailProcesses = processes.filter(p => p.level === 'detail');

  const sections: Array<{
    title: string;
    content: string;
    order: number;
  }> = [];

  let order = 1;

  // 概要セクション
  sections.push({
    title: '概要',
    content: `このマニュアルは、${largeProcesses.length}個の大工程、${mediumProcesses.length}個の中工程、${smallProcesses.length}個の小工程、${detailProcesses.length}個の詳細工程から構成されています。\n\n各工程の詳細については、以下のセクションを参照してください。`,
    order: order++,
  });

  // 大工程ごとにセクションを作成
  largeProcesses.forEach((largeProcess) => {
    const children = processes.filter(p => p.parentId === largeProcess.id);
    
    let content = `## ${largeProcess.name}\n\n`;
    
    if (largeProcess.description) {
      content += `${largeProcess.description}\n\n`;
    }

    if (largeProcess.department) {
      content += `**担当部署**: ${largeProcess.department}\n\n`;
    }

    if (children.length > 0) {
      content += `### 含まれる工程\n\n`;
      children.forEach((child) => {
        content += `- ${child.name}`;
        if (child.assignee) {
          content += ` (担当: ${child.assignee})`;
        }
        content += '\n';
      });
    }

    sections.push({
      title: largeProcess.name,
      content,
      order: order++,
    });
  });

  // 詳細工程セクション
  if (detailProcesses.length > 0) {
    let content = '## 詳細作業手順\n\n';
    detailProcesses.forEach((detail, index) => {
      content += `### ${index + 1}. ${detail.name}\n\n`;
      if (detail.description) {
        content += `${detail.description}\n\n`;
      }
      if (detail.assignee) {
        content += `**担当者**: ${detail.assignee}\n\n`;
      }
      content += '---\n\n';
    });

    sections.push({
      title: '詳細作業手順',
      content,
      order: order++,
    });
  }

  return {
    title: '業務マニュアル',
    sections,
  };
}

/**
 * 同期状態を確認
 */
export async function checkSyncStatus(projectId: string): Promise<{
  hasBpmn: boolean;
  hasProcesses: boolean;
  hasManuals: boolean;
}> {
  try {
    // TODO: Phase 9では工程表ベースの構造に変更
    // const bpmns = await window.electronAPI.bpmn.getByProject(projectId);
    // const processes = await window.electronAPI.process.getByProject(projectId);
    // const manuals = await window.electronAPI.manual.getByProject(projectId);

    return {
      hasBpmn: false, // 一時的に無効化
      hasProcesses: false,
      hasManuals: false,
    };
  } catch (error) {
    console.error('Failed to check sync status:', error);
    return {
      hasBpmn: false,
      hasProcesses: false,
      hasManuals: false,
    };
  }
}

/**
 * 自動同期: BPMNまたは工程表が作成されたら、他のドキュメントのたたきを作成
 */
export async function autoSyncDocuments(
  projectId: string,
  trigger: 'bpmn' | 'process',
  options?: {
    processTableId?: string;
    bpmnDiagramTableId?: string;
    manualTableId?: string;
  }
): Promise<{
  bpmnCreated: boolean;
  processesCreated: boolean;
  manualCreated: boolean;
}> {
  const result = {
    bpmnCreated: false,
    processesCreated: false,
    manualCreated: false,
  };

  try {
    const status = await checkSyncStatus(projectId);

    if (trigger === 'bpmn' && status.hasBpmn) {
      // BPMNが作成された場合

      // 工程表がなければ作成
      if (!status.hasProcesses) {
        // TODO: Phase 9では工程表ベースに変更
        /*
        const bpmns = await window.electronAPI.bpmn.getByProject(projectId);
        if (bpmns.length > 0) {
          const bpmn = bpmns[0];
          const processTemplates = generateProcessesFromBpmn(bpmn.xmlContent, projectId);
          
          for (const template of processTemplates) {
            await window.electronAPI.process.create({
              projectId,
              processTableId: options?.processTableId || '', // 工程表IDを指定
              ...template,
            });
          }
          result.processesCreated = true;
        }
        */
      }

      // マニュアルがなければ作成
      if (!status.hasManuals) {
        // TODO: Phase 9では工程表ベースに変更
        /*
        const processes = await window.electronAPI.process.getByProject(projectId);
        // processTableIdでフィルタ（指定されている場合）
        const targetProcesses = options?.processTableId
          ? processes.filter(p => p.processTableId === options.processTableId)
          : processes;

        if (targetProcesses.length > 0) {
          // generateFromProcesses APIを使用して自動生成
          await window.electronAPI.manual.generateFromProcesses({
            projectId,
            title: '業務マニュアル',
            manualTableId: options?.manualTableId, // マニュアルグループIDを指定
            options: {
              includeDetailProcesses: true,
            },
          });
          result.manualCreated = true;
        }
        */
      }
    } else if (trigger === 'process' && status.hasProcesses) {
      // 工程表が作成された場合

      // BPMNがなければ作成
      if (!status.hasBpmn) {
        // TODO: Phase 9では工程表ベースに変更
        /*
        const processes = await window.electronAPI.process.getByProject(projectId);
        // processTableIdでフィルタ（指定されている場合）
        const targetProcesses = options?.processTableId
          ? processes.filter(p => p.processTableId === options.processTableId)
          : processes;

        if (targetProcesses.length > 0) {
          const bpmnXml = generateBpmnFromProcesses(targetProcesses, 'BPMN図');
          
          await window.electronAPI.bpmn.create({
            projectId,
            name: 'BPMN図',
            xmlContent: bpmnXml,
            bpmnDiagramTableId: options?.bpmnDiagramTableId, // フロー図グループIDを指定
          });
          result.bpmnCreated = true;
        }
        */
      }

      // マニュアルがなければ作成
      if (!status.hasManuals) {
        // TODO: Phase 9では工程表ベースに変更
        /*
        const processes = await window.electronAPI.process.getByProject(projectId);
        // processTableIdでフィルタ（指定されている場合）
        const targetProcesses = options?.processTableId
          ? processes.filter(p => p.processTableId === options.processTableId)
          : processes;

        if (targetProcesses.length > 0) {
          // generateFromProcesses APIを使用して自動生成
          await window.electronAPI.manual.generateFromProcesses({
            projectId,
            title: '業務マニュアル',
            manualTableId: options?.manualTableId, // マニュアルグループIDを指定
            options: {
              includeDetailProcesses: true,
            },
          });
          result.manualCreated = true;
        }
        */
      }
    }

    return result;
  } catch (error) {
    console.error('Auto sync failed:', error);
    throw error;
  }
}
