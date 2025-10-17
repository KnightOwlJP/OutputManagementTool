/**
 * IPC通信ヘルパー
 * Electron APIを型安全に呼び出すためのラッパー関数群
 */

type ElectronAPI = typeof window.electron;

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
  console.log('[IPC] Checking Electron API availability...');
  console.log('[IPC] window exists:', typeof window !== 'undefined');
  console.log('[IPC] window.electron exists:', typeof window !== 'undefined' && !!window.electron);
  console.log('[IPC] window.electronAPI exists:', typeof window !== 'undefined' && !!window.electronAPI);
  
  if (!isElectronAvailable()) {
    console.error('[IPC] Electron API is NOT available!');
    throw new Error('Electron API is not available');
  }
  
  console.log('[IPC] Electron API is available');
  return window.electron;
}

/**
 * IPCエラーハンドリング付きラッパー
 */
export async function safeIpcCall<T>(
  fn: () => Promise<T>,
  errorMessage = 'IPC通信エラーが発生しました'
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    console.error('[IPC Error]', error);
    const message = error instanceof Error ? error.message : errorMessage;
    return { data: null, error: message };
  }
}

/**
 * プロジェクト関連のIPC呼び出し
 */
export const projectIPC = {
  /**
   * プロジェクト一覧を取得
   */
  async getAll() {
    const api = getElectronAPI();
    return safeIpcCall(() => api.project.getAll(), 'プロジェクト一覧の取得に失敗しました');
  },

  /**
   * プロジェクトを取得
   */
  async getById(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.project.getById(id), 'プロジェクトの取得に失敗しました');
  },

  /**
   * プロジェクトを作成
   */
  async create(data: Parameters<ElectronAPI['project']['create']>[0]) {
    console.log('[IPC] projectIPC.create called with data:', data);
    const api = getElectronAPI();
    console.log('[IPC] api.project:', api.project);
    console.log('[IPC] api.project.create:', api.project.create);
    return safeIpcCall(() => api.project.create(data), 'プロジェクトの作成に失敗しました');
  },

  /**
   * プロジェクトを更新
   */
  async update(id: string, data: Parameters<ElectronAPI['project']['update']>[1]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.project.update(id, data), 'プロジェクトの更新に失敗しました');
  },

  /**
   * プロジェクトを削除
   */
  async delete(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.project.delete(id), 'プロジェクトの削除に失敗しました');
  },
};

/**
 * 工程関連のIPC呼び出し
 */
export const processIPC = {
  /**
   * プロジェクト内の全工程を取得
   */
  async getByProject(projectId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.process.getByProject(projectId),
      '工程一覧の取得に失敗しました'
    );
  },

  /**
   * 工程を取得
   */
  async getById(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.process.getById(id), '工程の取得に失敗しました');
  },

  /**
   * 工程を作成
   */
  async create(data: Parameters<ElectronAPI['process']['create']>[0]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.process.create(data), '工程の作成に失敗しました');
  },

  /**
   * 工程を更新
   */
  async update(id: string, data: Parameters<ElectronAPI['process']['update']>[1]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.process.update(id, data), '工程の更新に失敗しました');
  },

  /**
   * 工程を削除
   */
  async delete(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.process.delete(id), '工程の削除に失敗しました');
  },
};

/**
 * BPMN関連のIPC呼び出し
 */
export const bpmnIPC = {
  /**
   * プロジェクト内の全BPMNダイアグラムを取得
   */
  async getByProject(projectId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.bpmn.getByProject(projectId),
      'BPMNダイアグラム一覧の取得に失敗しました'
    );
  },

  /**
   * BPMNダイアグラムを取得
   */
  async getById(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.bpmn.getById(id), 'BPMNダイアグラムの取得に失敗しました');
  },

  /**
   * BPMNダイアグラムを作成
   */
  async create(data: Parameters<ElectronAPI['bpmn']['create']>[0]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.bpmn.create(data), 'BPMNダイアグラムの作成に失敗しました');
  },

  /**
   * BPMNダイアグラムを更新
   */
  async update(id: string, data: Parameters<ElectronAPI['bpmn']['update']>[1]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.bpmn.update(id, data), 'BPMNダイアグラムの更新に失敗しました');
  },

  /**
   * BPMNダイアグラムを削除
   */
  async delete(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.bpmn.delete(id), 'BPMNダイアグラムの削除に失敗しました');
  },
};

/**
 * バージョン管理関連のIPC呼び出し
 */
export const versionIPC = {
  /**
   * プロジェクトのバージョン履歴を取得
   */
  async getByProject(projectId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.version.getByProject(projectId),
      'バージョン履歴の取得に失敗しました'
    );
  },

  /**
   * バージョンを作成
   */
  async create(data: Parameters<ElectronAPI['version']['create']>[0]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.version.create(data), 'バージョンの作成に失敗しました');
  },

  /**
   * バージョンを復元
   */
  async restore(versionId: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.version.restore(versionId), 'バージョンの復元に失敗しました');
  },
};

/**
 * ファイル操作関連のIPC呼び出し
 */
export const fileIPC = {
  /**
   * Excelファイルをインポート
   */
  async importExcel(projectId: string, filePath: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.file.importExcel(projectId, filePath),
      'Excelファイルのインポートに失敗しました'
    );
  },

  /**
   * Excelファイルをエクスポート
   */
  async exportExcel(projectId: string, fileName: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.file.exportExcel(projectId, fileName),
      'Excelファイルのエクスポートに失敗しました'
    );
  },

  /**
   * ファイルダイアログを開く
   */
  async openFileDialog(options?: Parameters<ElectronAPI['file']['openFileDialog']>[0]) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.file.openFileDialog(options),
      'ファイルダイアログのオープンに失敗しました'
    );
  },

  /**
   * 保存ダイアログを開く
   */
  async saveFileDialog(options?: Parameters<ElectronAPI['file']['saveFileDialog']>[0]) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.file.saveFileDialog(options),
      '保存ダイアログのオープンに失敗しました'
    );
  },
};
