-- BPMN sync_state テーブルをクリアして再生成を促す
-- 問題: generateBpmnXmlFromProcesses の簡易実装が BPMNDiagram 要素を含まない
-- 解決策: sync_state をクリアし、次回アクセス時に完全な XML を再生成

DELETE FROM bpmn_sync_state;

-- または、特定の工程表のみクリアする場合:
-- DELETE FROM bpmn_sync_state WHERE process_table_id = 'YOUR_PROCESS_TABLE_ID';
