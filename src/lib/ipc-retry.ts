/**
 * IPC通信のリトライヘルパー
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: string) => void;
}

/**
 * IPC呼び出しをリトライ付きで実行
 */
export async function withRetry<T>(
  fn: () => Promise<{ data: T | null; error: string | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
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

      // 最後の試行でない場合はリトライ
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, result.error);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  return {
    data: null,
    error: lastError || 'IPC communication failed after retries',
  };
}

/**
 * バッチ処理でのエラーハンドリング
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
