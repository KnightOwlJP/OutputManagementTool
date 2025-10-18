// プロジェクト関連の型定義

export interface Project {
  id: string;
  name: string;
  description?: string;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export type ProcessLevel = 'large' | 'medium' | 'small' | 'detail';

// 工程表（ProcessTableドキュメント）
export interface ProcessTable {
  id: string;
  projectId: string;
  name: string;
  level: ProcessLevel;  // この工程表のレベル
  description?: string;
  parentProcessIds?: string[];  // この工程表が詳細化する上位工程のID（複数可）
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Process {
  id: string;
  projectId: string;
  processTableId?: string;  // 工程表ID（移行期間中はオプショナル）
  name: string;
  level: ProcessLevel;
  parentId?: string;
  department?: string;      // 大工程: 部署名
  assignee?: string;        // 中工程: 作業実行者
  documentType?: string;    // 小工程: 帳票種類
  startDate?: Date;
  endDate?: Date;
  status?: string;
  description?: string;
  bpmnElementId?: string;
  hasManual?: boolean;
  manualId?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>; // 🔄 将来の列追加に対応（ユーザーFB反映用）
}

// 📝 注意: 工程表の列項目はユーザーからのフィードバックを受けて追加・変更予定
// metadata フィールドを使用して拡張可能な設計としています

// フロー図グループ（工程表と同じ構造）
export interface BpmnDiagramTable {
  id: string;
  projectId: string;
  name: string;                    // フロー図グループ名（例: "営業部門 大工程フロー"）
  level: ProcessLevel;             // このフロー図グループのレベル
  description?: string;
  processTableId?: string;         // 紐付く工程表のID
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BpmnDiagram {
  id: string;
  projectId: string;
  bpmnDiagramTableId?: string;     // 所属するフロー図グループのID
  processTableId?: string;         // 紐付く工程表のID（旧形式との互換性）
  name: string;
  xmlContent: string;
  version: number;
  processId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Version {
  id: string;
  projectId: string;
  timestamp: Date;
  author: string;
  message: string;
  tag?: string;
  parentVersionId?: string;
  snapshotData: VersionSnapshot;
  createdAt: Date;
}

export interface VersionSnapshot {
  processTables: ProcessTable[];
  processes: Process[];
  bpmnDiagramTables: BpmnDiagramTable[];
  bpmnDiagrams: BpmnDiagram[];
  manualTables: ManualTable[];
  manuals?: Manual[];
}

// マニュアルグループ（工程表と同じ構造）
export interface ManualTable {
  id: string;
  projectId: string;
  name: string;                    // マニュアルグループ名（例: "営業部門 詳細手順書"）
  level: ProcessLevel;             // このマニュアルグループのレベル
  description?: string;
  processTableId?: string;         // 紐付く工程表のID
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// 将来拡張: マニュアル関連
export interface Manual {
  id: string;
  projectId: string;
  manualTableId?: string;          // 所属するマニュアルグループのID
  processTableId?: string;         // 紐付く工程表のID（旧形式との互換性）
  title: string;
  content: string;
  targetProcessLevel: 'detail';
  processIds: string[];
  bpmnElementIds: string[];
  version: string;
  linkedFlowVersion?: string;
  status: 'draft' | 'review' | 'approved' | 'outdated';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: string;
  reviewers?: string[];
  metadata?: {
    template?: string;
    generatedBy?: 'ai' | 'manual';
    lastSyncedAt?: Date;
  };
}

export interface ManualSection {
  id: string;
  manualId: string;
  order: number;
  level: 'large' | 'medium' | 'small';
  heading: string;
  content: string;
  processId?: string;
  processLevel?: ProcessLevel;
  bpmnElementId?: string;
  parentSectionId?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ツリー構造用
export interface ProcessTree {
  process: Process;
  children: ProcessTree[];
}
