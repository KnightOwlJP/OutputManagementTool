'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardBody, Button, Progress } from '@heroui/react';
import { importProcessesFromExcel, ParsedProcessData } from '@/lib/excel-parser';
import { exportProcessesToExcel, generateTemplate } from '@/lib/excel-generator';
import { Process } from '@/types/project.types';

interface ImportExportPanelProps {
  projectId: string;
  processes: Process[];
  onImportComplete?: (processes: Process[]) => void;
}

interface ImportResult {
  success: boolean;
  processCount: number;
  errors: string[];
  warnings: string[];
}

export function ImportExportPanel({
  projectId,
  processes,
  onImportComplete,
}: ImportExportPanelProps) {
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
        const parsedData: ParsedProcessData = importProcessesFromExcel(arrayBuffer);

        // プロジェクトIDを設定
        const processesWithProject = parsedData.processes.map(p => ({
          ...p,
          projectId,
        }));

        // データベースに保存
        setImportProgress(60);
        const savedProcesses: Process[] = [];
        for (const process of processesWithProject) {
          try {
            // 必須フィールドを検証
            if (!process.name || !process.level) {
              parsedData.errors.push(
                `工程「${process.name || '(名前なし)'}」は必須フィールドが不足しています`
              );
              continue;
            }

            const result = await window.electronAPI.process.create({
              projectId: process.projectId,
              name: process.name,
              level: process.level,
              parentId: process.parentId,
              department: process.department,
              assignee: process.assignee,
              documentType: process.documentType,
              description: process.description,
              startDate: process.startDate,
              endDate: process.endDate,
            });
            savedProcesses.push(result);
          } catch (error) {
            console.error(`Failed to create process: ${process.name}`, error);
            parsedData.errors.push(
              `工程「${process.name}」の作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        setImportProgress(100);

        // 結果を設定
        setImportResult({
          success: parsedData.errors.length === 0,
          processCount: savedProcesses.length,
          errors: parsedData.errors,
          warnings: parsedData.warnings,
        });

        // コールバック実行
        if (onImportComplete && savedProcesses.length > 0) {
          onImportComplete(savedProcesses);
        }
      } catch (error) {
        console.error('Import failed:', error);
        setImportResult({
          success: false,
          processCount: 0,
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
    [projectId, onImportComplete]
  );

  /**
   * エクスポートハンドラ
   */
  const handleExport = useCallback(async () => {
    if (processes.length === 0) {
      alert('エクスポートする工程がありません');
      return;
    }

    setIsExporting(true);

    try {
      // Excel生成
      const arrayBuffer = exportProcessesToExcel(processes);

      // ダウンロード
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `processes_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(
        `エクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsExporting(false);
    }
  }, [processes]);

  /**
   * テンプレートダウンロードハンドラ
   */
  const handleDownloadTemplate = useCallback(() => {
    try {
      const arrayBuffer = generateTemplate();

      // ダウンロード
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'process_template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download failed:', error);
      alert(
        `テンプレートのダウンロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-xl font-semibold">工程データのインポート・エクスポート</h3>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* インポートセクション */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg">インポート</h4>
              <p className="text-sm text-gray-600">
                Excelファイルから工程データを読み込みます
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                color="secondary"
                variant="flat"
                onPress={handleDownloadTemplate}
              >
                テンプレートをダウンロード
              </Button>
              <Button
                color="primary"
                onPress={() => document.getElementById('file-input')?.click()}
                isLoading={isImporting}
                isDisabled={isImporting}
              >
                {isImporting ? 'インポート中...' : 'ファイルを選択'}
              </Button>
            </div>
          </div>

          <input
            id="file-input"
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
              <p className="text-sm text-gray-600">
                {importProgress < 40
                  ? 'ファイルを読み込んでいます...'
                  : importProgress < 80
                    ? 'データを解析しています...'
                    : 'データベースに保存しています...'}
              </p>
            </div>
          )}

          {/* インポート結果 */}
          {importResult && (
            <div
              className={`p-4 rounded-lg ${
                importResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <h5 className="font-semibold mb-2">
                {importResult.success ? '✓ インポート完了' : '✗ インポート失敗'}
              </h5>
              <p className="text-sm">
                {importResult.processCount}件の工程を読み込みました
              </p>

              {/* エラー表示 */}
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-red-700">エラー:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 警告表示 */}
              {importResult.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-yellow-700">警告:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-600 mt-1">
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
        <div className="border-t border-gray-200" />

        {/* エクスポートセクション */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg">エクスポート</h4>
              <p className="text-sm text-gray-600">
                現在の工程データをExcelファイルに出力します
              </p>
            </div>
            <Button
              color="success"
              onPress={handleExport}
              isLoading={isExporting}
              isDisabled={isExporting || processes.length === 0}
            >
              {isExporting ? 'エクスポート中...' : 'Excelをダウンロード'}
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>エクスポート可能な工程数: {processes.length}件</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>大工程: {processes.filter(p => p.level === 'large').length}件</li>
              <li>中工程: {processes.filter(p => p.level === 'medium').length}件</li>
              <li>小工程: {processes.filter(p => p.level === 'small').length}件</li>
              <li>詳細工程: {processes.filter(p => p.level === 'detail').length}件</li>
            </ul>
          </div>
        </div>

        {/* 使い方ガイド */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-2">使い方</h5>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>「テンプレートをダウンロード」でExcelテンプレートを取得</li>
            <li>テンプレートに工程データを入力（サンプルを参考に）</li>
            <li>「ファイルを選択」でExcelファイルをアップロード</li>
            <li>インポート完了後、工程一覧に反映されます</li>
          </ol>
        </div>
      </CardBody>
    </Card>
  );
}
