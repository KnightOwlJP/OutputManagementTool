'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import {
  CloudArrowUpIcon,
  ArrowPathIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';

interface BackupInfo {
  id: string;
  filename: string;
  filePath: string;
  size: number;
  createdAt: Date;
  isAutomatic: boolean;
}

interface BackupManagerProps {
  customPath?: string;
}

export default function BackupManager({ customPath }: BackupManagerProps) {
  const { showToast } = useToast();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.backup.list(customPath);
      if (result.success && result.backups) {
        setBackups(result.backups.map(b => ({
          ...b,
          createdAt: new Date(b.createdAt),
        })));
      } else {
        showToast('error', result.error || 'バックアップ一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
      showToast('error', 'バックアップ一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, [customPath]);

  const createBackup = async () => {
    setIsCreating(true);
    try {
      const result = await window.electron.backup.create(customPath, false);
      if (result.success) {
        showToast('success', 'バックアップを作成しました');
        await loadBackups();
      } else {
        showToast('error', result.error || 'バックアップの作成に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      showToast('error', 'バックアップの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const restoreBackup = async (backupPath: string, filename: string) => {
    if (!confirm(`バックアップ「${filename}」を復元しますか？\n現在のデータは上書きされます。`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const result = await window.electron.backup.restore(backupPath);
      if (result.success) {
        showToast('success', 'バックアップを復元しました。アプリケーションを再起動してください。');
      } else {
        showToast('error', result.error || 'バックアップの復元に失敗しました');
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      showToast('error', 'バックアップの復元に失敗しました');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async (backupPath: string, filename: string) => {
    if (!confirm(`バックアップ「${filename}」を削除しますか？`)) {
      return;
    }

    try {
      const result = await window.electron.backup.delete(backupPath);
      if (result.success) {
        showToast('success', 'バックアップを削除しました');
        await loadBackups();
      } else {
        showToast('error', result.error || 'バックアップの削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
      showToast('error', 'バックアップの削除に失敗しました');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-6 pb-0">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">バックアップ管理</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              startContent={<ArrowPathIcon className="w-4 h-4" />}
              onClick={loadBackups}
              isDisabled={isLoading}
            >
              更新
            </Button>
            <Button
              size="sm"
              color="primary"
              startContent={<CloudArrowUpIcon className="w-4 h-4" />}
              onClick={createBackup}
              isLoading={isCreating}
            >
              バックアップを作成
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            バックアップがありません
          </div>
        ) : (
          <Table aria-label="バックアップ一覧">
            <TableHeader>
              <TableColumn>ファイル名</TableColumn>
              <TableColumn>種類</TableColumn>
              <TableColumn>サイズ</TableColumn>
              <TableColumn>作成日時</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>
                    <span className="font-mono text-sm">{backup.filename}</span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={backup.isAutomatic ? 'default' : 'primary'}
                      startContent={backup.isAutomatic ? <ClockIcon className="w-3 h-3" /> : undefined}
                    >
                      {backup.isAutomatic ? '自動' : '手動'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(backup.size)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(backup.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="success"
                        onClick={() => restoreBackup(backup.filePath, backup.filename)}
                        isDisabled={isRestoring}
                      >
                        復元
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<TrashIcon className="w-4 h-4" />}
                        onClick={() => deleteBackup(backup.filePath, backup.filename)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
