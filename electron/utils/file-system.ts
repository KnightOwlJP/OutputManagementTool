import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * プロジェクトのストレージパスを取得
 */
export function getProjectStoragePath(projectId: string): string {
  const userDataPath = app.getPath('userData');
  const projectsDir = path.join(userDataPath, 'projects');
  
  // プロジェクトディレクトリが存在しない場合は作成
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }

  const projectPath = path.join(projectsDir, projectId);
  
  return projectPath;
}

/**
 * プロジェクトフォルダを作成
 */
export function createProjectFolder(projectId: string): string {
  const projectPath = getProjectStoragePath(projectId);

  try {
    if (fs.existsSync(projectPath)) {
      throw new Error(`Project folder already exists: ${projectPath}`);
    }

    // プロジェクトフォルダとサブフォルダを作成
    fs.mkdirSync(projectPath, { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'bpmn'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'exports'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'imports'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'backups'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'manuals'), { recursive: true });

    console.log('[FileSystem] Project folder created:', projectPath);
    return projectPath;
  } catch (error) {
    console.error('[FileSystem] Error creating project folder:', error);
    throw error;
  }
}

/**
 * プロジェクトフォルダを削除
 */
export function deleteProjectFolder(projectId: string): void {
  const projectPath = getProjectStoragePath(projectId);

  try {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
      console.log('[FileSystem] Project folder deleted:', projectPath);
    }
  } catch (error) {
    console.error('[FileSystem] Error deleting project folder:', error);
    throw error;
  }
}

/**
 * BPMNファイルを保存
 */
export function saveBpmnFile(
  projectId: string,
  bpmnId: string,
  xmlContent: string
): string {
  const projectPath = getProjectStoragePath(projectId);
  const bpmnDir = path.join(projectPath, 'bpmn');
  const filePath = path.join(bpmnDir, `${bpmnId}.bpmn`);

  try {
    // BPMNディレクトリが存在しない場合は作成
    if (!fs.existsSync(bpmnDir)) {
      fs.mkdirSync(bpmnDir, { recursive: true });
    }

    fs.writeFileSync(filePath, xmlContent, 'utf-8');
    console.log('[FileSystem] BPMN file saved:', filePath);
    return filePath;
  } catch (error) {
    console.error('[FileSystem] Error saving BPMN file:', error);
    throw error;
  }
}

/**
 * BPMNファイルを読み込み
 */
export function loadBpmnFile(projectId: string, bpmnId: string): string {
  const projectPath = getProjectStoragePath(projectId);
  const filePath = path.join(projectPath, 'bpmn', `${bpmnId}.bpmn`);

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`BPMN file not found: ${filePath}`);
    }

    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    console.log('[FileSystem] BPMN file loaded:', filePath);
    return xmlContent;
  } catch (error) {
    console.error('[FileSystem] Error loading BPMN file:', error);
    throw error;
  }
}

/**
 * BPMNファイルを削除
 */
export function deleteBpmnFile(projectId: string, bpmnId: string): void {
  const projectPath = getProjectStoragePath(projectId);
  const filePath = path.join(projectPath, 'bpmn', `${bpmnId}.bpmn`);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('[FileSystem] BPMN file deleted:', filePath);
    }
  } catch (error) {
    console.error('[FileSystem] Error deleting BPMN file:', error);
    throw error;
  }
}

/**
 * Excelファイルをプロジェクトフォルダにコピー
 */
export function importExcelFile(
  projectId: string,
  sourcePath: string,
  fileName?: string
): string {
  const projectPath = getProjectStoragePath(projectId);
  const importsDir = path.join(projectPath, 'imports');
  
  // ファイル名が指定されていない場合は元のファイル名を使用
  const targetFileName = fileName || path.basename(sourcePath);
  const targetPath = path.join(importsDir, targetFileName);

  try {
    // インポートディレクトリが存在しない場合は作成
    if (!fs.existsSync(importsDir)) {
      fs.mkdirSync(importsDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, targetPath);
    console.log('[FileSystem] Excel file imported:', targetPath);
    return targetPath;
  } catch (error) {
    console.error('[FileSystem] Error importing Excel file:', error);
    throw error;
  }
}

/**
 * Excelファイルをエクスポート
 */
export function exportExcelFile(
  projectId: string,
  fileName: string,
  data: Buffer
): string {
  const projectPath = getProjectStoragePath(projectId);
  const exportsDir = path.join(projectPath, 'exports');
  const filePath = path.join(exportsDir, fileName);

  try {
    // エクスポートディレクトリが存在しない場合は作成
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, data);
    console.log('[FileSystem] Excel file exported:', filePath);
    return filePath;
  } catch (error) {
    console.error('[FileSystem] Error exporting Excel file:', error);
    throw error;
  }
}

/**
 * マニュアルファイルを保存
 */
export function saveManualFile(
  projectId: string,
  manualId: string,
  content: string,
  format: 'md' | 'html' | 'pdf' = 'md'
): string {
  const projectPath = getProjectStoragePath(projectId);
  const manualsDir = path.join(projectPath, 'manuals');
  const filePath = path.join(manualsDir, `${manualId}.${format}`);

  try {
    // マニュアルディレクトリが存在しない場合は作成
    if (!fs.existsSync(manualsDir)) {
      fs.mkdirSync(manualsDir, { recursive: true });
    }

    if (format === 'pdf') {
      // PDFの場合はBufferとして書き込み
      fs.writeFileSync(filePath, content as any);
    } else {
      // テキスト形式の場合は文字列として書き込み
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    console.log('[FileSystem] Manual file saved:', filePath);
    return filePath;
  } catch (error) {
    console.error('[FileSystem] Error saving manual file:', error);
    throw error;
  }
}

/**
 * マニュアルファイルを読み込み
 */
export function loadManualFile(
  projectId: string,
  manualId: string,
  format: 'md' | 'html' | 'pdf' = 'md'
): string | Buffer {
  const projectPath = getProjectStoragePath(projectId);
  const filePath = path.join(projectPath, 'manuals', `${manualId}.${format}`);

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Manual file not found: ${filePath}`);
    }

    if (format === 'pdf') {
      // PDFの場合はBufferとして読み込み
      return fs.readFileSync(filePath);
    } else {
      // テキスト形式の場合は文字列として読み込み
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error('[FileSystem] Error loading manual file:', error);
    throw error;
  }
}

/**
 * ファイルが存在するかチェック
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * ディレクトリのファイル一覧を取得
 */
export function listFiles(dirPath: string): string[] {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    return fs.readdirSync(dirPath);
  } catch (error) {
    console.error('[FileSystem] Error listing files:', error);
    throw error;
  }
}

/**
 * ファイルサイズを取得
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error('[FileSystem] Error getting file size:', error);
    throw error;
  }
}

/**
 * ファイルの最終更新日時を取得
 */
export function getFileModifiedTime(filePath: string): Date {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    console.error('[FileSystem] Error getting file modified time:', error);
    throw error;
  }
}

/**
 * 安全にファイルパスを結合（パストラバーサル対策）
 */
export function safeJoin(basePath: string, ...paths: string[]): string {
  const joinedPath = path.join(basePath, ...paths);
  const normalizedPath = path.normalize(joinedPath);

  // basePath配下にあることを確認
  if (!normalizedPath.startsWith(path.normalize(basePath))) {
    throw new Error('Invalid path: Path traversal detected');
  }

  return normalizedPath;
}

/**
 * テンポラリディレクトリを取得
 */
export function getTempDir(): string {
  return app.getPath('temp');
}

/**
 * ユーザーデータディレクトリを取得
 */
export function getUserDataDir(): string {
  return app.getPath('userData');
}
