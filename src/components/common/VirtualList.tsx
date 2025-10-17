import React, { useRef, useEffect, CSSProperties } from 'react';
// @ts-ignore - react-window型定義の問題を回避
import { FixedSizeList } from 'react-window';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height?: number;
  width?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

interface RowProps {
  index: number;
  style: CSSProperties;
}

/**
 * 仮想スクロール対応リストコンポーネント
 * react-windowを使用して大量データを効率的に表示
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height = 600,
  width = '100%',
  renderItem,
  className = '',
  overscanCount = 3,
}: VirtualListProps<T>) {
  const listRef = useRef<FixedSizeList>(null);

  // アイテム数が変更されたら先頭にスクロール
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [items.length]);

  const Row = ({ index, style }: RowProps) => {
    const item = items[index];
    return (
      <div style={style} className="virtual-list-item">
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <div className={className}>
      <FixedSizeList
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
        overscanCount={overscanCount}
        className="virtual-list"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

export default VirtualList;
