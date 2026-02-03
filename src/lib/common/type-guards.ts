/**
 * 共通型ガード関数
 * 型安全なランタイムチェックを提供
 */

/**
 * nullまたはundefinedでないことを確認
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 空でない文字列かどうかを確認
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 有効な数値かどうかを確認
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 正の整数かどうかを確認
 */
export function isPositiveInteger(value: unknown): value is number {
  return isValidNumber(value) && Number.isInteger(value) && value > 0;
}

/**
 * 非負整数かどうかを確認
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return isValidNumber(value) && Number.isInteger(value) && value >= 0;
}

/**
 * 配列かどうかを確認（型付き）
 */
export function isArray<T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T
): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }
  if (itemGuard) {
    return value.every(itemGuard);
  }
  return true;
}

/**
 * 空でない配列かどうかを確認
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * オブジェクトかどうかを確認（null除外）
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 特定のプロパティを持つオブジェクトかどうかを確認
 */
export function hasProperty<K extends string>(
  value: unknown,
  prop: K
): value is Record<K, unknown> {
  return isObject(value) && prop in value;
}

/**
 * 複数のプロパティを持つオブジェクトかどうかを確認
 */
export function hasProperties<K extends string>(
  value: unknown,
  props: K[]
): value is Record<K, unknown> {
  return isObject(value) && props.every(prop => prop in value);
}

/**
 * 日付オブジェクトかどうかを確認
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 関数かどうかを確認
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Promiseかどうかを確認
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isObject(value) &&
      isFunction((value as Record<string, unknown>).then) &&
      isFunction((value as Record<string, unknown>).catch))
  );
}

/**
 * 列挙型の値かどうかを確認するファクトリ関数
 */
export function createEnumGuard<T extends string>(values: readonly T[]) {
  const valueSet = new Set<string>(values);
  return (value: unknown): value is T => {
    return typeof value === 'string' && valueSet.has(value);
  };
}

/**
 * UUID形式かどうかを確認
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * ISO日付文字列かどうかを確認
 */
export function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
}

/**
 * メールアドレス形式かどうかを確認
 */
export function isEmail(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 値をアサートするユーティリティ
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is null or undefined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * 条件をアサートするユーティリティ
 */
export function assert(
  condition: boolean,
  message = 'Assertion failed'
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * 到達不可能なコードパスを示す（型チェック用）
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${value}`);
}
