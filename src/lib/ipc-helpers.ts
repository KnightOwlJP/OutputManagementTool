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
   * 工程表内の全工程を取得
   */
  async getByProcessTable(processTableId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.process.getByProcessTable(processTableId),
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

  /**
   * 工程の表示順序を変更
   */
  async reorder(id: string, newDisplayOrder: number) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.process.reorder(id, newDisplayOrder), '工程の並び替えに失敗しました');
  },
};

/**
 * Phase 9: BPMNフロー図関連のIPC呼び出し（工程表から自動生成）
 */
export const bpmnIPC = {
  /**
   * プロジェクト内の全BPMNフロー図を取得
   */
  async getByProject(projectId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.bpmnDiagramTable.getByProject(projectId),
      'BPMNフロー図一覧の取得に失敗しました'
    );
  },

  /**
   * 工程表に紐づくBPMNフロー図を取得
   */
  async getByProcessTable(processTableId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.bpmnDiagramTable.getByProcessTable(processTableId),
      'BPMNフロー図の取得に失敗しました'
    );
  },

  /**
   * BPMNフロー図を取得
   */
  async getById(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.bpmnDiagramTable.getById(id), 'BPMNフロー図の取得に失敗しました');
  },

  /**
   * BPMNフロー図を更新
   */
  async update(id: string, data: Parameters<ElectronAPI['bpmnDiagramTable']['update']>[1]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.bpmnDiagramTable.update(id, data), 'BPMNフロー図の更新に失敗しました');
  },

  /**
   * BPMNフロー図を削除
   */
  async delete(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.bpmnDiagramTable.delete(id), 'BPMNフロー図の削除に失敗しました');
  },
};

/**
 * Phase 9: マニュアル関連のIPC呼び出し（工程表から自動生成）
 */
export const manualIPC = {
  /**
   * プロジェクト内の全マニュアルを取得
   */
  async getByProject(projectId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.manualTable.getByProject(projectId),
      'マニュアル一覧の取得に失敗しました'
    );
  },

  /**
   * 工程表に紐づくマニュアルを取得
   */
  async getByProcessTable(processTableId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.manualTable.getByProcessTable(processTableId),
      'マニュアルの取得に失敗しました'
    );
  },

  /**
   * マニュアルをIDで取得
   */
  async getById(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.manualTable.getById(id), 'マニュアルの取得に失敗しました');
  },

  /**
   * マニュアルを更新
   */
  async update(id: string, data: Parameters<ElectronAPI['manualTable']['update']>[1]) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.manualTable.update(id, data), 'マニュアルの更新に失敗しました');
  },

  /**
   * マニュアルを削除
   */
  async delete(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(() => api.manualTable.delete(id), 'マニュアルの削除に失敗しました');
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

/**
 * ProcessTable関連のIPC呼び出し（V2対応）
 */
export const processTableIPC = {
  /**
   * プロジェクト内のProcessTable一覧を取得
   */
  async getByProject(projectId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.getByProject(projectId),
      'ProcessTable一覧の取得に失敗しました'
    );
  },

  /**
   * ProcessTableを取得
   */
  async getById(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.getById(id),
      'ProcessTableの取得に失敗しました'
    );
  },

  /**
   * ProcessTableを作成
   */
  async create(data: Parameters<ElectronAPI['processTable']['create']>[0]) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.create(data),
      'ProcessTableの作成に失敗しました'
    );
  },

  /**
   * ProcessTableを更新
   */
  async update(id: string, data: Parameters<ElectronAPI['processTable']['update']>[1]) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.update(id, data),
      'ProcessTableの更新に失敗しました'
    );
  },

  /**
   * ProcessTableを削除
   */
  async delete(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.delete(id),
      'ProcessTableの削除に失敗しました'
    );
  },

  /**
   * Swimlane一覧を取得
   */
  async getSwimlanes(processTableId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.getSwimlanes(processTableId),
      'Swimlane一覧の取得に失敗しました'
    );
  },

  /**
   * CustomColumn一覧を取得
   */
  async getCustomColumns(processTableId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.getCustomColumns(processTableId),
      'CustomColumn一覧の取得に失敗しました'
    );
  },

  /**
   * Swimlaneを作成
   */
  async createSwimlane(processTableId: string, data: { name: string; color?: string; displayOrder: number }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.createSwimlane(processTableId, data),
      'Swimlaneの作成に失敗しました'
    );
  },

  /**
   * Swimlaneを更新
   */
  async updateSwimlane(swimlaneId: string, data: { name?: string; color?: string; displayOrder?: number }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.updateSwimlane(swimlaneId, data),
      'Swimlaneの更新に失敗しました'
    );
  },

  /**
   * Swimlaneを削除
   */
  async deleteSwimlane(swimlaneId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.deleteSwimlane(swimlaneId),
      'Swimlaneの削除に失敗しました'
    );
  },

  /**
   * Swimlaneの順序を変更
   */
  async reorderSwimlanes(processTableId: string, swimlaneIds: string[]) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.reorderSwimlanes(processTableId, swimlaneIds),
      'Swimlaneの並び替えに失敗しました'
    );
  },

  /**
   * CustomColumnを作成
   */
  async createCustomColumn(processTableId: string, data: { name: string; columnType: string; displayOrder: number; options?: string }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.createCustomColumn(processTableId, data),
      'CustomColumnの作成に失敗しました'
    );
  },

  /**
   * CustomColumnを更新
   */
  async updateCustomColumn(columnId: string, data: { name?: string; columnType?: string; displayOrder?: number; options?: string }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.updateCustomColumn(columnId, data),
      'CustomColumnの更新に失敗しました'
    );
  },

  /**
   * CustomColumnを削除
   */
  async deleteCustomColumn(columnId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.deleteCustomColumn(columnId),
      'CustomColumnの削除に失敗しました'
    );
  },

  /**
   * Stepを作成
   */
  async createStep(processTableId: string, data: { name: string; displayOrder: number }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.createStep(processTableId, data),
      'Stepの作成に失敗しました'
    );
  },

  /**
   * Stepを更新
   */
  async updateStep(stepId: string, data: { name?: string; displayOrder?: number }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.updateStep(stepId, data),
      'Stepの更新に失敗しました'
    );
  },

  /**
   * Stepを削除
   */
  async deleteStep(stepId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.deleteStep(stepId),
      'Stepの削除に失敗しました'
    );
  },

  /**
   * Stepの順序を変更
   */
  async reorderSteps(processTableId: string, stepIds: string[]) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.processTable.reorderSteps(processTableId, stepIds),
      'Stepの並び替えに失敗しました'
    );
  },
};

/**
 * データオブジェクト関連のIPC呼び出し
 */
export const dataObjectIPC = {
  /**
   * データオブジェクトを作成
   */
  async create(processTableId: string, data: { name: string; type: 'input' | 'output' | 'both'; description?: string }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.dataObject.create(processTableId, data),
      'データオブジェクトの作成に失敗しました'
    );
  },

  /**
   * 工程表内の全データオブジェクトを取得
   */
  async getByProcessTable(processTableId: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.dataObject.getByProcessTable(processTableId),
      'データオブジェクト一覧の取得に失敗しました'
    );
  },

  /**
   * データオブジェクトを取得
   */
  async getById(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.dataObject.getById(id),
      'データオブジェクトの取得に失敗しました'
    );
  },

  /**
   * データオブジェクトを更新
   */
  async update(id: string, data: { name?: string; type?: 'input' | 'output' | 'both'; description?: string }) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.dataObject.update(id, data),
      'データオブジェクトの更新に失敗しました'
    );
  },

  /**
   * データオブジェクトを削除
   */
  async delete(id: string) {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.dataObject.delete(id),
      'データオブジェクトの削除に失敗しました'
    );
  },

  /**
   * データオブジェクトを工程に関連付け
   */
  async linkToProcess(dataObjectId: string, processId: string, direction: 'input' | 'output') {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.dataObject.linkToProcess(dataObjectId, processId, direction),
      'データオブジェクトの関連付けに失敗しました'
    );
  },

  /**
   * データオブジェクトの関連付けを解除
   */
  async unlinkFromProcess(dataObjectId: string, processId: string, direction: 'input' | 'output') {
    const api = getElectronAPI();
    return safeIpcCall(
      () => api.dataObject.unlinkFromProcess(dataObjectId, processId, direction),
      'データオブジェクトの関連付け解除に失敗しました'
    );
  },
};
