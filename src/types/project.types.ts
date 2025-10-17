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

export interface Process {
  id: string;
  projectId: string;
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

export interface BpmnDiagram {
  id: string;
  projectId: string;
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
  processes: Process[];
  bpmnDiagrams: BpmnDiagram[];
  manuals?: Manual[];
}

// 将来拡張: マニュアル関連
export interface Manual {
  id: string;
  projectId: string;
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
