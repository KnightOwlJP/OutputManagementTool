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
import BackupManager from '@/components/backup/BackupManager';
import { useToast } from '@/contexts/ToastContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings.types';

export default function SettingsPage() {
  const { showToast } = useToast();
  const { settings: contextSettings, updateSettings: contextUpdateSettings, resetSettings: contextResetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>(contextSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [syncSchedulerEnabled, setSyncSchedulerEnabled] = useState(false);

  useEffect(() => {
    setLocalSettings(contextSettings);
    
    // バックアップスケジューラーの状態を取得
    window.electron.backup.getSchedulerStatus().then(result => {
      if (result.success && result.status) {
        setSchedulerEnabled(result.status.enabled);
      }
    });
    
    // Phase 9: 同期スケジューラーは非推奨（trinity sync機能削除）
    // 同期スケジューラーの状態を取得
    // window.electron.sync.getSchedulerStatus().then(result => {
    //   if (result.success && result.status) {
    //     setSyncSchedulerEnabled(result.status.enabled);
    //   }
    // });
  }, [contextSettings]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Contextを通じて保存（LocalStorageへの保存も含む）
      contextUpdateSettings(localSettings);
      
      // 自動バックアップスケジューラーを制御
      if (localSettings.backup.autoBackupEnabled) {
        const result = await window.electron.backup.startScheduler(
          localSettings.backup.backupInterval,
          localSettings.backup.maxBackups,
          localSettings.backup.backupPath || undefined
        );
        if (result.success) {
          setSchedulerEnabled(true);
        }
      } else {
        await window.electron.backup.stopScheduler();
        setSchedulerEnabled(false);
      }
      
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
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">同期設定</h2>
                  {syncSchedulerEnabled && (
                    <Chip size="sm" color="success" variant="flat">
                      スケジューラー実行中
                    </Chip>
                  )}
                </div>
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

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>⚠️ 注意:</strong> 自動同期スケジューラーはプロジェクトとBPMNが選択されている場合にのみ起動します。
                    各プロジェクトページで個別に設定してください。
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ 三位一体同期:</strong> Phase 6で実装完了。BPMN・工程表・マニュアルの自動連携が可能です。
                  </p>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* BPMN設定 */}
          <Tab
            key="bpmn"
            title={
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                <span>BPMN設定</span>
              </div>
            }
          >
            <Card className="shadow-sm mt-4">
              <CardHeader className="p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">BPMN設定</h2>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">デフォルト要素設定</h3>
                  
                  <Select
                    label="デフォルトタスクタイプ"
                    selectedKeys={[localSettings.bpmn?.defaultTaskType || 'userTask']}
                    onChange={(e) => updateSettings(['bpmn', 'defaultTaskType'], e.target.value)}
                    labelPlacement="outside"
                    variant="bordered"
                  >
                    <SelectItem key="userTask">ユーザータスク</SelectItem>
                    <SelectItem key="serviceTask">サービスタスク</SelectItem>
                    <SelectItem key="manualTask">手動タスク</SelectItem>
                    <SelectItem key="scriptTask">スクリプトタスク</SelectItem>
                    <SelectItem key="businessRuleTask">ビジネスルールタスク</SelectItem>
                    <SelectItem key="sendTask">送信タスク</SelectItem>
                    <SelectItem key="receiveTask">受信タスク</SelectItem>
                  </Select>

                  <Select
                    label="デフォルトゲートウェイタイプ"
                    selectedKeys={[localSettings.bpmn?.defaultGatewayType || 'exclusive']}
                    onChange={(e) => updateSettings(['bpmn', 'defaultGatewayType'], e.target.value)}
                    labelPlacement="outside"
                    variant="bordered"
                  >
                    <SelectItem key="exclusive">排他ゲートウェイ</SelectItem>
                    <SelectItem key="parallel">並列ゲートウェイ</SelectItem>
                    <SelectItem key="inclusive">包含ゲートウェイ</SelectItem>
                  </Select>
                </div>

                <Divider />

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">エディタ設定</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">グリッドスナップ</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        要素をグリッドに吸着させる
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.bpmn?.gridSnap ?? true}
                      onValueChange={(value) => updateSettings(['bpmn', 'gridSnap'], value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">自動レイアウト</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        要素追加時に自動的に整列
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.bpmn?.autoLayout ?? false}
                      onValueChange={(value) => updateSettings(['bpmn', 'autoLayout'], value)}
                    />
                  </div>

                  <Input
                    type="number"
                    label="グリッドサイズ（px）"
                    value={(localSettings.bpmn?.gridSize || 10).toString()}
                    onChange={(e) => updateSettings(['bpmn', 'gridSize'], parseInt(e.target.value))}
                    min={5}
                    max={50}
                    labelPlacement="outside"
                    variant="bordered"
                  />
                </div>

                <Divider />

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">ELK自動レイアウト</h3>
                  
                  <Select
                    label="レイアウトアルゴリズム"
                    selectedKeys={[localSettings.bpmn?.elkLayoutAlgorithm || 'layered']}
                    onChange={(e) => updateSettings(['bpmn', 'elkLayoutAlgorithm'], e.target.value)}
                    labelPlacement="outside"
                    variant="bordered"
                    description="BPMN要素の自動配置アルゴリズム"
                  >
                    <SelectItem key="layered">Layered（階層型）</SelectItem>
                    <SelectItem key="stress">Stress（応力型）</SelectItem>
                    <SelectItem key="mrtree">MrTree（ツリー型）</SelectItem>
                    <SelectItem key="force">Force（力学型）</SelectItem>
                  </Select>

                  <Input
                    type="number"
                    label="ノード間スペース（px）"
                    value={(localSettings.bpmn?.elkNodeSpacing || 50).toString()}
                    onChange={(e) => updateSettings(['bpmn', 'elkNodeSpacing'], parseInt(e.target.value))}
                    min={20}
                    max={200}
                    labelPlacement="outside"
                    variant="bordered"
                    description="BPMN要素間の水平スペース"
                  />

                  <Input
                    type="number"
                    label="レイヤー間スペース（px）"
                    value={(localSettings.bpmn?.elkLayerSpacing || 100).toString()}
                    onChange={(e) => updateSettings(['bpmn', 'elkLayerSpacing'], parseInt(e.target.value))}
                    min={50}
                    max={300}
                    labelPlacement="outside"
                    variant="bordered"
                    description="フローの階層間の垂直スペース"
                  />

                  <Select
                    label="エッジルーティング"
                    selectedKeys={[localSettings.bpmn?.elkEdgeRouting || 'orthogonal']}
                    onChange={(e) => updateSettings(['bpmn', 'elkEdgeRouting'], e.target.value)}
                    labelPlacement="outside"
                    variant="bordered"
                    description="フロー線の描画スタイル"
                  >
                    <SelectItem key="orthogonal">直交（Orthogonal）</SelectItem>
                    <SelectItem key="polyline">折れ線（Polyline）</SelectItem>
                    <SelectItem key="splines">曲線（Splines）</SelectItem>
                  </Select>
                </div>

                <Divider />

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">エクスポート設定</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">BPMN 2.0準拠</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        標準的なBPMN 2.0 XML形式で出力
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.bpmn?.exportBpmn20Compliant ?? true}
                      onValueChange={(value) => updateSettings(['bpmn', 'exportBpmn20Compliant'], value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">ダイアグラム情報を含める</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        レイアウト情報（BPMNDiagram）を含める
                      </p>
                    </div>
                    <Switch
                      isSelected={localSettings.bpmn?.includeDiagramInfo ?? true}
                      onValueChange={(value) => updateSettings(['bpmn', 'includeDiagramInfo'], value)}
                    />
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>✨ ELK Layout:</strong> Eclipse Layout Kernelを使用した高度な自動レイアウト機能です。
                    アルゴリズムとパラメータを調整して最適な図形配置を実現できます。
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ BPMN 2.0:</strong> 標準準拠のXML出力により、Camunda、Signavio等の他のBPMNツールとの互換性があります。
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
                  <SelectItem key="bpmn">BPMN 2.0 XML (.bpmn)</SelectItem>
                  <SelectItem key="pdf">PDF (.pdf)</SelectItem>
                </Select>

                <Input
                  label="ファイル名テンプレート"
                  value={localSettings.export.filenameTemplate}
                  onChange={(e) => updateSettings(['export', 'filenameTemplate'], e.target.value)}
                  labelPlacement="outside"
                  variant="bordered"
                  description="使用可能: {projectName}, {date}, {time}, {processTableName}"
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

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ BPMN 2.0エクスポート:</strong> 標準準拠のXML形式で出力され、他のBPMNツール（Camunda、Signavio等）との互換性があります。
                  </p>
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
            <div className="space-y-6 mt-4">
              {/* 自動バックアップ設定 */}
              <Card className="shadow-sm">
                <CardHeader className="p-6 pb-0">
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">自動バックアップ設定</h2>
                    {schedulerEnabled && (
                      <Chip size="sm" color="success" variant="flat">
                        スケジューラー実行中
                      </Chip>
                    )}
                  </div>
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

                      <div className="space-y-2">
                        <Input
                          label="バックアップ先パス"
                          value={localSettings.backup.backupPath}
                          onChange={(e) => updateSettings(['backup', 'backupPath'], e.target.value)}
                          labelPlacement="outside"
                          variant="bordered"
                          placeholder="空欄の場合はデフォルトパスを使用"
                          endContent={
                            <Button
                              size="sm"
                              variant="flat"
                              onClick={async () => {
                                const path = await window.electron.backup.selectDirectory();
                                if (path) {
                                  updateSettings(['backup', 'backupPath'], path);
                                }
                              }}
                            >
                              参照
                            </Button>
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>ℹ️ 推奨:</strong> 重要なデータは定期的にバックアップすることをお勧めします。
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* バックアップ管理 */}
              <BackupManager customPath={localSettings.backup.backupPath || undefined} />
            </div>
          </Tab>
        </Tabs>
      </div>
    </AppLayout>
  );
}


