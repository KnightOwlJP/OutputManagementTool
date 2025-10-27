/**
 * ELK Layout Test Script
 * 
 * ELKレイアウトエンジンの動作を検証するテストスクリプト
 */

import { layoutBpmnProcess } from '../src/lib/elk-layout.js';

// テストデータ
const mockProcesses = [
  {
    id: 'process-001',
    processTableId: 'test-table-001',
    name: 'プロセス開始',
    laneId: 'lane-001',
    bpmnElement: 'event',
    eventType: 'start',
    nextProcessIds: ['process-002'],
    beforeProcessIds: [],
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'process-002',
    processTableId: 'test-table-001',
    name: '見積書作成',
    laneId: 'lane-001',
    bpmnElement: 'task',
    taskType: 'userTask',
    nextProcessIds: ['process-003'],
    beforeProcessIds: ['process-001'],
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'process-003',
    processTableId: 'test-table-001',
    name: '承認判断',
    laneId: 'lane-001',
    bpmnElement: 'gateway',
    gatewayType: 'exclusive',
    nextProcessIds: ['process-004', 'process-006'],
    beforeProcessIds: ['process-002'],
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'process-004',
    processTableId: 'test-table-001',
    name: '契約処理',
    laneId: 'lane-002',
    bpmnElement: 'task',
    taskType: 'serviceTask',
    nextProcessIds: ['process-005'],
    beforeProcessIds: ['process-003'],
    displayOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'process-005',
    processTableId: 'test-table-001',
    name: 'プロセス完了',
    laneId: 'lane-002',
    bpmnElement: 'event',
    eventType: 'end',
    nextProcessIds: [],
    beforeProcessIds: ['process-004'],
    displayOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'process-006',
    processTableId: 'test-table-001',
    name: '却下通知',
    laneId: 'lane-001',
    bpmnElement: 'task',
    taskType: 'manualTask',
    nextProcessIds: ['process-007'],
    beforeProcessIds: ['process-003'],
    displayOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'process-007',
    processTableId: 'test-table-001',
    name: 'プロセス終了(却下)',
    laneId: 'lane-001',
    bpmnElement: 'event',
    eventType: 'end',
    nextProcessIds: [],
    beforeProcessIds: ['process-006'],
    displayOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockSwimlanes = [
  {
    id: 'lane-001',
    processTableId: 'test-table-001',
    name: '営業部',
    color: '#3B82F6',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lane-002',
    processTableId: 'test-table-001',
    name: '経理部',
    color: '#10B981',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function runElkLayoutTest() {
  console.log('='.repeat(80));
  console.log('ELK Layout Test - 開始');
  console.log('='.repeat(80));
  console.log();

  console.log('[1] テストデータ:');
  console.log(`  - プロセス数: ${mockProcesses.length}`);
  console.log(`  - レーン数: ${mockSwimlanes.length}`);
  console.log();

  console.log('[2] ELKレイアウト実行中...');
  try {
    const layoutResult = await layoutBpmnProcess(mockProcesses, mockSwimlanes);

    console.log('✓ レイアウト成功');
    console.log();

    console.log('[3] レイアウト結果:');
    console.log(`  - 総幅: ${Math.round(layoutResult.totalWidth)}px`);
    console.log(`  - 総高さ: ${Math.round(layoutResult.totalHeight)}px`);
    console.log();

    console.log('[4] レーン座標:');
    layoutResult.lanes.forEach((lane, laneId) => {
      const swimlane = mockSwimlanes.find(s => s.id === laneId);
      console.log(`  - ${swimlane?.name || laneId}:`);
      console.log(`      x: ${Math.round(lane.x)}, y: ${Math.round(lane.y)}, width: ${Math.round(lane.width)}, height: ${Math.round(lane.height)}`);
    });
    console.log();

    console.log('[5] ノード座標（最初の3つ）:');
    let count = 0;
    for (const [nodeId, node] of layoutResult.nodes) {
      if (count >= 3) break;
      const process = mockProcesses.find(p => p.id === nodeId);
      console.log(`  - ${process?.name || nodeId}:`);
      console.log(`      x: ${Math.round(node.x)}, y: ${Math.round(node.y)}, width: ${Math.round(node.width)}, height: ${Math.round(node.height)}`);
      count++;
    }
    console.log(`  ... (他 ${layoutResult.nodes.size - 3} ノード)`);
    console.log();

    console.log('[6] エッジ座標（最初の2つ）:');
    count = 0;
    for (const [edgeId, edge] of layoutResult.edges) {
      if (count >= 2) break;
      console.log(`  - ${edgeId}:`);
      console.log(`      ウェイポイント数: ${edge.waypoints.length}`);
      edge.waypoints.forEach((wp, i) => {
        console.log(`      [${i}] x: ${Math.round(wp.x)}, y: ${Math.round(wp.y)}`);
      });
      count++;
    }
    console.log(`  ... (他 ${layoutResult.edges.size - 2} エッジ)`);
    console.log();

    // 検証チェック
    console.log('[7] 検証チェック:');
    const checks = [
      {
        name: 'レーン数が一致',
        pass: layoutResult.lanes.size === mockSwimlanes.length
      },
      {
        name: 'ノード数が一致',
        pass: layoutResult.nodes.size === mockProcesses.length
      },
      {
        name: 'すべてのレーンに座標がある',
        pass: Array.from(layoutResult.lanes.values()).every(l => l.x >= 0 && l.y >= 0 && l.width > 0 && l.height >= 150)
      },
      {
        name: 'すべてのノードに座標がある',
        pass: Array.from(layoutResult.nodes.values()).every(n => n.x >= 0 && n.y >= 0 && n.width > 0 && n.height > 0)
      },
      {
        name: 'レーン高さが最低値を満たす',
        pass: Array.from(layoutResult.lanes.values()).every(l => l.height >= 150)
      },
      {
        name: 'エッジにウェイポイントがある',
        pass: Array.from(layoutResult.edges.values()).every(e => e.waypoints.length >= 2)
      },
      {
        name: '総幅・総高さが妥当',
        pass: layoutResult.totalWidth > 0 && layoutResult.totalHeight > 0
      }
    ];

    checks.forEach(check => {
      console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`);
    });
    console.log();

    const allPassed = checks.every(c => c.pass);
    console.log('='.repeat(80));
    if (allPassed) {
      console.log('✓ テスト成功: ELKレイアウトは正常に動作しています');
    } else {
      console.log('✗ テスト失敗: 上記のエラーを確認してください');
    }
    console.log('='.repeat(80));

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('✗ ELKレイアウトエラー:', error);
    console.log();
    console.log('='.repeat(80));
    console.log('✗ テスト失敗: ELKレイアウトの実行中にエラーが発生しました');
    console.log('='.repeat(80));
    process.exit(1);
  }
}

// テスト実行
runElkLayoutTest();
