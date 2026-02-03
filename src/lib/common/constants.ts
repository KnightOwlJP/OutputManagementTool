/**
 * 共通定数定義
 * アプリケーション全体で使用する定数
 */

// ==========================================
// ProcessLevel関連
// ==========================================

export const PROCESS_LEVELS = ['large', 'medium', 'small', 'detail'] as const;
export type ProcessLevel = (typeof PROCESS_LEVELS)[number];

export const PROCESS_LEVEL_LABELS: Record<ProcessLevel, string> = {
  large: '大工程',
  medium: '中工程',
  small: '小工程',
  detail: '詳細工程',
} as const;

// ==========================================
// BPMN関連
// ==========================================

export const BPMN_ELEMENT_TYPES = ['task', 'event', 'gateway'] as const;
export type BpmnElementType = (typeof BPMN_ELEMENT_TYPES)[number];

export const BPMN_ELEMENT_LABELS: Record<BpmnElementType, string> = {
  task: 'タスク',
  event: 'イベント',
  gateway: 'ゲートウェイ',
} as const;

export const BPMN_TASK_TYPES = [
  'userTask',
  'serviceTask',
  'manualTask',
  'scriptTask',
  'businessRuleTask',
  'sendTask',
  'receiveTask',
] as const;
export type BpmnTaskType = (typeof BPMN_TASK_TYPES)[number];

export const BPMN_TASK_LABELS: Record<BpmnTaskType, string> = {
  userTask: 'ユーザータスク',
  serviceTask: 'サービスタスク',
  manualTask: '手動タスク',
  scriptTask: 'スクリプトタスク',
  businessRuleTask: 'ビジネスルールタスク',
  sendTask: '送信タスク',
  receiveTask: '受信タスク',
} as const;

export const GATEWAY_TYPES = ['exclusive', 'parallel', 'inclusive'] as const;
export type GatewayType = (typeof GATEWAY_TYPES)[number];

export const GATEWAY_LABELS: Record<GatewayType, string> = {
  exclusive: '排他ゲートウェイ',
  parallel: '並列ゲートウェイ',
  inclusive: '包含ゲートウェイ',
} as const;

export const EVENT_TYPES = ['start', 'end', 'intermediate'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_LABELS: Record<EventType, string> = {
  start: '開始イベント',
  end: '終了イベント',
  intermediate: '中間イベント',
} as const;

export const INTERMEDIATE_EVENT_TYPES = [
  'timer',
  'message',
  'error',
  'signal',
  'conditional',
] as const;
export type IntermediateEventType = (typeof INTERMEDIATE_EVENT_TYPES)[number];

export const INTERMEDIATE_EVENT_LABELS: Record<IntermediateEventType, string> = {
  timer: 'タイマーイベント',
  message: 'メッセージイベント',
  error: 'エラーイベント',
  signal: 'シグナルイベント',
  conditional: '条件イベント',
} as const;

// ==========================================
// CustomColumn関連
// ==========================================

export const CUSTOM_COLUMN_TYPES = [
  'TEXT',
  'NUMBER',
  'DATE',
  'SELECT',
  'CHECKBOX',
] as const;
export type CustomColumnType = (typeof CUSTOM_COLUMN_TYPES)[number];

export const CUSTOM_COLUMN_TYPE_LABELS: Record<CustomColumnType, string> = {
  TEXT: 'テキスト',
  NUMBER: '数値',
  DATE: '日付',
  SELECT: '選択',
  CHECKBOX: 'チェックボックス',
} as const;

// ==========================================
// ステータス関連
// ==========================================

export const PROCESS_STATUSES = [
  'not-started',
  'in-progress',
  'completed',
  'on-hold',
] as const;
export type ProcessStatus = (typeof PROCESS_STATUSES)[number];

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  'not-started': '未着手',
  'in-progress': '進行中',
  completed: '完了',
  'on-hold': '保留',
} as const;

export const SKILL_LEVELS = ['-', 'L', 'M', 'H'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  '-': '未設定',
  L: '低',
  M: '中',
  H: '高',
} as const;

// ==========================================
// 時間単位関連
// ==========================================

export const TIME_UNITS = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months'] as const;
export type TimeUnit = (typeof TIME_UNITS)[number];

export const TIME_UNIT_LABELS: Record<TimeUnit, string> = {
  seconds: '秒',
  minutes: '分',
  hours: '時間',
  days: '日',
  weeks: '週',
  months: '月',
} as const;

/**
 * 各単位を秒に変換する係数
 * 月は30日として計算（業務上の一般的な近似値）
 */
export const TIME_UNIT_SECONDS: Record<TimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,      // 7 * 86400
  months: 2592000,    // 30 * 86400
} as const;

/**
 * 入力用の推奨単位リスト（工数・リードタイム入力向け）
 * 秒・分は入力には使わないことが多いので、時間以上を推奨
 */
export const TIME_UNITS_FOR_INPUT = ['hours', 'days', 'weeks', 'months'] as const;
export type TimeUnitForInput = (typeof TIME_UNITS_FOR_INPUT)[number];

// ==========================================
// DataObject関連
// ==========================================

export const DATA_OBJECT_TYPES = ['input', 'output', 'both'] as const;
export type DataObjectType = (typeof DATA_OBJECT_TYPES)[number];

export const DATA_OBJECT_TYPE_LABELS: Record<DataObjectType, string> = {
  input: '入力',
  output: '出力',
  both: '両方',
} as const;

// ==========================================
// 文字エンコーディング
// ==========================================

export const CHAR_ENCODINGS = ['utf-8', 'shift-jis'] as const;
export type CharEncoding = (typeof CHAR_ENCODINGS)[number];

// ==========================================
// デフォルト値
// ==========================================

export const DEFAULT_SWIMLANE_COLOR = '#3B82F6';
export const DEFAULT_BPMN_ELEMENT = 'task';
export const DEFAULT_TASK_TYPE = 'userTask';
export const DEFAULT_GATEWAY_TYPE = 'exclusive';
export const DEFAULT_EVENT_TYPE = 'start';

// ==========================================
// IPC関連
// ==========================================

export const DEFAULT_IPC_TIMEOUT = 30000; // 30秒
export const DEFAULT_RETRY_COUNT = 3;
export const DEFAULT_RETRY_DELAY = 1000; // 1秒

// ==========================================
// ファイル関連
// ==========================================

export const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const CSV_MIME_TYPE = 'text/csv';
export const JSON_MIME_TYPE = 'application/json';

export const EXCEL_EXTENSION = '.xlsx';
export const CSV_EXTENSION = '.csv';
export const JSON_EXTENSION = '.json';
