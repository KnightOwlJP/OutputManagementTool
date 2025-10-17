import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logDir: string;
  private logFile: string;
  private errorFile: string;
  private maxLogSize = 10 * 1024 * 1024; // 10MB
  private maxLogFiles = 5;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.logDir = path.join(userDataPath, 'logs');
    
    // ログディレクトリを作成
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    this.logFile = path.join(this.logDir, `app-${date}.log`);
    this.errorFile = path.join(this.logDir, `error-${date}.log`);
  }

  /**
   * ログを記録
   */
  private writeLog(entry: LogEntry, isError = false): void {
    const logLine = this.formatLogEntry(entry);
    const targetFile = isError ? this.errorFile : this.logFile;

    try {
      // ログファイルのサイズをチェック
      if (fs.existsSync(targetFile)) {
        const stats = fs.statSync(targetFile);
        if (stats.size > this.maxLogSize) {
          this.rotateLogFile(targetFile);
        }
      }

      // ログを追記
      fs.appendFileSync(targetFile, logLine + '\n', 'utf8');
    } catch (error) {
      console.error('[Logger] Failed to write log:', error);
    }
  }

  /**
   * ログエントリをフォーマット
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.level}]`,
      `[${entry.category}]`,
      entry.message,
    ];

    if (entry.data) {
      parts.push(JSON.stringify(entry.data));
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`Stack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * ログファイルをローテーション
   */
  private rotateLogFile(filePath: string): void {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    // 既存のローテーションファイルを順に移動
    for (let i = this.maxLogFiles - 1; i > 0; i--) {
      const oldFile = path.join(dir, `${baseName}.${i}${ext}`);
      const newFile = path.join(dir, `${baseName}.${i + 1}${ext}`);

      if (fs.existsSync(oldFile)) {
        if (i === this.maxLogFiles - 1) {
          // 最古のファイルを削除
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // 現在のログファイルを.1にリネーム
    const rotatedFile = path.join(dir, `${baseName}.1${ext}`);
    fs.renameSync(filePath, rotatedFile);
  }

  /**
   * DEBUGレベルのログ
   */
  debug(category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      category,
      message,
      data,
    };

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${category}]`, message, data || '');
    }

    this.writeLog(entry);
  }

  /**
   * INFOレベルのログ
   */
  info(category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      data,
    };

    console.log(`[${category}]`, message, data || '');
    this.writeLog(entry);
  }

  /**
   * WARNレベルのログ
   */
  warn(category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      data,
    };

    console.warn(`[${category}]`, message, data || '');
    this.writeLog(entry);
  }

  /**
   * ERRORレベルのログ
   */
  error(category: string, message: string, error?: Error, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      error,
      data,
    };

    console.error(`[${category}]`, message, error || '', data || '');
    this.writeLog(entry, true);
  }

  /**
   * ログファイルのパスを取得
   */
  getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * エラーログファイルのパスを取得
   */
  getErrorFilePath(): string {
    return this.errorFile;
  }

  /**
   * 古いログファイルをクリーンアップ
   */
  cleanupOldLogs(daysToKeep = 7): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const cutoffTime = daysToKeep * 24 * 60 * 60 * 1000;

      files.forEach((file) => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > cutoffTime) {
          fs.unlinkSync(filePath);
          console.log(`[Logger] Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('[Logger] Failed to cleanup old logs:', error);
    }
  }
}

// シングルトンインスタンス
let loggerInstance: Logger | null = null;

/**
 * Loggerインスタンスを取得
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

/**
 * グローバルエラーハンドラーを設定
 */
export function setupGlobalErrorHandler(): void {
  const logger = getLogger();

  // 未処理の例外をキャッチ
  process.on('uncaughtException', (error: Error) => {
    logger.error('UncaughtException', 'Unhandled exception occurred', error);
    console.error('[Fatal] Uncaught Exception:', error);
    // アプリケーションを終了
    process.exit(1);
  });

  // 未処理のPromise拒否をキャッチ
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error(
      'UnhandledRejection',
      'Unhandled promise rejection',
      reason instanceof Error ? reason : new Error(String(reason)),
      { promise: String(promise) }
    );
    console.error('[Fatal] Unhandled Rejection:', reason);
  });

  // 警告をログに記録
  process.on('warning', (warning: Error) => {
    logger.warn('ProcessWarning', warning.message, { stack: warning.stack });
  });

  logger.info('Logger', 'Global error handler setup completed');
}
