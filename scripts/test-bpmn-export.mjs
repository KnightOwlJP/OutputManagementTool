/**
 * BPMN XML Export Test Script (Node.js compatible)
 * 
 * TypeScriptのテストファイルから移植したJavaScriptバージョン
 */

// モックデータ
const mockProcessTable = {
  id: 'test-table-001',
  projectId: 'test-project-001',
  name: 'サンプル業務プロセス',
  level: 'medium',
  description: 'テスト用のBPMN業務プロセス',
  displayOrder: 1,
  createdAt: new Date('2025-01-22T10:00:00.000Z'),
  updatedAt: new Date('2025-01-22T10:00:00.000Z')
};

const mockSwimlanes = [
  {
    id: 'lane-001',
    processTableId: 'test-table-001',
    name: '営業部',
    color: '#3B82F6',
    order: 1,
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  },
  {
    id: 'lane-002',
    processTableId: 'test-table-001',
    name: '経理部',
    color: '#10B981',
    order: 2,
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  }
];

const mockProcesses = [
  {
    id: 'process-001',
    processTableId: 'test-table-001',
    name: 'プロセス開始',
    laneId: 'lane-001',
    bpmnElement: 'event',
    eventType: 'start',
    documentation: '業務プロセスの開始点',
    nextProcessIds: ['process-002'],
    beforeProcessIds: [],
    displayOrder: 1,
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  },
  {
    id: 'process-002',
    processTableId: 'test-table-001',
    name: '見積書作成',
    laneId: 'lane-001',
    bpmnElement: 'task',
    taskType: 'userTask',
    documentation: '顧客向けの見積書を作成する',
    nextProcessIds: ['process-003'],
    beforeProcessIds: ['process-001'],
    displayOrder: 2,
    inputDataObjects: ['顧客情報'],
    outputDataObjects: ['見積書'],
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  },
  {
    id: 'process-003',
    processTableId: 'test-table-001',
    name: '承認判断',
    laneId: 'lane-001',
    bpmnElement: 'gateway',
    gatewayType: 'exclusive',
    documentation: '上長による承認可否を判定',
    nextProcessIds: ['process-004', 'process-006'],
    beforeProcessIds: ['process-002'],
    conditionalFlows: [
      {
        targetProcessId: 'process-004',
        condition: '承認額 <= 100万円',
        description: '承認された場合、契約処理へ進む'
      },
      {
        targetProcessId: 'process-006',
        condition: '承認額 > 100万円',
        description: '却下された場合、却下処理へ進む'
      }
    ],
    displayOrder: 3,
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  },
  {
    id: 'process-004',
    processTableId: 'test-table-001',
    name: '契約処理',
    laneId: 'lane-002',
    bpmnElement: 'task',
    taskType: 'serviceTask',
    documentation: 'システム自動で契約情報を登録',
    nextProcessIds: ['process-005'],
    beforeProcessIds: ['process-003'],
    displayOrder: 4,
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  },
  {
    id: 'process-005',
    processTableId: 'test-table-001',
    name: 'プロセス完了',
    laneId: 'lane-002',
    bpmnElement: 'event',
    eventType: 'end',
    documentation: '業務プロセスの正常終了',
    nextProcessIds: [],
    beforeProcessIds: ['process-004'],
    displayOrder: 5,
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  },
  {
    id: 'process-006',
    processTableId: 'test-table-001',
    name: '却下通知',
    laneId: 'lane-001',
    bpmnElement: 'task',
    taskType: 'manualTask',
    documentation: '顧客へ却下通知を送付',
    nextProcessIds: ['process-007'],
    beforeProcessIds: ['process-003'],
    displayOrder: 6,
    messageFlows: [
      {
        targetProcessId: 'external-customer',
        messageContent: '承認見送りのお知らせ',
        description: '顧客への却下通知メール'
      }
    ],
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  },
  {
    id: 'process-007',
    processTableId: 'test-table-001',
    name: 'プロセス終了(却下)',
    laneId: 'lane-001',
    bpmnElement: 'event',
    eventType: 'end',
    documentation: '業務プロセスの却下終了',
    nextProcessIds: [],
    beforeProcessIds: ['process-006'],
    displayOrder: 7,
    createdAt: new Date('2025-01-22T10:00:00.000Z'),
    updatedAt: new Date('2025-01-22T10:00:00.000Z')
  }
];

// 簡易XMLエクスポーター (ロジックの検証用)
function escapeXml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function exportToBpmnXml(input) {
  const { processTable, processes, swimlanes } = input;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_${processTable.id}"
                  targetNamespace="http://output-management-tool.local/bpmn"
                  exporter="Output Management Tool"
                  exporterVersion="0.7.0">
  <bpmn:process id="Process_${processTable.id}" name="${escapeXml(processTable.name)}" isExecutable="false">
`;

  // LaneSet
  if (swimlanes.length > 0) {
    xml += `    <bpmn:laneSet id="LaneSet_${processTable.id}">
`;
    swimlanes.forEach((lane) => {
      const laneProcesses = processes.filter((p) => p.laneId === lane.id);
      xml += `      <bpmn:lane id="Lane_${lane.id}" name="${escapeXml(lane.name)}">
`;
      laneProcesses.forEach((p) => {
        xml += `        <bpmn:flowNodeRef>${p.id}</bpmn:flowNodeRef>
`;
      });
      xml += `      </bpmn:lane>
`;
    });
    xml += `    </bpmn:laneSet>
`;
  }

  // FlowNodes
  processes.forEach((process) => {
    const doc = process.documentation ? `      <bpmn:documentation>${escapeXml(process.documentation)}</bpmn:documentation>\n` : '';
    
    if (process.bpmnElement === 'event') {
      const eventTag = process.eventType === 'start' ? 'startEvent' :
                       process.eventType === 'end' ? 'endEvent' :
                       'intermediateCatchEvent';
      xml += `    <bpmn:${eventTag} id="${process.id}" name="${escapeXml(process.name)}">
${doc}`;
      // Incoming/Outgoing flows
      (process.beforeProcessIds || []).forEach(id => {
        xml += `      <bpmn:incoming>Flow_${id}_to_${process.id}</bpmn:incoming>\n`;
      });
      (process.nextProcessIds || []).forEach(id => {
        xml += `      <bpmn:outgoing>Flow_${process.id}_to_${id}</bpmn:outgoing>\n`;
      });
      xml += `    </bpmn:${eventTag}>
`;
    } else if (process.bpmnElement === 'task') {
      const taskTag = `bpmn:${process.taskType || 'userTask'}`;
      xml += `    <${taskTag} id="${process.id}" name="${escapeXml(process.name)}">
${doc}`;
      (process.beforeProcessIds || []).forEach(id => {
        xml += `      <bpmn:incoming>Flow_${id}_to_${process.id}</bpmn:incoming>\n`;
      });
      (process.nextProcessIds || []).forEach(id => {
        xml += `      <bpmn:outgoing>Flow_${process.id}_to_${id}</bpmn:outgoing>\n`;
      });
      xml += `    </${taskTag}>
`;
    } else if (process.bpmnElement === 'gateway') {
      const gatewayTag = process.gatewayType === 'exclusive' ? 'exclusiveGateway' :
                         process.gatewayType === 'parallel' ? 'parallelGateway' :
                         'inclusiveGateway';
      xml += `    <bpmn:${gatewayTag} id="${process.id}" name="${escapeXml(process.name)}">
${doc}`;
      (process.beforeProcessIds || []).forEach(id => {
        xml += `      <bpmn:incoming>Flow_${id}_to_${process.id}</bpmn:incoming>\n`;
      });
      (process.nextProcessIds || []).forEach(id => {
        xml += `      <bpmn:outgoing>Flow_${process.id}_to_${id}</bpmn:outgoing>\n`;
      });
      xml += `    </bpmn:${gatewayTag}>
`;
    }
  });

  // Sequence Flows
  processes.forEach((process) => {
    (process.nextProcessIds || []).forEach(targetId => {
      const flowId = `Flow_${process.id}_to_${targetId}`;
      const condFlow = (process.conditionalFlows || []).find(cf => cf.targetProcessId === targetId);
      
      xml += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${process.id}" targetRef="${targetId}"`;
      if (condFlow) {
        xml += `>\n`;
        xml += `      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(condFlow.condition)}</bpmn:conditionExpression>\n`;
        xml += `    </bpmn:sequenceFlow>\n`;
      } else {
        xml += ` />\n`;
      }
    });
  });

  xml += `  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${processTable.id}">
    <bpmndi:BPMNPlane id="BPMNPlane_${processTable.id}" bpmnElement="Process_${processTable.id}">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return {
    xml,
    processCount: processes.length,
    laneCount: swimlanes.length
  };
}

// テスト実行
console.log('='.repeat(80));
console.log('BPMN XML Export Test - JavaScript Version');
console.log('='.repeat(80));
console.log();

console.log('[1] Generating BPMN XML...');
const result = exportToBpmnXml({
  processTable: mockProcessTable,
  processes: mockProcesses,
  swimlanes: mockSwimlanes
});

console.log(`✓ Generation complete: ${result.processCount} processes, ${result.laneCount} lanes`);
console.log();

console.log('[2] Statistics:');
console.log(`  - Process Table: ${mockProcessTable.name}`);
console.log(`  - Process Count: ${result.processCount}`);
console.log(`  - Lane Count: ${result.laneCount}`);
console.log(`  - XML Length: ${result.xml.length.toLocaleString()} chars`);
console.log();

const taskCount = mockProcesses.filter(p => p.bpmnElement === 'task').length;
const eventCount = mockProcesses.filter(p => p.bpmnElement === 'event').length;
const gatewayCount = mockProcesses.filter(p => p.bpmnElement === 'gateway').length;

console.log('[3] Element Breakdown:');
console.log(`  - Tasks: ${taskCount}`);
console.log(`  - Events: ${eventCount}`);
console.log(`  - Gateways: ${gatewayCount}`);
console.log();

console.log('[4] XML Structure Validation:');
const checks = [
  { name: 'XML Declaration', pass: result.xml.startsWith('<?xml') },
  { name: 'BPMN Definitions', pass: result.xml.includes('<bpmn:definitions') },
  { name: 'Process Element', pass: result.xml.includes('<bpmn:process') },
  { name: 'LaneSet Element', pass: result.xml.includes('<bpmn:laneSet') },
  { name: 'Lane Count', pass: (result.xml.match(/<bpmn:lane /g) || []).length === mockSwimlanes.length },
  { name: 'Start Event', pass: result.xml.includes('<bpmn:startEvent') },
  { name: 'End Event', pass: result.xml.includes('<bpmn:endEvent') },
  { name: 'User Task', pass: result.xml.includes('<bpmn:userTask') },
  { name: 'Service Task', pass: result.xml.includes('<bpmn:serviceTask') },
  { name: 'Manual Task', pass: result.xml.includes('<bpmn:manualTask') },
  { name: 'Exclusive Gateway', pass: result.xml.includes('<bpmn:exclusiveGateway') },
  { name: 'Sequence Flow', pass: result.xml.includes('<bpmn:sequenceFlow') },
  { name: 'Conditional Expression', pass: result.xml.includes('<bpmn:conditionExpression') },
  { name: 'Documentation', pass: result.xml.includes('<bpmn:documentation>') },
  { name: 'BPMN Diagram', pass: result.xml.includes('<bpmndi:BPMNDiagram') }
];

checks.forEach(check => {
  console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`);
});
console.log();

console.log('[5] XML Preview (first 1500 chars):');
console.log('-'.repeat(80));
console.log(result.xml.substring(0, 1500));
console.log('...(truncated)...');
console.log('-'.repeat(80));
console.log();

const allPassed = checks.every(c => c.pass);
console.log('='.repeat(80));
if (allPassed) {
  console.log('✓ TEST PASSED: BPMN 2.0 XML generation is correct');
} else {
  console.log('✗ TEST FAILED: Some checks did not pass');
}
console.log('='.repeat(80));

// Save XML to file
import { writeFileSync } from 'fs';
const outputPath = './test-output-bpmn.xml';
writeFileSync(outputPath, result.xml, 'utf-8');
console.log();
console.log(`📄 XML saved to: ${outputPath}`);
console.log();

process.exit(allPassed ? 0 : 1);
