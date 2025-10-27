'use client';

import { useEffect, useState } from 'react';

interface DatabaseSchemaInfo {
  tables: string[];
  migrations: Array<{
    version: string;
    applied_date: string;
  }>;
  phase7TableSchemas: {
    [tableName: string]: Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>;
  };
  processesSyncFields: Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>;
  phase7Indexes: Array<{
    name: string;
    tbl_name: string;
  }>;
}

export default function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<DatabaseSchemaInfo | null>(null);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setLoading(true);
        const result = await window.electron.invoke('debug:getDatabaseSchema');
        
        if (result.success) {
          setSchemaInfo(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">データベーススキーマを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">エラー</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!schemaInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            データベーススキーマ情報
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Phase 7 マイグレーション後のデータベース構造
          </p>
        </div>

        {/* マイグレーション履歴 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            マイグレーション履歴
          </h2>
          <div className="space-y-2">
            {schemaInfo.migrations.map((migration, index) => (
              <div
                key={migration.version}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
              >
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    {migration.version}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {migration.applied_date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* custom_columns テーブル */}
        {schemaInfo.phase7TableSchemas.custom_columns && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              custom_columns テーブル
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      列名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NOT NULL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      デフォルト値
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {schemaInfo.phase7TableSchemas.custom_columns.map((col) => (
                    <tr key={col.name}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                        {col.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.notnull ? '✓' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.dflt_value || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* process_custom_values テーブル */}
        {schemaInfo.phase7TableSchemas.process_custom_values && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              process_custom_values テーブル (EAVパターン)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      列名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NOT NULL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      デフォルト値
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {schemaInfo.phase7TableSchemas.process_custom_values.map((col) => (
                    <tr key={col.name}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                        {col.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.notnull ? '✓' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.dflt_value || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* bpmn_elements テーブル */}
        {schemaInfo.phase7TableSchemas.bpmn_elements && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              bpmn_elements テーブル
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      列名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NOT NULL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      デフォルト値
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {schemaInfo.phase7TableSchemas.bpmn_elements.map((col) => (
                    <tr key={col.name}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                        {col.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.notnull ? '✓' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.dflt_value || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* processes テーブルの同期フィールド */}
        {schemaInfo.processesSyncFields.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              processes テーブルの同期関連フィールド
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      列名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NOT NULL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      デフォルト値
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {schemaInfo.processesSyncFields.map((col) => (
                    <tr key={col.name}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                        {col.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.notnull ? '✓' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {col.dflt_value || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Phase 7 インデックス */}
        {schemaInfo.phase7Indexes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Phase 7 関連インデックス
            </h2>
            <div className="space-y-2">
              {schemaInfo.phase7Indexes.map((index) => (
                <div
                  key={index.name}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {index.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    テーブル: {index.tbl_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 全テーブル一覧 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            全テーブル一覧 ({schemaInfo.tables.length} テーブル)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {schemaInfo.tables.map((table) => (
              <div
                key={table}
                className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-sm font-mono text-gray-900 dark:text-white"
              >
                {table}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
