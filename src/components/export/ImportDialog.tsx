'use client';

import React, { useState, useCallback, useRef } from 'react';
import type {
  ImportOptions,
  ImportPreview,
  ExportData,
} from '@/lib/export';
import {
  IMPORT_FORMAT_LABELS,
  DEFAULT_IMPORT_OPTIONS,
  previewImport,
  executeImport,
} from '@/lib/export';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  processTableId: string;
  existingData?: Partial<ExportData>;
  onImportComplete?: () => void;
}

type ImportStep = 'select' | 'preview' | 'importing' | 'complete';

export function ImportDialog({
  isOpen,
  onClose,
  processTableId,
  existingData,
  onImportComplete,
}: ImportDialogProps): JSX.Element | null {
  const [step, setStep] = useState<ImportStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<Partial<ImportOptions>>(DEFAULT_IMPORT_OPTIONS);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [progress, setProgress] = useState<{ value: number; message: string }>({
    value: 0,
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      setError(null);

      // プレビューを実行
      const previewResult = await previewImport(file, options, existingData);
      setPreview(previewResult);
      setStep('preview');
    },
    [options, existingData]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      setError(null);

      const previewResult = await previewImport(file, options, existingData);
      setPreview(previewResult);
      setStep('preview');
    },
    [options, existingData]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleImport = useCallback(async () => {
    if (!preview || !preview.valid) return;

    setStep('importing');
    setProgress({ value: 0, message: 'インポートを開始...' });

    const result = await executeImport(preview, processTableId, (value, message) => {
      setProgress({ value, message });
    });

    if (result.success) {
      setStep('complete');
      onImportComplete?.();
    } else {
      setError(result.errors[0]?.message || 'インポートに失敗しました');
      setStep('preview');
    }
  }, [preview, processTableId, onImportComplete]);

  const handleReset = useCallback(() => {
    setStep('select');
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setProgress({ value: 0, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            工程データをインポート
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Excel, CSV, JSONファイルからデータをインポートできます
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ステップ1: ファイル選択 */}
          {step === 'select' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-file"
                />
                <svg
                  className="w-12 h-12 mx-auto text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  ファイルをドラッグ＆ドロップ
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">または</p>
                <label
                  htmlFor="import-file"
                  className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                >
                  ファイルを選択
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                  対応形式: {Object.values(IMPORT_FORMAT_LABELS).join(', ')}
                </p>
              </div>

              {/* インポートオプション */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  インポートオプション
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.mergeWithExisting ?? false}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          mergeWithExisting: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      既存データとマージする
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ステップ2: プレビュー */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFile?.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedFile && formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  ファイルを変更
                </button>
              </div>

              {/* サマリー */}
              <div
                className={`rounded-lg p-4 ${
                  preview.valid
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center">
                  {preview.valid ? (
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-red-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span
                    className={`font-medium ${
                      preview.valid
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {preview.valid ? 'インポート可能' : 'エラーがあります'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">レーン:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {preview.summary.swimlaneCount}件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">工程:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {preview.summary.processCount}件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">カスタム列:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {preview.summary.customColumnCount}件
                    </span>
                  </div>
                </div>
              </div>

              {/* エラー一覧 */}
              {preview.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                    エラー ({preview.errors.length}件)
                  </h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {preview.errors.map((err, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-red-600 dark:text-red-400">
                          {err.row ? `行${err.row}: ` : ''}
                          {err.message}
                        </span>
                        {err.suggestion && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            💡 {err.suggestion}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 警告一覧 */}
              {preview.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                    警告 ({preview.warnings.length}件)
                  </h4>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {preview.warnings.map((warn, i) => (
                      <li key={i} className="text-sm text-yellow-600 dark:text-yellow-400">
                        {warn.row ? `行${warn.row}: ` : ''}
                        {warn.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 差分表示（マージモード時） */}
              {preview.diff && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                    差分
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        追加
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        レーン: {preview.diff.added.swimlanes.length}
                        <br />
                        工程: {preview.diff.added.processes.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        変更
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        レーン: {preview.diff.modified.swimlanes.length}
                        <br />
                        工程: {preview.diff.modified.processes.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        削除
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        レーン: {preview.diff.removed.swimlanes.length}
                        <br />
                        工程: {preview.diff.removed.processes.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ステップ3: インポート中 */}
          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg
                  className="animate-spin text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-white font-medium">
                {progress.message}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.value}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {progress.value}%
              </p>
            </div>
          )}

          {/* ステップ4: 完了 */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                インポート完了
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                データが正常にインポートされました
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-end space-x-3">
          {step === 'select' && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              キャンセル
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!preview?.valid}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                インポート実行
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default ImportDialog;
