/**
 * 共通フォーマット関数
 * データの変換・フォーマット処理を提供
 */

import { isDefined, isValidNumber } from './type-guards';

// ==========================================
// 数値変換
// ==========================================

/**
 * 値を数値に変換（変換失敗時はundefined）
 */
export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * 値を整数に変換（変換失敗時はundefined）
 */
export function toInteger(value: unknown): number | undefined {
  const num = toNumber(value);
  return num !== undefined ? Math.floor(num) : undefined;
}

/**
 * 値を数値に変換（デフォルト値付き）
 */
export function toNumberOrDefault(value: unknown, defaultValue: number): number {
  const num = toNumber(value);
  return num !== undefined ? num : defaultValue;
}

/**
 * 秒を時間に変換
 */
export function secondsToHours(seconds: number | undefined | null): number | undefined {
  if (seconds === undefined || seconds === null) {
    return undefined;
  }
  return seconds / 3600;
}

/**
 * 時間を秒に変換
 */
export function hoursToSeconds(hours: number | undefined | null): number | undefined {
  if (hours === undefined || hours === null) {
    return undefined;
  }
  return hours * 3600;
}

/**
 * 時間単位の秒数マップ
 * 月は30日として計算（業務上の一般的な近似値）
 */
const TIME_UNIT_TO_SECONDS: Record<string, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,      // 7 * 86400
  months: 2592000,    // 30 * 86400
};

/**
 * 任意の時間単位から秒に変換
 * @param value - 変換する値
 * @param unit - 時間単位
 * @returns 秒数（入力がundefined/nullの場合はundefined）
 */
export function toSeconds(
  value: number | undefined | null,
  unit: string
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const factor = TIME_UNIT_TO_SECONDS[unit];
  if (factor === undefined) {
    console.warn(`Unknown time unit: ${unit}, treating as hours`);
    return value * 3600;
  }
  return value * factor;
}

/**
 * 秒から任意の時間単位に変換
 * @param seconds - 秒数
 * @param unit - 変換先の時間単位
 * @returns 変換後の値（入力がundefined/nullの場合はundefined）
 */
export function fromSeconds(
  seconds: number | undefined | null,
  unit: string
): number | undefined {
  if (seconds === undefined || seconds === null) {
    return undefined;
  }
  const factor = TIME_UNIT_TO_SECONDS[unit];
  if (factor === undefined) {
    console.warn(`Unknown time unit: ${unit}, treating as hours`);
    return seconds / 3600;
  }
  return seconds / factor;
}

/**
 * 秒数を最適な単位で表示するためのフォーマット
 * @param seconds - 秒数
 * @returns フォーマットされた文字列（例: "2.5時間", "3日", "1週"）
 */
export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null) {
    return '-';
  }

  // 月（30日以上）
  if (seconds >= 2592000) {
    const months = seconds / 2592000;
    return `${months.toFixed(1)}月`;
  }
  // 週（7日以上）
  if (seconds >= 604800) {
    const weeks = seconds / 604800;
    return `${weeks.toFixed(1)}週`;
  }
  // 日（24時間以上）
  if (seconds >= 86400) {
    const days = seconds / 86400;
    return `${days.toFixed(1)}日`;
  }
  // 時間（1時間以上）
  if (seconds >= 3600) {
    const hours = seconds / 3600;
    return `${hours.toFixed(1)}時間`;
  }
  // 分（1分以上）
  if (seconds >= 60) {
    const minutes = seconds / 60;
    return `${minutes.toFixed(0)}分`;
  }
  // 秒
  return `${seconds.toFixed(0)}秒`;
}

/**
 * 秒数を指定された単位でフォーマット
 * @param seconds - 秒数
 * @param unit - 表示単位
 * @param decimals - 小数点以下の桁数（デフォルト: 2）
 * @returns フォーマットされた数値文字列
 */
export function formatDurationWithUnit(
  seconds: number | undefined | null,
  unit: string,
  decimals = 2
): string {
  const value = fromSeconds(seconds, unit);
  if (value === undefined) {
    return '';
  }
  return value.toFixed(decimals);
}

/**
 * 数値をパーセンテージ文字列に変換
 */
export function toPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ==========================================
// 文字列処理
// ==========================================

/**
 * 値を安全に文字列に変換
 */
export function toString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * 文字列をトリムして空文字の場合はundefined
 */
export function trimToUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * 文字列を配列に分割
 */
export function splitToArray(
  value: string | undefined | null,
  separator: RegExp | string = /[,、]/
): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(separator)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * 配列を文字列に結合
 */
export function joinArray(
  values: (string | undefined | null)[] | undefined | null,
  separator = ', '
): string {
  if (!values) {
    return '';
  }
  return values.filter(isDefined).join(separator);
}

/**
 * 文字列を省略表示
 */
export function truncate(value: string, maxLength: number, suffix = '...'): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 文字列をキャメルケースに変換
 */
export function toCamelCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

/**
 * 文字列をスネークケースに変換
 */
export function toSnakeCase(value: string): string {
  return value
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

// ==========================================
// Boolean変換
// ==========================================

/**
 * 値をbooleanに変換
 */
export function toBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const str = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'y', 'on', '✓', '○'].includes(str)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off', '', '×'].includes(str)) {
    return false;
  }
  return undefined;
}

/**
 * 値をbooleanに変換（デフォルト値付き）
 */
export function toBooleanOrDefault(value: unknown, defaultValue: boolean): boolean {
  const bool = toBoolean(value);
  return bool !== undefined ? bool : defaultValue;
}

// ==========================================
// 日付処理
// ==========================================

/**
 * 値を日付に変換
 */
export function toDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  // Dateオブジェクトの場合
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }

  // 数値の場合（Excelシリアル日付など）
  if (typeof value === 'number') {
    // Unix timestamp（ミリ秒）として処理
    if (value > 25569) {
      // Excelシリアル日付（1900年1月1日からの日数）
      const date = new Date((value - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? undefined : date;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  // 文字列の場合
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

/**
 * 日付を日本語形式の文字列に変換
 */
export function formatDateJP(date: Date | undefined | null): string {
  if (!date) {
    return '';
  }
  return date.toLocaleDateString('ja-JP');
}

/**
 * 日付をISO形式の文字列に変換（日付部分のみ）
 */
export function formatDateISO(date: Date | undefined | null): string {
  if (!date) {
    return '';
  }
  return date.toISOString().split('T')[0];
}

/**
 * 日付を日時の日本語形式の文字列に変換
 */
export function formatDateTimeJP(date: Date | undefined | null): string {
  if (!date) {
    return '';
  }
  return date.toLocaleString('ja-JP');
}

/**
 * タイムスタンプを生成（ファイル名用）
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// ==========================================
// JSON処理
// ==========================================

/**
 * 値を安全にJSONパース
 */
export function safeJsonParse<T>(
  value: string | undefined | null,
  defaultValue: T
): T {
  if (!value) {
    return defaultValue;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 値を安全にJSON配列としてパース
 */
export function parseJsonArray<T>(
  value: string | undefined | null
): T[] | undefined {
  if (!value || value.trim() === '') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * オブジェクトを安全にJSON文字列に変換
 */
export function safeJsonStringify(value: unknown, indent?: number): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    return '';
  }
}

// ==========================================
// ID/キー生成
// ==========================================

/**
 * 一意のプレフィックス付きIDを生成
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * スラッグを生成（URL安全な文字列）
 */
export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==========================================
// マッピング関数
// ==========================================

/**
 * キーと値のマップから表示名を取得
 */
export function getDisplayName(
  value: string | undefined | null,
  map: Record<string, string>,
  defaultValue = '-'
): string {
  if (!value) {
    return defaultValue;
  }
  return map[value] || defaultValue;
}

/**
 * オブジェクト配列からIDマップを作成
 */
export function createIdMap<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map(item => [item.id, item]));
}

/**
 * オブジェクト配列から指定キーのマップを作成
 */
export function createKeyMap<T, K extends keyof T>(
  items: T[],
  key: K
): Map<T[K], T> {
  return new Map(items.map(item => [item[key], item]));
}
