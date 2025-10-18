'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Switch,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Button,
  Divider,
  Chip,
} from '@heroui/react';
import {
  Cog6ToothIcon,
  ArrowPathIcon,
  PaintBrushIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AppSettings, DEFAULT_SETTINGS, ProcessLevelDefinition } from '@/types/settings.types';

export default function SettingsPage() {
  const { showToast } = useToast();
  const { settings: contextSettings, updateSettings: contextUpdateSettings, resetSettings: contextResetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>(contextSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(contextSettings);
  }, [contextSettings]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Contextを通じて保存（LocalStorageへの保存も含む）
      contextUpdateSettings(localSettings);
      setHasChanges(false);
      showToast('success', '設定を保存しました');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('error', '設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm('すべての設定をデフォルトに戻しますか？')) {
      contextResetSettings();
      setLocalSettings(DEFAULT_SETTINGS);
      setHasChanges(false);
      showToast('info', '設定をデフォルトに戻しました');
    }
  };

  const updateSettings = (path: string[], value: any) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      setHasChanges(true);
      return newSettings;
    });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg">
                <Cog6ToothIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-50 dark:to-gray-300 bg-clip-text text-transparent">
                設定
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-11">
              アプリケーションの動作をカスタマイズ
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="bordered"
              onPress={resetSettings}
              startContent={<ArrowPathIcon className="w-5 h-5" />}
            >
              リセット
            </Button>
            <Button
              color="primary"
              onPress={saveSettings}
              isLoading={isSaving}
              isDisabled={!hasChanges}
              className="font-semibold"
            >
              {hasChanges ? '変更を保存' : '保存済み'}
            </Button>
          </div>
        </div>

        {/* 変更通知 */}
        {hasChanges && (
          <Card className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700">
            <CardBody className="p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ 未保存の変更があります。「変更を保存」ボタンをクリックして設定を保存してください。
              </p>
            </CardBody>
          </Card>
        )}

        {/* タブ */}
        <Tabs
          aria-label="設定カテゴリ"
          size="lg"
          classNames={{
            tabList: "bg-white dark:bg-gray-800 shadow-sm",
            cursor: "bg-primary-500",
            tab: "px-6",
          }}
        >
          {/* 同期設定 */}
          <Tab
            key="sync"
            title={
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-5 h-5" />
                <span>同期設定</span>
              </div>
            }
          >
            <Card className="shadow-sm mt-4">
              <CardHeader className="p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">同期設定</h2>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-50">自動同期</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        バックグラウンドで定期的に同期を実行します
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.sync.autoSyncEnabled}
                      onValueChange={(value) => updateSettings(['sync', 'autoSyncEnabled'], value)}
                    />
                  </div>

                  {localSettings.sync.autoSyncEnabled && (
                    <Input
                      type="number"
                      label="同期間隔（分）"
                      value={localSettings.sync.syncInterval.toString()}
                      onChange={(e) => updateSettings(['sync', 'syncInterval'], parseInt(e.target.value))}
                      min={1}
                      max={60}
                      labelPlacement="outside"
                      variant="bordered"
                    />
                  )}
                </div>

                <Divider />

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">同期方向の設定</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">BPMN → 工程表</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        BPMNの変更を工程表に反映
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.sync.bpmnToProcessEnabled}
                      onValueChange={(value) => updateSettings(['sync', 'bpmnToProcessEnabled'], value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">工程表 → BPMN</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        工程表の変更をBPMNに反映
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.sync.processToBpmnEnabled}
                      onValueChange={(value) => updateSettings(['sync', 'processToBpmnEnabled'], value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">工程表 → マニュアル</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        工程表の変更をマニュアルに反映
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.sync.processToManualEnabled}
                      onValueChange={(value) => updateSettings(['sync', 'processToManualEnabled'], value)}
                    />
                  </div>
                </div>

                <Divider />

                <div>
                  <Select
                    label="競合時の動作"
                    selectedKeys={[localSettings.sync.conflictResolution]}
                    onChange={(e) => updateSettings(['sync', 'conflictResolution'], e.target.value)}
                    labelPlacement="outside"
                    variant="bordered"
                  >
                    <SelectItem key="manual">手動で解決</SelectItem>
                    <SelectItem key="bpmn-priority">BPMNを優先</SelectItem>
                    <SelectItem key="process-priority">工程表を優先</SelectItem>
                  </Select>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    同期時に競合が発生した場合の処理方法
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ 注意:</strong> Phase 6では同期機能の基盤のみ実装されています。完全な自動同期機能はPhase 7以降で利用可能になります。
                  </p>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* 工程レベル定義 */}
          <Tab
            key="levels"
            title={
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>工程レベル</span>
              </div>
            }
          >
            <Card className="shadow-sm mt-4">
              <CardHeader className="p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">工程レベル定義</h2>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                {Object.entries(localSettings.processLevels).map(([key, level]) => (
                  <Card key={key} className="shadow-sm border border-gray-200 dark:border-gray-700">
                    <CardBody className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: level.color }}
                          />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                            {level.name}
                          </h3>
                          <Chip size="sm" variant="flat">
                            {level.key}
                          </Chip>
                        </div>
                        <Switch
                          size="sm"
                          isSelected={level.enabled}
                          onValueChange={(value) => 
                            updateSettings(['processLevels', key, 'enabled'], value)
                          }
                        />
                      </div>

                      {level.enabled && (
                        <>
                          <Input
                            label="表示名"
                            value={level.name}
                            onChange={(e) => 
                              updateSettings(['processLevels', key, 'name'], e.target.value)
                            }
                            labelPlacement="outside"
                            variant="bordered"
                          />

                          <Input
                            label="説明"
                            value={level.description}
                            onChange={(e) => 
                              updateSettings(['processLevels', key, 'description'], e.target.value)
                            }
                            labelPlacement="outside"
                            variant="bordered"
                          />

                          <div className="flex gap-4">
                            <Input
                              type="color"
                              label="カラー"
                              value={level.color}
                              onChange={(e) => 
                                updateSettings(['processLevels', key, 'color'], e.target.value)
                              }
                              labelPlacement="outside"
                              variant="bordered"
                              className="max-w-[200px]"
                            />
                          </div>
                        </>
                      )}
                    </CardBody>
                  </Card>
                ))}

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ 注意:</strong> レベルを無効にすると、そのレベルの工程は作成できなくなります。既存の工程には影響しません。
                  </p>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* UI設定 */}
          <Tab
            key="ui"
            title={
              <div className="flex items-center gap-2">
                <PaintBrushIcon className="w-5 h-5" />
                <span>表示設定</span>
              </div>
            }
          >
            <Card className="shadow-sm mt-4">
              <CardHeader className="p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">表示設定</h2>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                {/* テーマ選択 */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    テーマ
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* ライトモード */}
                    <button
                      onClick={() => updateSettings(['ui', 'theme'], 'light')}
                      className={`
                        flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${localSettings.ui.theme === 'light' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                        <SunIcon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                          ライト
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          明るい表示
                        </div>
                      </div>
                      {localSettings.ui.theme === 'light' && (
                        <Chip size="sm" color="primary" variant="flat">選択中</Chip>
                      )}
                    </button>

                    {/* ダークモード */}
                    <button
                      onClick={() => updateSettings(['ui', 'theme'], 'dark')}
                      className={`
                        flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${localSettings.ui.theme === 'dark' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                        <MoonIcon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                          ダーク
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          暗い表示
                        </div>
                      </div>
                      {localSettings.ui.theme === 'dark' && (
                        <Chip size="sm" color="primary" variant="flat">選択中</Chip>
                      )}
                    </button>

                    {/* システム設定 */}
                    <button
                      onClick={() => updateSettings(['ui', 'theme'], 'system')}
                      className={`
                        flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${localSettings.ui.theme === 'system' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 text-white">
                        <ComputerDesktopIcon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                          システム
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          OS設定に従う
                        </div>
                      </div>
                      {localSettings.ui.theme === 'system' && (
                        <Chip size="sm" color="primary" variant="flat">選択中</Chip>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    アプリケーション全体の表示テーマを変更します。変更は即座に反映されます。
                  </p>
                </div>

                <Divider />                <Select
                  label="デフォルトビュー"
                  selectedKeys={[localSettings.ui.defaultView]}
                  onChange={(e) => updateSettings(['ui', 'defaultView'], e.target.value)}
                  labelPlacement="outside"
                  variant="bordered"
                >
                  <SelectItem key="tree">ツリービュー</SelectItem>
                  <SelectItem key="table">テーブルビュー</SelectItem>
                </Select>

                <Input
                  type="number"
                  label="ページあたりの表示数"
                  value={localSettings.ui.itemsPerPage.toString()}
                  onChange={(e) => updateSettings(['ui', 'itemsPerPage'], parseInt(e.target.value))}
                  min={10}
                  max={100}
                  labelPlacement="outside"
                  variant="bordered"
                />

                <Divider />

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">アニメーション</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      UIのアニメーション効果を有効化
                    </p>
                  </div>
                  <Switch
                    isSelected={localSettings.ui.animationsEnabled}
                    onValueChange={(value) => updateSettings(['ui', 'animationsEnabled'], value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">コンパクトモード</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      より多くの情報を表示
                    </p>
                  </div>
                  <Switch
                    isSelected={localSettings.ui.compactMode}
                    onValueChange={(value) => updateSettings(['ui', 'compactMode'], value)}
                  />
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* エクスポート設定 */}
          <Tab
            key="export"
            title={
              <div className="flex items-center gap-2">
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>エクスポート</span>
              </div>
            }
          >
            <Card className="shadow-sm mt-4">
              <CardHeader className="p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">エクスポート設定</h2>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                <Select
                  label="デフォルトフォーマット"
                  selectedKeys={[localSettings.export.defaultFormat]}
                  onChange={(e) => updateSettings(['export', 'defaultFormat'], e.target.value)}
                  labelPlacement="outside"
                  variant="bordered"
                >
                  <SelectItem key="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem key="csv">CSV (.csv)</SelectItem>
                  <SelectItem key="json">JSON (.json)</SelectItem>
                  <SelectItem key="pdf">PDF (.pdf)</SelectItem>
                </Select>

                <Input
                  label="ファイル名テンプレート"
                  value={localSettings.export.filenameTemplate}
                  onChange={(e) => updateSettings(['export', 'filenameTemplate'], e.target.value)}
                  labelPlacement="outside"
                  variant="bordered"
                  description="使用可能: {projectName}, {date}, {time}"
                />

                <Input
                  label="日付フォーマット"
                  value={localSettings.export.dateFormat}
                  onChange={(e) => updateSettings(['export', 'dateFormat'], e.target.value)}
                  labelPlacement="outside"
                  variant="bordered"
                  description="例: YYYY-MM-DD, YYYYMMDD, DD/MM/YYYY"
                />

                <Divider />

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">メタデータを含める</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      作成日時、更新日時などの情報を出力
                    </p>
                  </div>
                  <Switch
                    isSelected={localSettings.export.includeMetadata}
                    onValueChange={(value) => updateSettings(['export', 'includeMetadata'], value)}
                  />
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* バックアップ設定 */}
          <Tab
            key="backup"
            title={
              <div className="flex items-center gap-2">
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>バックアップ</span>
              </div>
            }
          >
            <Card className="shadow-sm mt-4">
              <CardHeader className="p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">バックアップ設定</h2>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">自動バックアップ</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      定期的にデータをバックアップ
                    </p>
                  </div>
                  <Switch
                    isSelected={localSettings.backup.autoBackupEnabled}
                    onValueChange={(value) => updateSettings(['backup', 'autoBackupEnabled'], value)}
                  />
                </div>

                {localSettings.backup.autoBackupEnabled && (
                  <>
                    <Input
                      type="number"
                      label="バックアップ間隔（時間）"
                      value={localSettings.backup.backupInterval.toString()}
                      onChange={(e) => updateSettings(['backup', 'backupInterval'], parseInt(e.target.value))}
                      min={1}
                      max={168}
                      labelPlacement="outside"
                      variant="bordered"
                    />

                    <Input
                      type="number"
                      label="保持するバックアップ数"
                      value={localSettings.backup.maxBackups.toString()}
                      onChange={(e) => updateSettings(['backup', 'maxBackups'], parseInt(e.target.value))}
                      min={1}
                      max={50}
                      labelPlacement="outside"
                      variant="bordered"
                    />

                    <Input
                      label="バックアップ先パス"
                      value={localSettings.backup.backupPath}
                      onChange={(e) => updateSettings(['backup', 'backupPath'], e.target.value)}
                      labelPlacement="outside"
                      variant="bordered"
                      placeholder="空欄の場合はデフォルトパスを使用"
                    />
                  </>
                )}

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ 推奨:</strong> 重要なデータは定期的にバックアップすることをお勧めします。バックアップファイルは暗号化されて保存されます。
                  </p>
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </AppLayout>
  );
}


