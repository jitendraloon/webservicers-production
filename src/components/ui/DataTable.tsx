import * as React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  emptyMessage?: React.ReactNode;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

function getCellValue<T>(row: T, column: Column<T>, index: number): React.ReactNode {
  if (column.render) {
    return column.render(row, index);
  }
  const value = (row as Record<string, unknown>)[column.key];
  if (value === null || value === undefined) {
    return '—';
  }
  return String(value);
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No records found.',
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto ${className}`.trim()}>
      <table className="cpki-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.headerClassName}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-xs text-[var(--muted-foreground)] py-8"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const key = rowKey ? rowKey(row, rowIndex) : rowIndex;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.cellClassName}>
                      {getCellValue(row, col, rowIndex)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
