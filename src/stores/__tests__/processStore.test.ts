import { renderHook, act } from '@testing-library/react';
import { useProcessStore } from '@/stores/processStore';
import { Process } from '@/types/project.types';

describe('useProcessStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useProcessStore.setState({
      processes: [],
      currentProcess: null,
      selectedProcesses: [],
      expandedNodes: new Set<string>(),
      isLoading: false,
      error: null,
    });
  });

  it('初期状態が正しく設定されている', () => {
    const { result } = renderHook(() => useProcessStore());

    expect(result.current.processes).toEqual([]);
    expect(result.current.currentProcess).toBeNull();
    expect(result.current.selectedProcesses).toEqual([]);
  });

  it('プロセスを設定できる', () => {
    const { result } = renderHook(() => useProcessStore());

    const mockProcesses: Process[] = [
      {
        id: '1',
        projectId: 'project-1',
        name: 'Test Process',
        level: 'large',
        displayOrder: 1,
        status: 'not-started',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    act(() => {
      result.current.setProcesses(mockProcesses);
    });

    expect(result.current.processes).toEqual(mockProcesses);
  });

  it('プロセスを追加できる', () => {
    const { result } = renderHook(() => useProcessStore());

    const newProcess: Process = {
      id: '1',
      projectId: 'project-1',
      name: 'New Process',
      level: 'medium',
      displayOrder: 1,
      status: 'not-started',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addProcess(newProcess);
    });

    expect(result.current.processes).toHaveLength(1);
    expect(result.current.processes[0]).toEqual(newProcess);
  });

  it('プロセスを更新できる', () => {
    const { result } = renderHook(() => useProcessStore());

    const initialProcess: Process = {
      id: '1',
      projectId: 'project-1',
      name: 'Initial Process',
      level: 'small',
      displayOrder: 1,
      status: 'not-started',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addProcess(initialProcess);
    });

    const updatedData = {
      name: 'Updated Process',
      description: 'Updated Description',
    };

    act(() => {
      result.current.updateProcess('1', updatedData);
    });

    expect(result.current.processes[0].name).toBe('Updated Process');
    expect(result.current.processes[0].description).toBe('Updated Description');
  });

  it('プロセスを削除できる', () => {
    const { result } = renderHook(() => useProcessStore());

    const process1: Process = {
      id: '1',
      projectId: 'project-1',
      name: 'Process 1',
      level: 'large',
      displayOrder: 1,
      status: 'not-started',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const process2: Process = {
      id: '2',
      projectId: 'project-1',
      name: 'Process 2',
      level: 'medium',
      displayOrder: 2,
      status: 'not-started',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addProcess(process1);
      result.current.addProcess(process2);
    });

    expect(result.current.processes).toHaveLength(2);

    act(() => {
      result.current.removeProcess('1');
    });

    expect(result.current.processes).toHaveLength(1);
    expect(result.current.processes[0].id).toBe('2');
  });

  it('プロセスを選択できる', () => {
    const { result } = renderHook(() => useProcessStore());

    const process1: Process = {
      id: '1',
      projectId: 'project-1',
      name: 'Process 1',
      level: 'detail',
      displayOrder: 1,
      status: 'not-started',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addProcess(process1);
      result.current.selectProcess('1');
    });

    expect(result.current.selectedProcesses).toContain('1');

    act(() => {
      result.current.deselectProcess('1');
    });

    expect(result.current.selectedProcesses).not.toContain('1');

    act(() => {
      result.current.selectMultiple(['1']);
    });

    expect(result.current.selectedProcesses).toEqual(['1']);

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedProcesses).toEqual([]);
  });

  it('レベル別にプロセスを取得できる', () => {
    const { result } = renderHook(() => useProcessStore());

    const processes: Process[] = [
      {
        id: '1',
        projectId: 'project-1',
        name: 'Large Process',
        level: 'large',
        displayOrder: 1,
        status: 'not-started',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        projectId: 'project-1',
        name: 'Medium Process',
        level: 'medium',
        displayOrder: 2,
        status: 'not-started',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        projectId: 'project-1',
        name: 'Small Process',
        level: 'small',
        displayOrder: 3,
        status: 'not-started',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    act(() => {
      result.current.setProcesses(processes);
    });

    const largeProcesses = result.current.getProcessesByLevel('large');
    expect(largeProcesses).toHaveLength(1);
    expect(largeProcesses[0].name).toBe('Large Process');

    const mediumProcesses = result.current.getProcessesByLevel('medium');
    expect(mediumProcesses).toHaveLength(1);
    expect(mediumProcesses[0].name).toBe('Medium Process');
  });
});
