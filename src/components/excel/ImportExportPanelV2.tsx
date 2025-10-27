/**
 * Excel入出力パネル V2
 * Phase 9フラット構造対応
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardBody, Button, Progress, Chip } from '@heroui/react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  importProcessTableFromExcel,
  ParsedProcessTableData,
} from '@/lib/excel-parser-v2';
import {
  downloadProcessTableExcel,
  downloadProcessTableTemplate,
  ExcelExportOptionsV2,
} from '@/lib/excel-generator-v2';
import {
  ProcessTable,
  Swimlane,
  CustomColumn,
  Process,
} from '@/types/models';

interface ImportExportPanelV2Props {
  processTableId: string;
  processTable?: ProcessTable;
  swimlanes: Swimlane[];
  customColumns: CustomColumn[];
  processes: Process[];
  onImportComplete?: (data: ParsedProcessTableData) => void;
}

interface ImportResult {
  success: boolean;
  swimlaneCount: number;
  processCount: number;
  customColumnCount: number;
  errors: string[];
  warnings: string[];
}

export function ImportExportPanelV2({
  processTableId,
  processTable,
  swimlanes,
  customColumns,
  processes,
  onImportComplete,
}: ImportExportPanelV2Props) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  /**
   * ファイル選択ハンドラ
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setImportProgress(0);
      setImportResult(null);

      try {
        // ファイル読み込み
        setImportProgress(20);
        const arrayBuffer = await file.arrayBuffer();

        // パース実行
        setImportProgress(40);
        const parsedData: ParsedProcessTableData = importProcessTableFromExcel(arrayBuffer);

        setImportProgress(60);

        // エラーがある場合は中断
        if (parsedData.errors.length > 0) {
          setImportResult({
            success: false,
            swimlaneCount: 0,
            processCount: 0,
            customColumnCount: 0,
            errors: parsedData.errors,
            warnings: parsedData.warnings,
          });
          return;
        }

        // プロジェクトIDと工程表IDを設定
        parsedData.swimlanes.forEach(lane => {
          lane.processTableId = processTableId;
        });
        parsedData.customColumns.forEach(col => {
          col.processTableId = processTableId;
        });
        parsedData.processes.forEach(proc => {
          proc.processTableId = processTableId;
        });

        setImportProgress(80);

        // 結果を設定
        setImportResult({
          success: true,
          swimlaneCount: parsedData.swimlanes.length,
          processCount: parsedData.processes.length,
          customColumnCount: parsedData.customColumns.length,
          errors: [],
          warnings: parsedData.warnings,
        });

        setImportProgress(100);

        // コールバック実行
        if (onImportComplete) {
          onImportComplete(parsedData);
        }
      } catch (error) {
        console.error('Import failed:', error);
        setImportResult({
          success: false,
          swimlaneCount: 0,
          processCount: 0,
          customColumnCount: 0,
          errors: [
            `インポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          ],
          warnings: [],
        });
      } finally {
        setIsImporting(false);
        // ファイル選択をリセット
        event.target.value = '';
      }
    },
    [processTableId, onImportComplete]
  );

  /**
   * エクスポートハンドラ
   */
  const handleExport = useCallback(async () => {
    if (!processTable) {
      alert('工程表情報が見つかりません');
      return;
    }

    if (processes.length === 0) {
      alert('エクスポートする工程がありません');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExcelExportOptionsV2 = {
        includeHeaders: true,
        includeCustomColumns: customColumns.length > 0,
        includeBpmnDetails: true,
      };

      downloadProcessTableExcel(
        processTable,
        swimlanes,
        processes,
        customColumns,
        options
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert(
        `エクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsExporting(false);
    }
  }, [processTable, swimlanes, processes, customColumns]);

  /**
   * テンプレートダウンロードハンドラ
   */
  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadProcessTableTemplate();
    } catch (error) {
      console.error('Template download failed:', error);
      alert(
        `テンプレートのダウンロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, []);

  return (
    <Card className="w-full shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Excel連携（V2: Phase 9対応）
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              工程表・レーン・工程データの一括入出力
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6 p-6">
        {/* インポートセクション */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <ArrowUpTrayIcon className="w-5 h-5 text-blue-600" />
                インポート
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Excelファイルから工程表データを読み込みます
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                color="secondary"
                variant="flat"
                onPress={handleDownloadTemplate}
                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              >
                テンプレート
              </Button>
              <Button
                color="primary"
                onPress={() => document.getElementById('file-input-v2')?.click()}
                isLoading={isImporting}
                isDisabled={isImporting}
                startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
              >
                {isImporting ? 'インポート中...' : 'ファイルを選択'}
              </Button>
            </div>
          </div>

          <input
            id="file-input-v2"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* プログレスバー */}
          {isImporting && (
            <div className="space-y-2">
              <Progress
                value={importProgress}
                color="primary"
                className="w-full"
                showValueLabel
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {importProgress < 40
                  ? 'ファイルを読み込んでいます...'
                  : importProgress < 80
                    ? 'データを解析しています...'
                    : '処理を完了しています...'}
              </p>
            </div>
          )}

          {/* インポート結果 */}
          {importResult && (
            <div
              className={`p-4 rounded-lg border ${
                importResult.success
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}
            >
              <h5 className="font-semibold mb-2">
                {importResult.success ? '✓ インポート完了' : '✗ インポート失敗'}
              </h5>
              <div className="flex gap-2 mb-2">
                <Chip size="sm" color="primary" variant="flat">
                  レーン: {importResult.swimlaneCount}件
                </Chip>
                <Chip size="sm" color="success" variant="flat">
                  工程: {importResult.processCount}件
                </Chip>
                {importResult.customColumnCount > 0 && (
                  <Chip size="sm" color="secondary" variant="flat">
                    カスタム列: {importResult.customColumnCount}件
                  </Chip>
                )}
              </div>

              {/* エラー表示 */}
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                    エラー:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 警告表示 */}
              {importResult.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                    警告:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 区切り線 */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* エクスポートセクション */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
                エクスポート
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                現在の工程表データをExcelファイルに出力します
              </p>
            </div>
            <Button
              color="success"
              onPress={handleExport}
              isLoading={isExporting}
              isDisabled={isExporting || !processTable || processes.length === 0}
              startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
            >
              {isExporting ? 'エクスポート中...' : 'Excelをダウンロード'}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                レーン数
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {swimlanes.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                工程数
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {processes.length}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                カスタム列
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {customColumns.length}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                BPMN要素
              </p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                {processes.filter(p => p.bpmnElement !== 'task').length}
              </p>
            </div>
          </div>
        </div>

        {/* 使い方ガイド */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            📘 Phase 9 新形式について
          </h5>
          <div className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
            <p>この形式では、以下のデータが含まれます：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>工程表情報</strong>: 工程表の基本情報</li>
              <li><strong>レーン</strong>: スイムレーン（担当部署など）の定義</li>
              <li><strong>工程データ</strong>: 各工程の詳細（BPMN要素含む）</li>
              <li><strong>カスタム列</strong>: 追加の項目定義（オプション）</li>
            </ul>
            <p className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
              💡 テンプレートには使用例が含まれています。参考にしてください。
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
