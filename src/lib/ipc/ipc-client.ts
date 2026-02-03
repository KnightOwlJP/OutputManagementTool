/**
 * ジェネリック IPC クライアント
 * Electron API への型安全なアクセスを提供
 */

import {
  IPCError,
  type Result,
  success,
  failure,
  getErrorMessage,
  logError,
} from '@/lib/common';

// ==========================================
// 型定義
// ==========================================

type ElectronAPI = typeof window.electron;

export interface IPCCallOptions {
  /** タイムアウト時間（ミリ秒） */
  timeout?: number;
  /** エラーメッセージ */
  errorMessage?: string;
}

export interface RetryOptions extends IPCCallOptions {
  /** 最大リトライ回数 */
  maxRetries?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** リトライ時のコールバック */
  onRetry?: (attempt: number, error: string) => void;
  /** 指数バックオフを使用するか */
  exponentialBackoff?: boolean;
}

// ==========================================
// Electron API アクセス
// ==========================================

/**
 * Electron APIが利用可能かチェック
 */
export function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

/**
 * Electron APIを取得（型安全）
 */
export function getElectronAPI(): ElectronAPI {
  if (!isElectronAvailable()) {
    throw new IPCError('Electron API is not available');
  }
  return window.electron;
}

/**
 * Electron APIを安全に取得（エラーをResult型で返す）
 */
export function getElectronAPISafe(): Result<ElectronAPI, IPCError> {
  if (!isElectronAvailable()) {
    return failure(new IPCError('Electron API is not available'));
  }
  return success(window.electron);
}

// ==========================================
// IPC 呼び出しヘルパー
// ==========================================

/**
 * IPC呼び出しを実行（Result型で結果を返す）
 */
export async function ipcCall<T>(
  fn: () => Promise<T>,
  options: IPCCallOptions = {}
): Promise<Result<T, IPCError>> {
  const { timeout = 30000, errorMessage = 'IPC通信エラーが発生しました' } = options;

  try {
    // タイムアウト処理
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new IPCError(`IPC呼び出しがタイムアウトしました (${timeout}ms)`)),
          timeout
        )
      ),
    ]);
    return success(result);
  } catch (error) {
    const message = error instanceof IPCError ? error.message : errorMessage;
    logError('IPC', error, { errorMessage });
    return failure(new IPCError(message, error));
  }
}

/**
 * IPC呼び出しをリトライ付きで実行
 */
export async function ipcCallWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<Result<T, IPCError>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    exponentialBackoff = true,
    ...ipcOptions
  } = options;

  let lastError: IPCError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await ipcCall(fn, ipcOptions);

    if (result.success) {
      return result;
    }

    lastError = result.error ?? new IPCError('Unknown error');

    // 最後の試行でない場合はリトライ
    if (attempt < maxRetries) {
      if (onRetry) {
        onRetry(attempt + 1, lastError.message);
      }

      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;
      await sleep(delay);
    }
  }

  return failure(
    lastError ?? new IPCError('IPC通信がリトライ後も失敗しました')
  );
}

/**
 * 指定時間待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// ジェネリック IPC メソッドファクトリ
// ==========================================

/**
 * IPC メソッドを作成するファクトリ関数
 */
export function createIPCMethod<TArgs extends unknown[], TResult>(
  getMethod: (api: ElectronAPI) => (...args: TArgs) => Promise<TResult>,
  errorMessage: string
) {
  return async (...args: TArgs): Promise<Result<TResult, IPCError>> => {
    const apiResult = getElectronAPISafe();
    if (!apiResult.success) {
      return apiResult;
    }

    const method = getMethod(apiResult.data!);
    return ipcCall(() => method(...args), { errorMessage });
  };
}

/**
 * リトライ付き IPC メソッドを作成するファクトリ関数
 */
export function createIPCMethodWithRetry<TArgs extends unknown[], TResult>(
  getMethod: (api: ElectronAPI) => (...args: TArgs) => Promise<TResult>,
  errorMessage: string,
  retryOptions: Omit<RetryOptions, 'errorMessage'> = {}
) {
  return async (...args: TArgs): Promise<Result<TResult, IPCError>> => {
    const apiResult = getElectronAPISafe();
    if (!apiResult.success) {
      return apiResult;
    }

    const method = getMethod(apiResult.data!);
    return ipcCallWithRetry(() => method(...args), {
      ...retryOptions,
      errorMessage,
    });
  };
}

// ==========================================
// ジェネリック CRUD クライアントファクトリ
// ==========================================

export interface CRUDClient<
  TEntity,
  TCreateData,
  TUpdateData,
  TGetParams = string
> {
  getAll: () => Promise<Result<TEntity[], IPCError>>;
  getById: (id: string) => Promise<Result<TEntity, IPCError>>;
  getByParams?: (params: TGetParams) => Promise<Result<TEntity[], IPCError>>;
  create: (data: TCreateData) => Promise<Result<TEntity, IPCError>>;
  update: (id: string, data: TUpdateData) => Promise<Result<TEntity, IPCError>>;
  delete: (id: string) => Promise<Result<boolean, IPCError>>;
}

export interface CRUDConfig {
  entityName: string;
  entityNameJP: string;
}

/**
 * 汎用 CRUD クライアントを作成
 */
export function createCRUDClient<
  TEntity,
  TCreateData,
  TUpdateData,
  TAPIMethods extends {
    getAll?: () => Promise<TEntity[]>;
    getById?: (id: string) => Promise<TEntity>;
    create?: (data: TCreateData) => Promise<TEntity>;
    update?: (id: string, data: TUpdateData) => Promise<TEntity>;
    delete?: (id: string) => Promise<boolean>;
  }
>(
  getAPIMethods: (api: ElectronAPI) => TAPIMethods,
  config: CRUDConfig
): Partial<CRUDClient<TEntity, TCreateData, TUpdateData>> {
  const { entityNameJP } = config;

  const client: Partial<CRUDClient<TEntity, TCreateData, TUpdateData>> = {};

  // getAll が存在する場合
  client.getAll = createIPCMethod(
    api => getAPIMethods(api).getAll!,
    `${entityNameJP}一覧の取得に失敗しました`
  );

  // getById が存在する場合
  client.getById = createIPCMethod(
    api => getAPIMethods(api).getById!,
    `${entityNameJP}の取得に失敗しました`
  );

  // create が存在する場合
  client.create = createIPCMethod(
    api => getAPIMethods(api).create!,
    `${entityNameJP}の作成に失敗しました`
  );

  // update が存在する場合
  client.update = createIPCMethod(
    api => (id: string, data: TUpdateData) => getAPIMethods(api).update!(id, data),
    `${entityNameJP}の更新に失敗しました`
  );

  // delete が存在する場合
  client.delete = createIPCMethod(
    api => getAPIMethods(api).delete!,
    `${entityNameJP}の削除に失敗しました`
  );

  return client;
}

// ==========================================
// バッチ処理ユーティリティ
// ==========================================

/**
 * 複数のIPC呼び出しを並列実行
 */
export async function batchIPCCalls<T>(
  calls: (() => Promise<Result<T, IPCError>>)[]
): Promise<Result<T[], IPCError>> {
  const results = await Promise.all(calls.map(call => call()));

  const errors: IPCError[] = [];
  const data: T[] = [];

  for (const result of results) {
    if (result.success && result.data !== undefined) {
      data.push(result.data);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return failure(
      new IPCError(
        `バッチ処理で ${errors.length} 件のエラーが発生しました: ${errors
          .map(e => e.message)
          .join(', ')}`
      )
    );
  }

  return success(data);
}

/**
 * 順次実行でIPC呼び出しを処理
 */
export async function sequentialIPCCalls<T>(
  calls: (() => Promise<Result<T, IPCError>>)[],
  stopOnError = true
): Promise<Result<T[], IPCError>> {
  const data: T[] = [];

  for (const call of calls) {
    const result = await call();

    if (!result.success) {
      if (stopOnError) {
        return failure(result.error ?? new IPCError('Unknown error'));
      }
      continue;
    }

    if (result.data !== undefined) {
      data.push(result.data);
    }
  }

  return success(data);
}

// ==========================================
// 旧APIとの互換性レイヤー
// ==========================================

/**
 * 旧形式の結果型
 * @deprecated 新しいResult型を使用してください
 */
export interface LegacyResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Result型を旧形式に変換
 * @deprecated 新しいResult型を直接使用してください
 */
export function toLegacyResult<T>(result: Result<T, IPCError>): LegacyResult<T> {
  if (result.success && result.data !== undefined) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error?.message ?? 'Unknown error' };
}

/**
 * 旧形式のIPC呼び出しラッパー
 * @deprecated 新しいipcCall関数を使用してください
 */
export async function safeIpcCall<T>(
  fn: () => Promise<T>,
  errorMessage = 'IPC通信エラーが発生しました'
): Promise<LegacyResult<T>> {
  const result = await ipcCall(fn, { errorMessage });
  return toLegacyResult(result);
}
