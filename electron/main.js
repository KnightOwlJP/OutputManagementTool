"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWindow = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_serve_1 = __importDefault(require("electron-serve"));
const database_1 = require("./utils/database");
const logger_1 = require("./utils/logger");
const project_handlers_1 = require("./ipc/project.handlers");
const process_handlers_1 = require("./ipc/process.handlers");
const bpmn_handlers_1 = require("./ipc/bpmn.handlers");
const version_handlers_1 = require("./ipc/version.handlers");
const manual_handlers_1 = require("./ipc/manual.handlers");
const customColumn_handlers_1 = require("./ipc/customColumn.handlers");
const processCustomValue_handlers_1 = require("./ipc/processCustomValue.handlers");
const bpmnElement_handlers_1 = require("./ipc/bpmnElement.handlers");
const backup_handlers_1 = require("./ipc/backup.handlers");
const backup_scheduler_1 = require("./ipc/backup.scheduler");
// V2: 新規ハンドラー
const processTable_handlers_1 = require("./ipc/processTable.handlers");
const dataObject_handlers_1 = require("./ipc/dataObject.handlers");
// ロガー初期化
const logger = (0, logger_1.getLogger)();
// 開発モード判定(NODE_ENVを優先)
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
// electron-serveの初期化(production用)
const loadURL = (0, electron_serve_1.default)({ directory: 'out' });
let mainWindow = null;
exports.mainWindow = mainWindow;
async function createWindow() {
    const appPath = electron_1.app.getAppPath();
    exports.mainWindow = mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            preload: path_1.default.join(appPath, 'electron', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        },
        title: 'Output Management Tool',
        icon: path_1.default.join(appPath, 'public', 'icon.png'),
    });
    // 開発モードとプロダクションモードで異なるURLを読み込み
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        // electron-serveを使用してローカルHTTPサーバー経由で読み込む
        await loadURL(mainWindow);
        // SPAルーティング対応: ナビゲーションをインターセプトしてHTMLファイルを適切にロード
        mainWindow.webContents.on('will-navigate', (event, url) => {
            // app://- で始まるURLのみ処理
            if (url.startsWith('app://-/')) {
                event.preventDefault();
                const urlPath = url.replace('app://-', '');
                logger.info('App', `Navigating to: ${urlPath}`);
                // パスに応じて適切なHTMLファイルをロード
                // 動的ルート (/projects/[id]/) はplaceholderのHTMLを使用
                let targetPath = urlPath;
                // /projects/[id]/ パターンの場合
                if (urlPath.match(/^\/projects\/[^\/]+\/?$/)) {
                    targetPath = '/projects/placeholder/';
                    logger.info('App', `Dynamic route detected, loading placeholder: ${targetPath}`);
                }
                // /projects/[id]/process-tables/[tableId] パターンの場合
                else if (urlPath.match(/^\/projects\/[^\/]+\/process-tables\/[^\/]+\/?$/)) {
                    targetPath = '/projects/placeholder/process-tables/placeholder/';
                    logger.info('App', `Dynamic route detected (process-tables), loading placeholder: ${targetPath}`);
                }
                // /projects/[id]/manuals/[manualId] パターンの場合
                else if (urlPath.match(/^\/projects\/[^\/]+\/manuals\/[^\/]+\/?$/)) {
                    targetPath = '/projects/placeholder/manuals/placeholder/';
                    logger.info('App', `Dynamic route detected (manuals), loading placeholder: ${targetPath}`);
                }
                // /projects/[id]/[page] パターンの場合（より一般的なマッチなので最後に）
                else if (urlPath.match(/^\/projects\/[^\/]+\/([^\/]+)\/?$/)) {
                    const page = urlPath.match(/^\/projects\/[^\/]+\/([^\/]+)\/?$/)?.[1];
                    targetPath = `/projects/placeholder/${page}/`;
                    logger.info('App', `Dynamic route detected (general page), loading placeholder: ${targetPath}`);
                }
                // 実際のURLは変えずに、対応するHTMLファイルをロード
                mainWindow?.loadURL(`app://-${targetPath}`).then(() => {
                    // ページロード完了を待ってから履歴を書き換え
                    if (targetPath !== urlPath && mainWindow) {
                        const replaceHistory = () => {
                            mainWindow?.webContents.executeJavaScript(`
                console.log('[Electron] Replacing history:', '${urlPath}');
                history.replaceState(null, '', '${urlPath}');
                // カスタムイベントを発火してReactに通知
                window.dispatchEvent(new CustomEvent('urlchanged', { detail: '${urlPath}' }));
              `);
                        };
                        // DOMContentLoadedを待つ
                        const checkReady = () => {
                            mainWindow?.webContents.executeJavaScript('document.readyState').then((state) => {
                                if (state === 'complete' || state === 'interactive') {
                                    replaceHistory();
                                }
                                else {
                                    setTimeout(checkReady, 50);
                                }
                            });
                        };
                        checkReady();
                    }
                });
            }
        });
        // ページ内ナビゲーション（戻る/進むボタン）のハンドリング
        mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
            if (url.startsWith('app://-/')) {
                const urlPath = url.replace('app://-', '');
                logger.info('App', `In-page navigation detected: ${urlPath}`);
                // 動的ルートの場合、React側にチェックを依頼
                // Reactが実際のwindow.location.pathnameを見て正しいIDを抽出する
                if (urlPath.match(/^\/projects\//)) {
                    mainWindow?.webContents.executeJavaScript(`
            (function() {
              const actualPath = window.location.pathname;
              console.log('[Electron] In-page navigation - URL from event:', '${urlPath}');
              console.log('[Electron] In-page navigation - Actual pathname:', actualPath);
              // 実際のpathnameを使ってurlchangedイベントを発火
              window.dispatchEvent(new CustomEvent('urlchanged', { detail: actualPath }));
            })();
          `);
                }
            }
        });
    }
    mainWindow.on('closed', () => {
        exports.mainWindow = mainWindow = null;
    });
    // ウィンドウタイトルの設定
    mainWindow.on('page-title-updated', (e) => {
        e.preventDefault();
    });
}
// アプリケーション起動時
electron_1.app.whenReady().then(async () => {
    // グローバルエラーハンドラーをセットアップ
    (0, logger_1.setupGlobalErrorHandler)();
    logger.info('App', 'Application starting...');
    // 古いログをクリーンアップ(7日より古いログを削除)
    logger.cleanupOldLogs(7);
    // データベースを初期化
    try {
        (0, database_1.initDatabase)();
        logger.info('App', 'Database initialized successfully');
    }
    catch (error) {
        logger.error('App', 'Failed to initialize database', error);
        electron_1.app.quit();
        return;
    }
    // IPCハンドラーを登録
    try {
        (0, project_handlers_1.registerProjectHandlers)();
        // V2: 工程表管理（新規）
        (0, processTable_handlers_1.registerProcessTableHandlers)();
        (0, process_handlers_1.registerProcessHandlers)();
        // V2: データオブジェクト管理（新規）
        (0, dataObject_handlers_1.registerDataObjectHandlers)();
        (0, bpmn_handlers_1.registerBpmnHandlers)();
        (0, version_handlers_1.registerVersionHandlers)();
        // registerSyncHandlers(); // Phase 8: BPMN⇔工程同期（Phase 9では非推奨）
        (0, manual_handlers_1.registerManualHandlers)(); // Phase 6.2.3: マニュアル機能
        (0, customColumn_handlers_1.registerCustomColumnHandlers)(); // Phase 7.1: カスタム列機能（V2で工程表に統合）
        (0, processCustomValue_handlers_1.registerProcessCustomValueHandlers)(); // Phase 7.2: カスタム列値管理（V2で工程に統合）
        (0, bpmnElement_handlers_1.registerBpmnElementHandlers)(); // Phase 7.3: BPMN要素管理（V2で非推奨）
        (0, backup_handlers_1.registerBackupHandlers)(); // バックアップ機能
        (0, backup_scheduler_1.registerBackupSchedulerHandlers)(); // 自動バックアップスケジューラー
        // registerSyncSchedulerHandlers(); // 自動同期スケジューラー（Phase 9では非推奨）
        logger.info('App', 'IPC handlers registered successfully');
    }
    catch (error) {
        logger.error('App', 'Failed to register IPC handlers', error);
        electron_1.app.quit();
        return;
    }
    await createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// すべてのウィンドウが閉じられた時
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        logger.info('App', 'All windows closed, quitting application');
        (0, database_1.closeDatabase)();
        electron_1.app.quit();
    }
});
// アプリケーション終了前
electron_1.app.on('before-quit', () => {
    logger.info('App', 'Application shutting down');
    (0, database_1.closeDatabase)();
});
