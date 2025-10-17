import { buildHierarchy, findCircularReference, validateHierarchyLevel } from '@/lib/hierarchy-utils';
import { Process } from '@/types/project.types';

describe('hierarchy-utils', () => {
  const mockProcesses: Process[] = [
    {
      id: '1',
      projectId: 'project-1',
      name: 'Large Process 1',
      level: 'large',
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      projectId: 'project-1',
      name: 'Medium Process 1',
      level: 'medium',
      parentId: '1',
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      projectId: 'project-1',
      name: 'Small Process 1',
      level: 'small',
      parentId: '2',
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      projectId: 'project-1',
      name: 'Detail Process 1',
      level: 'detail',
      parentId: '3',
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('buildHierarchy', () => {
    it('階層ツリーを正しく構築できる', () => {
      const tree = buildHierarchy(mockProcesses);
      
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('2');
    });

    it('空の配列でも動作する', () => {
      const tree = buildHierarchy([]);
      expect(tree).toEqual([]);
    });

    it('親のないプロセスをルートとして扱う', () => {
      const processes: Process[] = [
        {
          id: '1',
          projectId: 'project-1',
          name: 'Root 1',
          level: 'large',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          projectId: 'project-1',
          name: 'Root 2',
          level: 'large',
          displayOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const tree = buildHierarchy(processes);
      expect(tree).toHaveLength(2);
    });
  });

  describe('findCircularReference', () => {
    it('循環参照を検出できる', () => {
      const processesWithCircular: Process[] = [
        {
          id: '1',
          projectId: 'project-1',
          name: 'Process 1',
          level: 'large',
          parentId: '3',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          projectId: 'project-1',
          name: 'Process 2',
          level: 'medium',
          parentId: '1',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          projectId: 'project-1',
          name: 'Process 3',
          level: 'small',
          parentId: '2',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const hasCircular = findCircularReference(processesWithCircular, '1', '3');
      expect(hasCircular).toBe(true);
    });

    it('循環参照がない場合はfalseを返す', () => {
      const hasCircular = findCircularReference(mockProcesses, '2', '1');
      expect(hasCircular).toBe(false);
    });

    it('自己参照を検出できる', () => {
      const hasCircular = findCircularReference(mockProcesses, '1', '1');
      expect(hasCircular).toBe(true);
    });
  });

  describe('validateHierarchyLevel', () => {
    it('正しい階層レベルの場合trueを返す', () => {
      // large → medium
      expect(validateHierarchyLevel('large', 'medium')).toBe(true);
      
      // medium → small
      expect(validateHierarchyLevel('medium', 'small')).toBe(true);
      
      // small → detail
      expect(validateHierarchyLevel('small', 'detail')).toBe(true);
    });

    it('不正な階層レベルの場合falseを返す', () => {
      // large → detail（飛び越え）
      expect(validateHierarchyLevel('large', 'detail')).toBe(false);
      
      // detail → large（逆順）
      expect(validateHierarchyLevel('detail', 'large')).toBe(false);
      
      // medium → large（逆順）
      expect(validateHierarchyLevel('medium', 'large')).toBe(false);
    });

    it('同じレベルの場合falseを返す', () => {
      expect(validateHierarchyLevel('large', 'large')).toBe(false);
      expect(validateHierarchyLevel('medium', 'medium')).toBe(false);
    });

    it('親がいない場合（ルート）はlargeのみ許可', () => {
      expect(validateHierarchyLevel(null, 'large')).toBe(true);
      expect(validateHierarchyLevel(null, 'medium')).toBe(false);
      expect(validateHierarchyLevel(null, 'small')).toBe(false);
      expect(validateHierarchyLevel(null, 'detail')).toBe(false);
    });
  });
});
