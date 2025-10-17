import '@testing-library/jest-dom';

// グローバルモック設定
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Electron APIのモック
global.window.electron = {
  project: {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  file: {
    openFileDialog: jest.fn(),
    saveFileDialog: jest.fn(),
    importExcel: jest.fn(),
    exportExcel: jest.fn(),
  },
  process: {
    create: jest.fn(),
    getById: jest.fn(),
    getByProject: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    move: jest.fn(),
    reorder: jest.fn(),
  },
  bpmn: {
    create: jest.fn(),
    getById: jest.fn(),
    getByProject: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  version: {
    create: jest.fn(),
    getByProject: jest.fn(),
    getById: jest.fn(),
    restore: jest.fn(),
    delete: jest.fn(),
  },
  system: {
    platform: 'win32',
    version: '1.0.0',
  },
} as any;
