/**
 * 共通ユーティリティモジュールのエクスポート
 */

// エラーハンドリング
export {
  AppError,
  IPCError,
  ValidationError,
  ParseError,
  AggregatedErrors,
  type Result,
  success,
  failure,
  ResultUtils,
  getErrorMessage,
  toAppError,
  tryCatch,
  tryCatchSync,
  logError,
} from './error-handling';

// 型ガード
export {
  isDefined,
  isNonEmptyString,
  isValidNumber,
  isPositiveInteger,
  isNonNegativeInteger,
  isArray,
  isNonEmptyArray,
  isObject,
  hasProperty,
  hasProperties,
  isDate,
  isFunction,
  isPromise,
  createEnumGuard,
  isUUID,
  isISODateString,
  isEmail,
  assertDefined,
  assert,
  assertNever,
} from './type-guards';

// フォーマット関数
export {
  // 数値
  toNumber,
  toInteger,
  toNumberOrDefault,
  secondsToHours,
  hoursToSeconds,
  toPercentage,
  // 文字列
  toString,
  trimToUndefined,
  splitToArray,
  joinArray,
  truncate,
  toCamelCase,
  toSnakeCase,
  // Boolean
  toBoolean,
  toBooleanOrDefault,
  // 日付
  toDate,
  formatDateJP,
  formatDateISO,
  formatDateTimeJP,
  generateTimestamp,
  // JSON
  safeJsonParse,
  parseJsonArray,
  safeJsonStringify,
  // ID/キー
  generateId,
  generateSlug,
  // マッピング
  getDisplayName,
  createIdMap,
  createKeyMap,
} from './formatters';

// 定数
export * from './constants';
