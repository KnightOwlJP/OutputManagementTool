/**
 * 工程作成・編集モーダル
 * 工程の基本情報とBPMN項目を入力
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Tabs,
  Tab,
  Checkbox,
} from '@heroui/react';
import { Process, Swimlane, BpmnTaskType, BpmnElementType, GatewayType, EventType, IntermediateEventType, DataObject, ConditionalFlow, MessageFlow, CustomColumn, ProcessTable } from '@/types/models';
import { useToast } from '@/contexts/ToastContext';
import { CustomColumnInputGroup } from './CustomColumnInput';
import { toSeconds, fromSeconds } from '@/lib/common';
import { TIME_UNITS_FOR_INPUT, TIME_UNIT_LABELS, type TimeUnit } from '@/lib/common/constants';

// 入力用の時間単位オプション
const TIME_UNIT_OPTIONS: { value: TimeUnit; label: string }[] = TIME_UNITS_FOR_INPUT.map(unit => ({
  value: unit,
  label: TIME_UNIT_LABELS[unit],
}));

interface ProcessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Process>) => Promise<void>;
  editingProcess?: Process | null;
  swimlanes: Swimlane[];
  processes: Process[];
  customColumns: CustomColumn[];
  dataObjects?: DataObject[]; // 将来実装用
  processTable: ProcessTable;
}

const TASK_TYPES: { value: BpmnTaskType; label: string; icon: string }[] = [
  { value: 'userTask', label: 'ユーザータスク', icon: '👤' },
  { value: 'serviceTask', label: 'サービスタスク', icon: '⚙️' },
  { value: 'scriptTask', label: 'スクリプトタスク', icon: '📜' },
  { value: 'manualTask', label: '手動タスク', icon: '✋' },
  { value: 'businessRuleTask', label: 'ビジネスルールタスク', icon: '📋' },
  { value: 'sendTask', label: '送信タスク', icon: '📤' },
  { value: 'receiveTask', label: '受信タスク', icon: '📥' },
];

const GATEWAY_TYPES: { value: GatewayType; label: string; icon: string; description: string }[] = [
  { value: 'exclusive', label: '排他ゲートウェイ', icon: '◆', description: '1つの経路のみ選択' },
  { value: 'parallel', label: '並列ゲートウェイ', icon: '+', description: 'すべての経路を並行実行' },
  { value: 'inclusive', label: '包含ゲートウェイ', icon: '○', description: '複数の経路を選択可能' },
];

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'start', label: '開始イベント', icon: '▶️' },
  { value: 'end', label: '終了イベント', icon: '⏹️' },
  { value: 'intermediate', label: '中間イベント', icon: '⏸️' },
];

const INTERMEDIATE_EVENT_TYPES: { value: IntermediateEventType; label: string; icon: string }[] = [
  { value: 'timer', label: 'タイマー', icon: '⏰' },
  { value: 'message', label: 'メッセージ', icon: '✉️' },
  { value: 'error', label: 'エラー', icon: '⚠️' },
  { value: 'signal', label: 'シグナル', icon: '📡' },
  { value: 'conditional', label: '条件', icon: '❓' },
];

const SKILL_LEVELS: { value: Process['skillLevel']; label: string }[] = [
  { value: '-', label: '指定なし' },
  { value: 'L', label: '低 (L)' },
  { value: 'M', label: '中 (M)' },
  { value: 'H', label: '高 (H)' },
];

export function ProcessFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingProcess,
  swimlanes,
  processes,
  customColumns,
  dataObjects = [], // デフォルト値
  processTable,
}: ProcessFormModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // フォーム状態
  const [name, setName] = useState('');
  const [mediumName, setMediumName] = useState('');
  const [smallName, setSmallName] = useState('');
  const [detailName, setDetailName] = useState('');
  const [parentLargeName, setParentLargeName] = useState('');
  const [parentMediumName, setParentMediumName] = useState('');
  const [parentSmallName, setParentSmallName] = useState('');
  const [laneId, setLaneId] = useState('');
  const [workValue, setWorkValue] = useState<string>('');
  const [workUnit, setWorkUnit] = useState<TimeUnit>('hours');
  const [leadTimeValue, setLeadTimeValue] = useState<string>('');
  const [leadTimeUnit, setLeadTimeUnit] = useState<TimeUnit>('hours');
  const [skillLevel, setSkillLevel] = useState<Process['skillLevel']>('-');
  const [systemName, setSystemName] = useState('');
  const [parallelAllowed, setParallelAllowed] = useState(false);
  const [bpmnElement, setBpmnElement] = useState<BpmnElementType>('task');
  const [taskType, setTaskType] = useState<BpmnTaskType>('userTask');
  const [gatewayType, setGatewayType] = useState<GatewayType>('exclusive');
  const [eventType, setEventType] = useState<EventType>('start');
  const [intermediateEventType, setIntermediateEventType] = useState<IntermediateEventType>('timer');
  const [eventDetails, setEventDetails] = useState('');
  const [documentation, setDocumentation] = useState('');
  const [beforeProcessIds, setBeforeProcessIds] = useState<string[]>([]);
  const [inputDataObjects, setInputDataObjects] = useState<string[]>([]);
  const [outputDataObjects, setOutputDataObjects] = useState<string[]>([]);
  const [conditionalFlows, setConditionalFlows] = useState<ConditionalFlow[]>([]);
  const [messageFlows, setMessageFlows] = useState<MessageFlow[]>([]);
  const [customColumnValues, setCustomColumnValues] = useState<Record<string, any>>({});
  const [issueDetail, setIssueDetail] = useState('');
  const [issueCategory, setIssueCategory] = useState('');
  const [countermeasurePolicy, setCountermeasurePolicy] = useState('');
  const [issueWorkHours, setIssueWorkHours] = useState<string>('');
  const [timeReductionHours, setTimeReductionHours] = useState<string>('');
  const [rateReductionPercent, setRateReductionPercent] = useState<string>('');
  
  // 新規追加モードの状態
  const [isNewLargeName, setIsNewLargeName] = useState(false);
  const [isNewMediumName, setIsNewMediumName] = useState(false);
  const [isNewSmallName, setIsNewSmallName] = useState(false);
  const [newLargeNameInput, setNewLargeNameInput] = useState('');
  const [newMediumNameInput, setNewMediumNameInput] = useState('');
  const [newSmallNameInput, setNewSmallNameInput] = useState('');

  // 上位工程の選択肢を構築
  const existingLargeNames = Array.from(new Set(processes.map(p => p.largeName).filter(Boolean))) as string[];
  
  // 選択された大工程に属する中工程を抽出
  const existingMediumNames = Array.from(new Set(
    processes
      .filter(p => !parentLargeName || p.largeName === parentLargeName)
      .map(p => p.mediumName)
      .filter(Boolean)
  )) as string[];
  
  // 選択された中工程に属する小工程を抽出
  const existingSmallNames = Array.from(new Set(
    processes
      .filter(p => 
        (!parentLargeName || p.largeName === parentLargeName) &&
        (!parentMediumName || p.mediumName === parentMediumName)
      )
      .map(p => p.smallName)
      .filter(Boolean)
  )) as string[];

  // 大工程選択時に中工程・小工程をリセット
  const handleLargeNameChange = (value: string) => {
    if (value === '__NEW__') {
      setIsNewLargeName(true);
      setParentLargeName('');
    } else {
      setIsNewLargeName(false);
      setNewLargeNameInput('');
      setParentLargeName(value);
      // 大工程が変わったら中工程・小工程をリセット
      setParentMediumName('');
      setParentSmallName('');
      setIsNewMediumName(false);
      setIsNewSmallName(false);
    }
  };

  // 中工程選択時に小工程をリセット
  const handleMediumNameChange = (value: string) => {
    if (value === '__NEW__') {
      setIsNewMediumName(true);
      setParentMediumName('');
    } else {
      setIsNewMediumName(false);
      setNewMediumNameInput('');
      setParentMediumName(value);
      // 中工程が変わったら小工程をリセット
      setParentSmallName('');
      setIsNewSmallName(false);
    }
  };

  // 小工程選択
  const handleSmallNameChange = (value: string) => {
    if (value === '__NEW__') {
      setIsNewSmallName(true);
      setParentSmallName('');
    } else {
      setIsNewSmallName(false);
      setNewSmallNameInput('');
      setParentSmallName(value);
    }
  };

  // 新規入力確定時の処理
  const confirmNewLargeName = () => {
    if (newLargeNameInput.trim()) {
      setParentLargeName(newLargeNameInput.trim());
      setIsNewLargeName(false);
    }
  };

  const confirmNewMediumName = () => {
    if (newMediumNameInput.trim()) {
      setParentMediumName(newMediumNameInput.trim());
      setIsNewMediumName(false);
    }
  };

  const confirmNewSmallName = () => {
    if (newSmallNameInput.trim()) {
      setParentSmallName(newSmallNameInput.trim());
      setIsNewSmallName(false);
    }
  };

  // 編集時の初期値設定
  useEffect(() => {
    if (editingProcess) {
      setName(editingProcess.name);
      setMediumName(editingProcess.mediumName || '');
      setSmallName(editingProcess.smallName || '');
      setDetailName(editingProcess.detailName || '');
      setParentLargeName(editingProcess.largeName || '');
      setParentMediumName(editingProcess.mediumName || '');
      setParentSmallName(editingProcess.smallName || '');
      setLaneId(editingProcess.laneId);
      // 工数の初期値設定（保存された単位があればそれを使用、なければ時間）
      const savedWorkUnit = (editingProcess.workUnitPref as TimeUnit) || 'hours';
      setWorkUnit(TIME_UNITS_FOR_INPUT.includes(savedWorkUnit as any) ? savedWorkUnit : 'hours');
      setWorkValue(
        editingProcess.workSeconds !== undefined && editingProcess.workSeconds !== null
          ? String(fromSeconds(editingProcess.workSeconds, savedWorkUnit) ?? '')
          : ''
      );
      // リードタイムの初期値設定（保存された単位があればそれを使用、なければ時間）
      const savedLeadTimeUnit = (editingProcess.leadTimeUnit as TimeUnit) || 'hours';
      setLeadTimeUnit(TIME_UNITS_FOR_INPUT.includes(savedLeadTimeUnit as any) ? savedLeadTimeUnit : 'hours');
      setLeadTimeValue(
        editingProcess.leadTimeSeconds !== undefined && editingProcess.leadTimeSeconds !== null
          ? String(fromSeconds(editingProcess.leadTimeSeconds, savedLeadTimeUnit) ?? '')
          : ''
      );
      setSkillLevel(editingProcess.skillLevel || '-');
      setSystemName(editingProcess.systemName || '');
      setParallelAllowed(!!editingProcess.parallelAllowed);
      setBpmnElement(editingProcess.bpmnElement);
      setTaskType(editingProcess.taskType || 'userTask');
      setGatewayType(editingProcess.gatewayType || 'exclusive');
      setEventType(editingProcess.eventType || 'start');
      setIntermediateEventType(editingProcess.intermediateEventType || 'timer');
      setEventDetails(editingProcess.eventDetails || '');
      setDocumentation(editingProcess.documentation || '');
      setBeforeProcessIds(editingProcess.beforeProcessIds || []);
      setInputDataObjects(editingProcess.inputDataObjects || []);
      setOutputDataObjects(editingProcess.outputDataObjects || []);
      setConditionalFlows(editingProcess.conditionalFlows || []);
      setMessageFlows(editingProcess.messageFlows || []);
      setCustomColumnValues(editingProcess.customColumns || {});
      setIssueDetail(editingProcess.issueDetail || '');
      setIssueCategory(editingProcess.issueCategory || '');
      setCountermeasurePolicy(editingProcess.countermeasurePolicy || '');
      setIssueWorkHours(
        editingProcess.issueWorkSeconds !== undefined && editingProcess.issueWorkSeconds !== null
          ? String(editingProcess.issueWorkSeconds / 3600)
          : ''
      );
      setTimeReductionHours(
        editingProcess.timeReductionSeconds !== undefined && editingProcess.timeReductionSeconds !== null
          ? String(editingProcess.timeReductionSeconds / 3600)
          : ''
      );
      setRateReductionPercent(
        editingProcess.rateReductionPercent !== undefined && editingProcess.rateReductionPercent !== null
          ? String(editingProcess.rateReductionPercent)
          : ''
      );
    } else {
      // 新規作成時はリセット
      setName('');
      setMediumName('');
      setSmallName('');
      setDetailName('');
      setParentLargeName('');
      setParentMediumName('');
      setParentSmallName('');
      setLaneId(swimlanes[0]?.id || '');
      setWorkValue('');
      setWorkUnit('hours');
      setLeadTimeValue('');
      setLeadTimeUnit('hours');
      setSkillLevel('-');
      setSystemName('');
      setParallelAllowed(false);
      setBpmnElement('task');
      setTaskType('userTask');
      setGatewayType('exclusive');
      setEventType('start');
      setIntermediateEventType('timer');
      setEventDetails('');
      setDocumentation('');
      setBeforeProcessIds([]);
      setInputDataObjects([]);
      setOutputDataObjects([]);
      setConditionalFlows([]);
      setMessageFlows([]);
      setCustomColumnValues({});
      setIssueDetail('');
      setIssueCategory('');
      setCountermeasurePolicy('');
      setIssueWorkHours('');
      setTimeReductionHours('');
      setRateReductionPercent('');
    }
    // 新規追加モードもリセット
    setIsNewLargeName(false);
    setIsNewMediumName(false);
    setIsNewSmallName(false);
    setNewLargeNameInput('');
    setNewMediumNameInput('');
    setNewSmallNameInput('');
  }, [editingProcess, swimlanes, isOpen]);

  // フォーム送信
  const handleSubmit = async () => {
    const isEditing = !!editingProcess;
    const errors: string[] = [];
    const requiresMedium = ['medium', 'small', 'detail'].includes(processTable.level);
    const requiresSmall = ['small', 'detail'].includes(processTable.level);
    const requiresDetail = processTable.level === 'detail';

    const largeNameValue = name.trim();
    const mediumNameValue = mediumName.trim();
    const smallNameValue = smallName.trim();
    const detailNameValue = detailName.trim();
    const parentLargeNameValue = parentLargeName.trim();
    const parentMediumNameValue = parentMediumName.trim();
    const parentSmallNameValue = parentSmallName.trim();

    const currentNameValue = (() => {
      if (processTable.level === 'medium') return mediumNameValue;
      if (processTable.level === 'small') return smallNameValue;
      if (processTable.level === 'detail') return detailNameValue;
      return largeNameValue;
    })();
    const workValueNumber = workValue.trim() === '' ? undefined : Number(workValue);
    const leadTimeValueNumber = leadTimeValue.trim() === '' ? undefined : Number(leadTimeValue);
    const issueWorkHoursNumber = issueWorkHours.trim() === '' ? undefined : Number(issueWorkHours);
    const timeReductionHoursNumber = timeReductionHours.trim() === '' ? undefined : Number(timeReductionHours);
    const rateReductionPercentNumber = rateReductionPercent.trim() === '' ? undefined : Number(rateReductionPercent);

    if (!currentNameValue) errors.push('工程名は必須です');
    if (!laneId) errors.push('スイムレーンを選択してください');
    if (workValue.trim() !== '' && Number.isNaN(workValueNumber)) errors.push('工数は数値で入力してください');
    if (leadTimeValue.trim() !== '' && Number.isNaN(leadTimeValueNumber)) errors.push('リードタイムは数値で入力してください');

    if (processTable.isInvestigation) {
      if (issueWorkHours.trim() !== '' && Number.isNaN(issueWorkHoursNumber as number)) errors.push('課題工数は数値で入力してください');
      if (timeReductionHours.trim() !== '' && Number.isNaN(timeReductionHoursNumber as number)) errors.push('時間削減しろは数値で入力してください');
      if (rateReductionPercent.trim() !== '' && Number.isNaN(rateReductionPercentNumber as number)) errors.push('割合削減しろは数値で入力してください');
    }

    if (errors.length > 0) {
      showToast('error', errors.join('\n'));
      return;
    }

    let resolvedLargeName = processTable.level === 'large' ? currentNameValue : parentLargeNameValue || undefined;
    let resolvedMediumName = processTable.level === 'medium' ? currentNameValue : mediumNameValue || parentMediumNameValue || undefined;
    let resolvedSmallName = processTable.level === 'small' ? currentNameValue : smallNameValue || parentSmallNameValue || undefined;
    let resolvedDetailName = processTable.level === 'detail' ? currentNameValue : detailNameValue || undefined;

    setIsSubmitting(true);
    try {
      const normalizedSystemName = systemName.trim() === '' ? null : systemName.trim();
      const normalizedDocumentation = documentation.trim() === '' ? null : documentation.trim();
      const normalizedEventDetails = eventDetails.trim() === '' ? null : eventDetails.trim();
      const normalizedIssueDetail = issueDetail.trim() === '' ? null : issueDetail.trim();
      const normalizedIssueCategory = issueCategory.trim() === '' ? null : issueCategory.trim();
      const normalizedCountermeasurePolicy = countermeasurePolicy.trim() === '' ? null : countermeasurePolicy.trim();

      const data: Partial<Process> = {
        name: currentNameValue,
        largeName: resolvedLargeName,
        mediumName: resolvedMediumName,
        smallName: resolvedSmallName,
        detailName: resolvedDetailName,
        laneId,
        workSeconds: workValueNumber !== undefined ? toSeconds(workValueNumber, workUnit) : isEditing ? null : undefined,
        workUnitPref: workValueNumber !== undefined ? workUnit : undefined,
        leadTimeSeconds: leadTimeValueNumber !== undefined ? toSeconds(leadTimeValueNumber, leadTimeUnit) : isEditing ? null : undefined,
        leadTimeUnit: leadTimeValueNumber !== undefined ? leadTimeUnit : undefined,
        skillLevel: skillLevel === '-' ? undefined : skillLevel,
        systemName: normalizedSystemName,
        parallelAllowed,
        bpmnElement,
        taskType: bpmnElement === 'task' ? taskType : undefined,
        gatewayType: bpmnElement === 'gateway' ? gatewayType : undefined,
        eventType: bpmnElement === 'event' ? eventType : undefined,
        intermediateEventType: bpmnElement === 'event' && eventType === 'intermediate' ? intermediateEventType : undefined,
        eventDetails: bpmnElement === 'event' ? normalizedEventDetails : undefined,
        documentation: normalizedDocumentation,
        beforeProcessIds: beforeProcessIds,
        inputDataObjects: inputDataObjects.length > 0 ? inputDataObjects : undefined,
        outputDataObjects: outputDataObjects.length > 0 ? outputDataObjects : undefined,
        conditionalFlows: conditionalFlows.length > 0 ? conditionalFlows : undefined,
        messageFlows: messageFlows.length > 0 ? messageFlows : undefined,
        customColumns: Object.keys(customColumnValues).length > 0 ? customColumnValues : undefined,
        issueDetail: normalizedIssueDetail,
        issueCategory: normalizedIssueCategory,
        countermeasurePolicy: normalizedCountermeasurePolicy,
        issueWorkSeconds: issueWorkHoursNumber !== undefined ? issueWorkHoursNumber * 3600 : isEditing ? null : undefined,
        timeReductionSeconds: timeReductionHoursNumber !== undefined ? timeReductionHoursNumber * 3600 : isEditing ? null : undefined,
        rateReductionPercent: rateReductionPercentNumber,
      };

      await onSubmit(data);
      onClose();
      showToast('success', editingProcess ? '工程を更新しました' : '工程を作成しました');
    } catch (error) {
      console.error('[ProcessFormModal] Failed to submit:', error);
      showToast('error', editingProcess ? '工程の更新に失敗しました' : '工程の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 前工程の選択可能リスト（自分自身と次工程を除外）
  const availableBeforeProcesses = processes.filter(
    (p) => p.id !== editingProcess?.id && !editingProcess?.nextProcessIds?.includes(p.id)
  );

  // 入力状態に応じたボタン活性判定
  const currentNameValueForDisable = (() => {
    if (processTable.level === 'medium') return mediumName.trim();
    if (processTable.level === 'small') return smallName.trim();
    if (processTable.level === 'detail') return detailName.trim();
    return name.trim();
  })();
  const isCreateDisabled = !currentNameValueForDisable || !laneId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: 'max-h-[90vh]',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {editingProcess ? '工程を編集' : '新しい工程を作成'}
            </ModalHeader>
            <ModalBody>
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                classNames={{
                  tabList: 'w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
                  tab: 'px-4 py-2 rounded-md text-sm text-gray-600 dark:text-gray-300 data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:text-primary-600 dark:data-[selected=true]:text-primary-400 shadow-none',
                  tabContent: 'font-medium',
                }}
              >
                <Tab key="basic" title="基本情報">
                  <div className="space-y-4 py-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium">工数</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="例: 1.5"
                            type="number"
                            value={workValue}
                            onValueChange={setWorkValue}
                            classNames={{ base: 'flex-1' }}
                          />
                          <Select
                            selectedKeys={[workUnit]}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as TimeUnit;
                              setWorkUnit(selected);
                            }}
                            classNames={{ base: 'w-24' }}
                            aria-label="工数の単位"
                          >
                            {TIME_UNIT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} textValue={option.label}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                        <p className="text-xs text-gray-500">作業にかかる実働時間</p>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium">リードタイム</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="例: 2"
                            type="number"
                            value={leadTimeValue}
                            onValueChange={setLeadTimeValue}
                            classNames={{ base: 'flex-1' }}
                          />
                          <Select
                            selectedKeys={[leadTimeUnit]}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as TimeUnit;
                              setLeadTimeUnit(selected);
                            }}
                            classNames={{ base: 'w-24' }}
                            aria-label="リードタイムの単位"
                          >
                            {TIME_UNIT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} textValue={option.label}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                        <p className="text-xs text-gray-500">開始から完了までの経過時間</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label={
                          processTable.level === 'large'
                            ? '大工程名'
                            : processTable.level === 'medium'
                              ? '中工程名'
                              : processTable.level === 'small'
                                ? '小工程名'
                                : '詳細工程名'
                        }
                        placeholder="工程名を入力"
                        value={processTable.level === 'medium' ? mediumName : processTable.level === 'small' ? smallName : processTable.level === 'detail' ? detailName : name}
                        onValueChange={(val) => {
                          if (processTable.level === 'medium') setMediumName(val);
                          else if (processTable.level === 'small') setSmallName(val);
                          else if (processTable.level === 'detail') setDetailName(val);
                          else setName(val);
                        }}
                        isRequired
                        autoFocus
                      />
                    </div>

                    {/* 親工程名選択 */}
                    {(processTable.level === 'medium' || processTable.level === 'small' || processTable.level === 'detail') && (
                      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          上位工程の設定
                        </h4>
                        
                        {/* 大工程選択 */}
                        <div className="space-y-2">
                          {isNewLargeName ? (
                            <div className="flex gap-2">
                              <Input
                                label="新しい大工程名"
                                placeholder="大工程名を入力"
                                value={newLargeNameInput}
                                onValueChange={setNewLargeNameInput}
                                classNames={{ base: 'flex-1' }}
                                autoFocus
                              />
                              <div className="flex items-end gap-1">
                                <Button
                                  size="sm"
                                  color="primary"
                                  onPress={confirmNewLargeName}
                                  isDisabled={!newLargeNameInput.trim()}
                                >
                                  確定
                                </Button>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  onPress={() => {
                                    setIsNewLargeName(false);
                                    setNewLargeNameInput('');
                                  }}
                                >
                                  戻る
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Select
                              label="大工程"
                              placeholder="大工程を選択"
                              selectedKeys={parentLargeName ? [parentLargeName] : []}
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                handleLargeNameChange(selected || '');
                              }}
                              description={existingLargeNames.length === 0 ? '「新規追加」から大工程を作成できます' : undefined}
                            >
                              {[
                                ...existingLargeNames.map((name) => (
                                  <SelectItem key={name} textValue={name}>
                                    {name}
                                  </SelectItem>
                                )),
                                <SelectItem key="__NEW__" textValue="新規追加" className="text-primary-600">
                                  <span className="flex items-center gap-1">
                                    <span>＋</span>
                                    <span>新規追加...</span>
                                  </span>
                                </SelectItem>,
                              ]}
                            </Select>
                          )}
                        </div>

                        {/* 中工程選択 */}
                        {(processTable.level === 'small' || processTable.level === 'detail') && (
                          <div className="space-y-2">
                            {isNewMediumName ? (
                              <div className="flex gap-2">
                                <Input
                                  label="新しい中工程名"
                                  placeholder="中工程名を入力"
                                  value={newMediumNameInput}
                                  onValueChange={setNewMediumNameInput}
                                  classNames={{ base: 'flex-1' }}
                                  autoFocus
                                />
                                <div className="flex items-end gap-1">
                                  <Button
                                    size="sm"
                                    color="primary"
                                    onPress={confirmNewMediumName}
                                    isDisabled={!newMediumNameInput.trim()}
                                  >
                                    確定
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                      setIsNewMediumName(false);
                                      setNewMediumNameInput('');
                                    }}
                                  >
                                    戻る
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Select
                                label="中工程"
                                placeholder={parentLargeName ? '中工程を選択' : '先に大工程を選択してください'}
                                selectedKeys={parentMediumName ? [parentMediumName] : []}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0] as string;
                                  handleMediumNameChange(selected || '');
                                }}
                                isDisabled={!parentLargeName && existingMediumNames.length === 0}
                                description={
                                  parentLargeName && existingMediumNames.length === 0
                                    ? `「${parentLargeName}」に属する中工程がありません。「新規追加」から作成できます。`
                                    : undefined
                                }
                              >
                                {[
                                  ...existingMediumNames.map((name) => (
                                    <SelectItem key={name} textValue={name}>
                                      {name}
                                    </SelectItem>
                                  )),
                                  <SelectItem key="__NEW__" textValue="新規追加" className="text-primary-600">
                                    <span className="flex items-center gap-1">
                                      <span>＋</span>
                                      <span>新規追加...</span>
                                    </span>
                                  </SelectItem>,
                                ]}
                              </Select>
                            )}
                          </div>
                        )}

                        {/* 小工程選択 */}
                        {processTable.level === 'detail' && (
                          <div className="space-y-2">
                            {isNewSmallName ? (
                              <div className="flex gap-2">
                                <Input
                                  label="新しい小工程名"
                                  placeholder="小工程名を入力"
                                  value={newSmallNameInput}
                                  onValueChange={setNewSmallNameInput}
                                  classNames={{ base: 'flex-1' }}
                                  autoFocus
                                />
                                <div className="flex items-end gap-1">
                                  <Button
                                    size="sm"
                                    color="primary"
                                    onPress={confirmNewSmallName}
                                    isDisabled={!newSmallNameInput.trim()}
                                  >
                                    確定
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                      setIsNewSmallName(false);
                                      setNewSmallNameInput('');
                                    }}
                                  >
                                    戻る
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Select
                                label="小工程"
                                placeholder={parentMediumName ? '小工程を選択' : '先に中工程を選択してください'}
                                selectedKeys={parentSmallName ? [parentSmallName] : []}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0] as string;
                                  handleSmallNameChange(selected || '');
                                }}
                                isDisabled={!parentMediumName && existingSmallNames.length === 0}
                                description={
                                  parentMediumName && existingSmallNames.length === 0
                                    ? `「${parentMediumName}」に属する小工程がありません。「新規追加」から作成できます。`
                                    : undefined
                                }
                              >
                                {[
                                  ...existingSmallNames.map((name) => (
                                    <SelectItem key={name} textValue={name}>
                                      {name}
                                    </SelectItem>
                                  )),
                                  <SelectItem key="__NEW__" textValue="新規追加" className="text-primary-600">
                                    <span className="flex items-center gap-1">
                                      <span>＋</span>
                                      <span>新規追加...</span>
                                    </span>
                                  </SelectItem>,
                                ]}
                              </Select>
                            )}
                          </div>
                        )}

                        {/* 選択された階層の表示 */}
                        {(parentLargeName || parentMediumName || parentSmallName) && (
                          <div className="mt-3 p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">選択された上位工程:</p>
                            <div className="flex items-center gap-1 text-sm">
                              {parentLargeName && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                  {parentLargeName}
                                </span>
                              )}
                              {parentMediumName && (
                                <>
                                  <span className="text-gray-400">›</span>
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                    {parentMediumName}
                                  </span>
                                </>
                              )}
                              {parentSmallName && (
                                <>
                                  <span className="text-gray-400">›</span>
                                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                                    {parentSmallName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <Select
                        label="スイムレーン"
                        placeholder="スイムレーンを選択"
                        selectedKeys={laneId ? [laneId] : []}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0];
                          setLaneId(selected as string);
                        }}
                        isRequired
                        renderValue={(items) => {
                          return items.map((item) => {
                            const swimlane = swimlanes.find(sw => sw.id === item.key);
                            return swimlane ? (
                              <div key={item.key} className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: swimlane.color }}
                                />
                                {swimlane.name}
                              </div>
                            ) : null;
                          });
                        }}
                      >
                        {swimlanes.map((sw) => (
                          <SelectItem key={sw.id} textValue={sw.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: sw.color }}
                              />
                              {sw.name}
                            </div>
                          </SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="スキルレベル"
                        placeholder="スキルレベルを選択"
                        selectedKeys={[skillLevel || '-']}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as Process['skillLevel'];
                          setSkillLevel(selected);
                        }}
                      >
                        {SKILL_LEVELS.map((level) => (
                          <SelectItem key={level.value || '-'} textValue={level.label}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="システム/ツール名"
                        placeholder="例: Salesforce"
                        value={systemName}
                        onValueChange={setSystemName}
                      />
                    </div>

                    <Checkbox
                      isSelected={parallelAllowed}
                      onValueChange={setParallelAllowed}
                    >
                      並列実行を許可
                    </Checkbox>

                    <Select
                      label="BPMN要素タイプ"
                      placeholder="要素タイプを選択"
                      selectedKeys={[bpmnElement]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setBpmnElement(selected as BpmnElementType);
                      }}
                      isRequired
                    >
                      <SelectItem key="task" textValue="タスク">タスク</SelectItem>
                      <SelectItem key="event" textValue="イベント">イベント</SelectItem>
                      <SelectItem key="gateway" textValue="ゲートウェイ">ゲートウェイ</SelectItem>
                    </Select>

                    {bpmnElement === 'task' && (
                      <Select
                        label="タスクタイプ"
                        placeholder="タスクタイプを選択"
                        selectedKeys={[taskType]}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0];
                          setTaskType(selected as BpmnTaskType);
                        }}
                        isRequired
                      >
                        {TASK_TYPES.map((type) => (
                          <SelectItem key={type.value} textValue={type.label}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}

                    {bpmnElement === 'gateway' && (
                      <Select
                        label="ゲートウェイタイプ"
                        placeholder="ゲートウェイタイプを選択"
                        selectedKeys={[gatewayType]}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0];
                          setGatewayType(selected as GatewayType);
                        }}
                        isRequired
                        description="フローの分岐・統合方法を選択"
                      >
                        {GATEWAY_TYPES.map((type) => (
                          <SelectItem key={type.value} textValue={type.label}>
                            <div className="flex flex-col">
                              <span>{type.icon} {type.label}</span>
                              <span className="text-xs text-gray-500">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    )}

                    {bpmnElement === 'event' && (
                      <>
                        <Select
                          label="イベントタイプ"
                          placeholder="イベントタイプを選択"
                          selectedKeys={[eventType]}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0];
                            setEventType(selected as EventType);
                          }}
                          isRequired
                        >
                          {EVENT_TYPES.map((type) => (
                            <SelectItem key={type.value} textValue={type.label}>
                              {type.icon} {type.label}
                            </SelectItem>
                          ))}
                        </Select>

                        {eventType === 'intermediate' && (
                          <Select
                            label="中間イベント種類"
                            placeholder="中間イベント種類を選択"
                            selectedKeys={[intermediateEventType]}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0];
                              setIntermediateEventType(selected as IntermediateEventType);
                            }}
                            isRequired
                            description="中間イベントの具体的なトリガーを選択"
                          >
                            {INTERMEDIATE_EVENT_TYPES.map((type) => (
                              <SelectItem key={type.value} textValue={type.label}>
                                {type.icon} {type.label}
                              </SelectItem>
                            ))}
                          </Select>
                        )}

                        <Textarea
                          label="イベント詳細"
                          placeholder="イベントの詳細情報（任意）"
                          value={eventDetails}
                          onValueChange={setEventDetails}
                          minRows={2}
                          description="タイマー設定、メッセージ内容、エラーコードなど"
                        />
                      </>
                    )}

                    <Textarea
                      label="説明"
                      placeholder="工程の詳細説明（任意）"
                      value={documentation}
                      onValueChange={setDocumentation}
                      minRows={3}
                    />
                  </div>
                </Tab>

                {processTable.isInvestigation && (
                  <Tab key="investigation" title="調査項目">
                    <div className="space-y-4 py-4">
                      <Textarea
                        label="課題事象"
                        placeholder="発生している課題の内容"
                        value={issueDetail}
                        onValueChange={setIssueDetail}
                      />
                      <Input
                        label="課題分類"
                        placeholder="例: 品質 / 生産性 / コスト"
                        value={issueCategory}
                        onValueChange={setIssueCategory}
                      />
                      <Textarea
                        label="対策方針"
                        placeholder="対応方針や対策案を記載"
                        value={countermeasurePolicy}
                        onValueChange={setCountermeasurePolicy}
                      />
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input
                          label="課題工数 (時間)"
                          type="number"
                          placeholder="例: 1.5"
                          value={issueWorkHours}
                          onValueChange={setIssueWorkHours}
                        />
                        <Input
                          label="時間削減しろ (時間)"
                          type="number"
                          placeholder="例: 0.5"
                          value={timeReductionHours}
                          onValueChange={setTimeReductionHours}
                        />
                        <Input
                          label="割合削減しろ (%)"
                          type="number"
                          placeholder="例: 15"
                          value={rateReductionPercent}
                          onValueChange={setRateReductionPercent}
                        />
                      </div>
                    </div>
                  </Tab>
                )}

                <Tab key="flow" title="フロー">
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        前工程（この工程の前に実行される工程）
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                        {availableBeforeProcesses.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            選択可能な工程がありません
                          </p>
                        ) : (
                          availableBeforeProcesses.map((process) => (
                            <label
                              key={process.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={beforeProcessIds.includes(process.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBeforeProcessIds([...beforeProcessIds, process.id]);
                                  } else {
                                    setBeforeProcessIds(
                                      beforeProcessIds.filter((id) => id !== process.id)
                                    );
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">
                                {process.name}
                                <span className="text-xs text-gray-500 ml-2">
                                  ({swimlanes.find(sw => sw.id === process.laneId)?.name || ''})
                                </span>
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        複数選択可能。選択しない場合は前工程なしとして扱われます。
                      </p>
                    </div>
                  </div>
                </Tab>

                <Tab key="bpmn" title="BPMN詳細">
                  <div className="space-y-6 py-4">
                    {/* データオブジェクト */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">データオブジェクト</h3>
                      <p className="text-xs text-gray-500">
                        この工程で入力・出力するデータを選択
                      </p>
                      {dataObjects.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">
                          データオブジェクトが登録されていません
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {/* 入力データオブジェクト */}
                          <Select
                            label="入力データ"
                            placeholder="入力するデータを選択"
                            selectionMode="multiple"
                            selectedKeys={new Set(inputDataObjects)}
                            onSelectionChange={(keys) => {
                              setInputDataObjects(Array.from(keys) as string[]);
                            }}
                            size="sm"
                            description="この工程で読み取り・参照するデータ"
                          >
                            {dataObjects
                              .filter((obj) => obj.type === 'input' || obj.type === 'both')
                              .map((obj) => (
                                <SelectItem key={obj.id} textValue={obj.name}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-500">📥</span>
                                    {obj.name}
                                  </div>
                                </SelectItem>
                              ))}
                          </Select>

                          {/* 出力データオブジェクト */}
                          <Select
                            label="出力データ"
                            placeholder="出力するデータを選択"
                            selectionMode="multiple"
                            selectedKeys={new Set(outputDataObjects)}
                            onSelectionChange={(keys) => {
                              setOutputDataObjects(Array.from(keys) as string[]);
                            }}
                            size="sm"
                            description="この工程で作成・更新するデータ"
                          >
                            {dataObjects
                              .filter((obj) => obj.type === 'output' || obj.type === 'both')
                              .map((obj) => (
                                <SelectItem key={obj.id} textValue={obj.name}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-500">📤</span>
                                    {obj.name}
                                  </div>
                                </SelectItem>
                              ))}
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* 条件付きフロー */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">条件付きフロー</h3>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => {
                            setConditionalFlows([
                              ...conditionalFlows,
                              {
                                targetProcessId: '',
                                condition: '',
                                description: '',
                              },
                            ]);
                          }}
                        >
                          + 追加
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        ゲートウェイの分岐条件を設定
                      </p>
                      {conditionalFlows.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">
                          条件付きフローが設定されていません
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {conditionalFlows.map((flow, index) => (
                            <div key={index} className="border rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium">条件 {index + 1}</span>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() => {
                                    setConditionalFlows(
                                      conditionalFlows.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  削除
                                </Button>
                              </div>
                              <Select
                                label="対象工程"
                                placeholder="対象工程を選択"
                                selectedKeys={flow.targetProcessId ? [flow.targetProcessId] : []}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0] as string;
                                  const updated = [...conditionalFlows];
                                  updated[index] = { ...flow, targetProcessId: selected };
                                  setConditionalFlows(updated);
                                }}
                                size="sm"
                              >
                                {processes
                                  .filter((p) => p.id !== editingProcess?.id)
                                  .map((p) => (
                                    <SelectItem key={p.id} textValue={p.name}>{p.name}</SelectItem>
                                  ))}
                              </Select>
                              <Input
                                label="条件式"
                                placeholder="例: amount > 1000000"
                                value={flow.condition}
                                onValueChange={(value) => {
                                  const updated = [...conditionalFlows];
                                  updated[index] = { ...flow, condition: value };
                                  setConditionalFlows(updated);
                                }}
                                size="sm"
                              />
                              <Input
                                label="説明（任意）"
                                placeholder="条件の説明"
                                value={flow.description || ''}
                                onValueChange={(value) => {
                                  const updated = [...conditionalFlows];
                                  updated[index] = { ...flow, description: value };
                                  setConditionalFlows(updated);
                                }}
                                size="sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* メッセージフロー */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">メッセージフロー</h3>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => {
                            setMessageFlows([
                              ...messageFlows,
                              {
                                targetProcessId: '',
                                messageContent: '',
                                description: '',
                              },
                            ]);
                          }}
                        >
                          + 追加
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        他の工程へのメッセージ送信を設定
                      </p>
                      {messageFlows.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">
                          メッセージフローが設定されていません
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {messageFlows.map((flow, index) => (
                            <div key={index} className="border rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium">メッセージ {index + 1}</span>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() => {
                                    setMessageFlows(
                                      messageFlows.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  削除
                                </Button>
                              </div>
                              <Select
                                label="送信先工程"
                                placeholder="送信先工程を選択"
                                selectedKeys={flow.targetProcessId ? [flow.targetProcessId] : []}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0] as string;
                                  const updated = [...messageFlows];
                                  updated[index] = { ...flow, targetProcessId: selected };
                                  setMessageFlows(updated);
                                }}
                                size="sm"
                              >
                                {processes
                                  .filter((p) => p.id !== editingProcess?.id)
                                  .map((p) => (
                                    <SelectItem key={p.id} textValue={p.name}>{p.name}</SelectItem>
                                  ))}
                              </Select>
                              <Input
                                label="メッセージ内容"
                                placeholder="送信するメッセージの内容"
                                value={flow.messageContent}
                                onValueChange={(value) => {
                                  const updated = [...messageFlows];
                                  updated[index] = { ...flow, messageContent: value };
                                  setMessageFlows(updated);
                                }}
                                size="sm"
                              />
                              <Input
                                label="説明（任意）"
                                placeholder="メッセージの説明"
                                value={flow.description || ''}
                                onValueChange={(value) => {
                                  const updated = [...messageFlows];
                                  updated[index] = { ...flow, description: value };
                                  setMessageFlows(updated);
                                }}
                                size="sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>

                {customColumns.length > 0 && (
                  <Tab key="custom" title="カスタム項目">
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-gray-500">
                        この工程表に設定されたカスタム項目の値を入力します
                      </p>
                      <CustomColumnInputGroup
                        columns={customColumns}
                        values={customColumnValues}
                        onChange={setCustomColumnValues}
                      />
                    </div>
                  </Tab>
                )}
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={onClose}>
                キャンセル
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={isCreateDisabled}
              >
                {editingProcess ? '更新' : '作成'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
