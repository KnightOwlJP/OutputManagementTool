/**
 * カスタム列入力コンポーネント
 * 型に応じた入力フォームを動的に生成
 */

'use client';

import { Input, Select, SelectItem, Checkbox } from '@heroui/react';
import { CustomColumn, CustomColumnType } from '@/types/models';

interface CustomColumnInputProps {
  column: CustomColumn;
  value: any;
  onChange: (columnId: string, value: any) => void;
}

export function CustomColumnInput({ column, value, onChange }: CustomColumnInputProps) {
  const handleChange = (newValue: any) => {
    onChange(column.id, newValue);
  };

  switch (column.type) {
    case 'TEXT':
      return (
        <Input
          label={column.name}
          placeholder={`${column.name}を入力`}
          value={value || ''}
          onValueChange={handleChange}
          isRequired={column.required}
          size="sm"
        />
      );

    case 'NUMBER':
      return (
        <Input
          label={column.name}
          type="number"
          placeholder={`${column.name}を入力`}
          value={value?.toString() || ''}
          onValueChange={(val) => handleChange(val ? parseFloat(val) : null)}
          isRequired={column.required}
          size="sm"
        />
      );

    case 'DATE':
      return (
        <Input
          label={column.name}
          type="date"
          value={value || ''}
          onValueChange={handleChange}
          isRequired={column.required}
          size="sm"
        />
      );

    case 'SELECT':
      if (!column.options || column.options.length === 0) {
        return (
          <div className="text-sm text-gray-500">
            {column.name}: 選択肢が設定されていません
          </div>
        );
      }
      return (
        <Select
          label={column.name}
          placeholder={`${column.name}を選択`}
          selectedKeys={value ? [value] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];
            handleChange(selected || null);
          }}
          isRequired={column.required}
          size="sm"
        >
          {column.options.map((option) => (
            <SelectItem key={option}>
              {option}
            </SelectItem>
          ))}
        </Select>
      );

    case 'CHECKBOX':
      return (
        <Checkbox
          isSelected={!!value}
          onValueChange={handleChange}
        >
          {column.name}
        </Checkbox>
      );

    default:
      return (
        <div className="text-sm text-gray-500">
          {column.name}: 未対応の型（{column.type}）
        </div>
      );
  }
}

/**
 * カスタム列入力グループコンポーネント
 * 複数のカスタム列を一括表示
 */
interface CustomColumnInputGroupProps {
  columns: CustomColumn[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export function CustomColumnInputGroup({
  columns,
  values,
  onChange,
}: CustomColumnInputGroupProps) {
  const handleColumnChange = (columnId: string, value: any) => {
    onChange({
      ...values,
      [columnId]: value,
    });
  };

  if (columns.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        カスタム列が設定されていません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {columns.map((column) => (
        <CustomColumnInput
          key={column.id}
          column={column}
          value={values[column.id]}
          onChange={handleColumnChange}
        />
      ))}
    </div>
  );
}
