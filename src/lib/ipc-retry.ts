/**
 * IPC通信のリトライヘルパー
 * 
 * @deprecated 新しい lib/ipc モジュールの ipcCallWithRetry を使用してください。
 * このファイルは後方互換性のために残されています。
 */

import { getErrorMessage } from '@/lib/common';

// ==========================================
// 型定義
// ==========================================

export interface RetryOptions {
  /** 最大リトライ回数 */
  maxRetries?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** リトライ時のコールバック */
  onRetry?: (attempt: number, error: string) => void;
  /** 指数バックオフを使用するか */
  exponentialBackoff?: boolean;
  /** リトライすべきかを判定する関数 */
  shouldRetry?: (error: string, attempt: number) => boolean;
}

export interface RetryResult<T> {
  data: T | null;
  error: string | null;
}

// ==========================================
// リトライ関数
// ==========================================

/**
 * IPC呼び出しをリトライ付きで実行
 */
export async function withRetry<T>(
  fn: () => Promise<RetryResult<T>>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    exponentialBackoff = true,
    shouldRetry = () => true,
  } = options;

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // 成功した場合
      if (!result.error) {
        return result;
      }

      lastError = result.error;

      // 最後の試行でない場合、かつリトライすべき場合
      if (attempt < maxRetries && shouldRetry(result.error, attempt)) {
        if (onRetry) {
          onRetry(attempt + 1, result.error);
        }
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;
        await sleep(delay);
      }
    } catch (error) {
      lastError = getErrorMessage(error);
      
      if (attempt < maxRetries && shouldRetry(lastError, attempt)) {
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;
        await sleep(delay);
      }
    }
  }

  return {
    data: null,
    error: lastError || 'IPC通信がリトライ後も失敗しました',
  };
}

/**
 * 汎用のリトライ関数（Result型ではなく値を直接返す）
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    exponentialBackoff = true,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries && shouldRetry(lastError.message, attempt)) {
        if (onRetry) {
          onRetry(attempt + 1, lastError.message);
        }
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('リトライ後も失敗しました');
}

// ==========================================
// エラーバウンダリ
// ==========================================

/**
 * 非同期関数のエラーをキャッチしてフォールバック値を返す
 */
export async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Error boundary caught:', error);
    return fallback;
  }
}

/**
 * 非同期関数のエラーをキャッチしてnullを返す
 */
export async function catchError<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error('Caught error:', error);
    return null;
  }
}

// ==========================================
// タイムアウト
// ==========================================

/**
 * タイムアウト付きでPromiseを実行
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
    ),
  ]);
}

// ==========================================
// ヘルパー
// ==========================================

/**
 * 指定時間待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * ネットワークエラーかどうかを判定
 */
export function isNetworkError(error: string): boolean {
  const networkErrors = [
    'network',
    'timeout',
    'connection',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ];
  const lowerError = error.toLowerCase();
  return networkErrors.some(e => lowerError.includes(e.toLowerCase()));
}

/**
 * ネットワークエラーの場合のみリトライする判定関数
 */
export function retryOnNetworkError(error: string): boolean {
  return isNetworkError(error);
}
