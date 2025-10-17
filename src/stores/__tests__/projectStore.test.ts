import { renderHook, act } from '@testing-library/react';
import { useProjectStore } from '@/stores/projectStore';
import { Project } from '@/types/project.types';

describe('useProjectStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
    });
  });

  it('初期状態が正しく設定されている', () => {
    const { result } = renderHook(() => useProjectStore());

    expect(result.current.projects).toEqual([]);
    expect(result.current.currentProject).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('プロジェクトを設定できる', () => {
    const { result } = renderHook(() => useProjectStore());

    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        storagePath: '/test/path',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    act(() => {
      result.current.setProjects(mockProjects);
    });

    expect(result.current.projects).toEqual(mockProjects);
  });

  it('現在のプロジェクトを設定できる', () => {
    const { result } = renderHook(() => useProjectStore());

    const mockProject: Project = {
      id: '1',
      name: 'Current Project',
      description: 'Current Description',
      storagePath: '/current/path',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.setCurrentProject(mockProject);
    });

    expect(result.current.currentProject).toEqual(mockProject);
  });

  it('プロジェクトを追加できる', () => {
    const { result } = renderHook(() => useProjectStore());

    const newProject: Project = {
      id: '1',
      name: 'New Project',
      description: 'New Description',
      storagePath: '/new/path',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addProject(newProject);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toEqual(newProject);
  });

  it('プロジェクトを更新できる', () => {
    const { result } = renderHook(() => useProjectStore());

    const initialProject: Project = {
      id: '1',
      name: 'Initial Project',
      description: 'Initial Description',
      storagePath: '/initial/path',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addProject(initialProject);
    });

    const updatedData = {
      name: 'Updated Project',
      description: 'Updated Description',
    };

    act(() => {
      result.current.updateProject('1', updatedData);
    });

    expect(result.current.projects[0].name).toBe('Updated Project');
    expect(result.current.projects[0].description).toBe('Updated Description');
  });

  it('プロジェクトを削除できる', () => {
    const { result } = renderHook(() => useProjectStore());

    const project1: Project = {
      id: '1',
      name: 'Project 1',
      storagePath: '/path1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const project2: Project = {
      id: '2',
      name: 'Project 2',
      storagePath: '/path2',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addProject(project1);
      result.current.addProject(project2);
    });

    expect(result.current.projects).toHaveLength(2);

    act(() => {
      result.current.removeProject('1');
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].id).toBe('2');
  });

  it('ローディング状態を設定できる', () => {
    const { result } = renderHook(() => useProjectStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('エラーを設定できる', () => {
    const { result } = renderHook(() => useProjectStore());

    const errorMessage = 'Test error message';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });
});
