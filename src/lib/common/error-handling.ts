/**
 * 共通エラーハンドリングユーティリティ
 * アプリケーション全体で一貫したエラー処理を提供
 */

/**
 * アプリケーションエラーの基本クラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * エラーを文字列として取得
   */
  toString(): string {
    return `[${this.code}] ${this.message}`;
  }

  /**
   * ログ出力用のオブジェクトを取得
   */
  toLogObject(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      cause: this.cause,
      stack: this.stack,
    };
  }
}

/**
 * IPC通信エラー
 */
export class IPCError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'IPC_ERROR', cause);
    this.name = 'IPCError';
    Object.setPrototypeOf(this, IPCError.prototype);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    cause?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * パースエラー
 */
export class ParseError extends AppError {
  constructor(
    message: string,
    public readonly line?: number,
    cause?: unknown
  ) {
    super(message, 'PARSE_ERROR', cause);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * 操作結果の型
 */
export interface Result<T, E = AppError> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * 成功結果を作成
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * 失敗結果を作成
 */
export function failure<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Result型のユーティリティ関数
 */
export const ResultUtils = {
  /**
   * 成功かどうかを判定（型ガード）
   */
  isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true && 'data' in result;
  },

  /**
   * 失敗かどうかを判定（型ガード）
   */
  isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return result.success === false && 'error' in result;
  },

  /**
   * 成功時にデータを取得、失敗時はデフォルト値を返す
   */
  getOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
    return this.isSuccess(result) ? result.data : defaultValue;
  },

  /**
   * 成功時にデータを変換
   */
  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    if (this.isSuccess(result)) {
      return success(fn(result.data));
    }
    return result as Result<never, E>;
  },

  /**
   * 失敗時にエラーを変換
   */
  mapError<T, E1, E2 extends AppError>(
    result: Result<T, E1>,
    fn: (error: E1) => E2
  ): Result<T, E2> {
    if (this.isFailure(result)) {
      return failure(fn(result.error));
    }
    return result as Result<T, never>;
  },
};

/**
 * エラーメッセージを安全に取得
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * エラーをAppErrorに変換
 */
export function toAppError(error: unknown, defaultCode = 'UNKNOWN_ERROR'): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message, defaultCode, error);
  }
  return new AppError(String(error), defaultCode);
}

/**
 * 非同期関数のエラーをキャッチしてResult型で返す
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorCode = 'OPERATION_FAILED'
): Promise<Result<T, AppError>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(toAppError(error, errorCode));
  }
}

/**
 * 同期関数のエラーをキャッチしてResult型で返す
 */
export function tryCatchSync<T>(
  fn: () => T,
  errorCode = 'OPERATION_FAILED'
): Result<T, AppError> {
  try {
    const data = fn();
    return success(data);
  } catch (error) {
    return failure(toAppError(error, errorCode));
  }
}

/**
 * エラーをコンソールにログ出力
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const appError = toAppError(error);
  console.error(`[${context}]`, {
    ...appError.toLogObject(),
    ...additionalInfo,
  });
}

/**
 * 複数のエラーを集約
 */
export class AggregatedErrors extends AppError {
  constructor(
    message: string,
    public readonly errors: AppError[]
  ) {
    super(message, 'AGGREGATED_ERRORS');
    this.name = 'AggregatedErrors';
    Object.setPrototypeOf(this, AggregatedErrors.prototype);
  }

  /**
   * エラーメッセージの配列を取得
   */
  getMessages(): string[] {
    return this.errors.map(e => e.message);
  }
}
