'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type {
  ExportFormat,
  ExportOptions,
  ExportData,
} from '@/lib/export';
import {
  EXPORT_FORMAT_LABELS,
  EXPORT_FORMAT_DESCRIPTIONS,
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_FLOW_OPTIONS,
  exportAndDownload,
} from '@/lib/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportData;
}

const AVAILABLE_FORMATS: ExportFormat[] = [
  'excel',
  'excel-flow',
  'csv',
  'bpmn-xml',
  'json',
];

export function ExportDialog({
  isOpen,
  onClose,
  data,
}: ExportDialogProps): JSX.Element | null {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [options, setOptions] = useState<Partial<ExportOptions>>(DEFAULT_EXPORT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormatChange = useCallback((newFormat: ExportFormat) => {
    setFormat(newFormat);
    setOptions((prev) => ({
      ...prev,
      format: newFormat,
    }));
  }, []);

  const handleOptionChange = useCallback(
    (key: keyof ExportOptions, value: boolean | string) => {
      setOptions((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      const result = await exportAndDownload(data, {
        ...options,
        format,
        flowOptions: format === 'excel-flow' ? DEFAULT_FLOW_OPTIONS : undefined,
      });

      if (!result.success) {
        setError(result.error || 'エクスポートに失敗しました');
        return;
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  }, [data, options, format, onClose]);

  const formatInfo = useMemo(() => ({
    label: EXPORT_FORMAT_LABELS[format],
    description: EXPORT_FORMAT_DESCRIPTIONS[format],
  }), [format]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            工程表をエクスポート
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data.processTable.name}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* エクスポート形式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              エクスポート形式
            </label>
            <div className="space-y-2">
              {AVAILABLE_FORMATS.map((f) => (
                <label
                  key={f}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    format === f
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={() => handleFormatChange(f)}
                    className="mt-0.5 mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {EXPORT_FORMAT_LABELS[f]}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {EXPORT_FORMAT_DESCRIPTIONS[f]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* オプション */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              オプション
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeCustomColumns ?? true}
                  onChange={(e) =>
                    handleOptionChange('includeCustomColumns', e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  カスタム列を含める
                </span>
              </label>

              {(format === 'excel' || format === 'excel-flow') && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeBpmnDetails ?? false}
                    onChange={(e) =>
                      handleOptionChange('includeBpmnDetails', e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    BPMN詳細情報を含める
                  </span>
                </label>
              )}

              {format === 'csv' && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    文字コード:
                  </span>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="csvEncoding"
                      value="utf-8"
                      checked={options.csvEncoding !== 'shift-jis'}
                      onChange={() => handleOptionChange('csvEncoding', 'utf-8')}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">UTF-8</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="csvEncoding"
                      value="shift-jis"
                      checked={options.csvEncoding === 'shift-jis'}
                      onChange={() => handleOptionChange('csvEncoding', 'shift-jis')}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Shift-JIS</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* データサマリー */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              エクスポートするデータ
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">工程数:</span>
                <span className="text-gray-900 dark:text-white">
                  {data.processes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">レーン数:</span>
                <span className="text-gray-900 dark:text-white">
                  {data.swimlanes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">カスタム列:</span>
                <span className="text-gray-900 dark:text-white">
                  {data.customColumns.length}
                </span>
              </div>
            </div>
          </div>

          {/* エラー */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            disabled={isExporting}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isExporting && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            )}
            エクスポート
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
