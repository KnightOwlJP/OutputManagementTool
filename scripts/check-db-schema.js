const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// データベースパス
const appDataPath = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'output-management-tool',
  'data',
  'output-management.db'
);

console.log('データベースパス:', appDataPath);
console.log('');

try {
  const db = new Database(appDataPath, { readonly: true });
  
  // 全テーブル一覧
  console.log('=== 全テーブル一覧 ===');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  console.log('');
  
  // マイグレーション履歴
  console.log('=== マイグレーション履歴 ===');
  const migrations = db.prepare(`
    SELECT version, datetime(applied_at/1000, 'unixepoch') as applied_date
    FROM migrations 
    ORDER BY applied_at DESC
  `).all();
  
  migrations.forEach((migration, index) => {
    console.log(`  ${index + 1}. ${migration.version}`);
    console.log(`     適用日時: ${migration.applied_date}`);
  });
  console.log('');
  
  // custom_columnsテーブルのスキーマ
  if (tables.some(t => t.name === 'custom_columns')) {
    console.log('=== custom_columns テーブルスキーマ ===');
    const customColumnsSchema = db.prepare(`
      PRAGMA table_info(custom_columns)
    `).all();
    
    customColumnsSchema.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    console.log('');
  }
  
  // process_custom_valuesテーブルのスキーマ
  if (tables.some(t => t.name === 'process_custom_values')) {
    console.log('=== process_custom_values テーブルスキーマ ===');
    const customValuesSchema = db.prepare(`
      PRAGMA table_info(process_custom_values)
    `).all();
    
    customValuesSchema.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    console.log('');
  }
  
  // bpmn_elementsテーブルのスキーマ
  if (tables.some(t => t.name === 'bpmn_elements')) {
    console.log('=== bpmn_elements テーブルスキーマ ===');
    const bpmnElementsSchema = db.prepare(`
      PRAGMA table_info(bpmn_elements)
    `).all();
    
    bpmnElementsSchema.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    console.log('');
  }
  
  // processesテーブルの新しいカラム
  console.log('=== processes テーブルの同期関連フィールド ===');
  const processesSchema = db.prepare(`
    PRAGMA table_info(processes)
  `).all();
  
  const syncFields = processesSchema.filter(col => 
    ['bpmn_element_type', 'sync_status', 'last_sync_at'].includes(col.name)
  );
  
  if (syncFields.length > 0) {
    syncFields.forEach(col => {
      console.log(`  ✓ ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
  } else {
    console.log('  ⚠ 同期関連フィールドが見つかりませんでした');
  }
  console.log('');
  
  // インデックス一覧（新しいインデックスのみ）
  console.log('=== Phase 7 関連インデックス ===');
  const indexes = db.prepare(`
    SELECT name, tbl_name FROM sqlite_master 
    WHERE type='index' 
    AND (
      name LIKE '%custom%' 
      OR name LIKE '%bpmn_element%' 
      OR name LIKE '%sync_status%'
    )
    ORDER BY name
  `).all();
  
  indexes.forEach(index => {
    console.log(`  - ${index.name} (テーブル: ${index.tbl_name})`);
  });
  console.log('');
  
  console.log('✅ データベーススキーマの確認が完了しました');
  
  db.close();
} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
}
