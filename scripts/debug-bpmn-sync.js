/**
 * BPMN sync_state デバッグスクリプト
 * データベースの内容を確認し、sync_stateをクリアする
 */

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// データベースファイルのパス
const dbPath = path.join(
  os.homedir(),
  'AppData',
  'Roaming',
  'output-management-tool',
  'database.db'
);

console.log('データベースパス:', dbPath);

try {
  const db = new Database(dbPath);

  console.log('\n=== 現在のsync_state ===');
  const states = db.prepare('SELECT * FROM bpmn_sync_state').all();
  
  if (states.length === 0) {
    console.log('sync_stateテーブルは空です');
  } else {
    states.forEach(state => {
      console.log({
        id: state.id,
        processTableId: state.process_table_id,
        xmlLength: state.bpmn_xml?.length || 0,
        xmlPreview: state.bpmn_xml?.substring(0, 200),
        lastModifiedBy: state.last_modified_by,
        version: state.version,
      });
    });
  }

  console.log('\n=== sync_stateをクリア ===');
  const result = db.prepare('DELETE FROM bpmn_sync_state').run();
  console.log(`削除された行数: ${result.changes}`);

  console.log('\n=== 確認 ===');
  const afterStates = db.prepare('SELECT * FROM bpmn_sync_state').all();
  console.log(`残りの行数: ${afterStates.length}`);

  db.close();
  console.log('\n完了しました。アプリを再起動してください。');
} catch (error) {
  console.error('エラー:', error);
}
