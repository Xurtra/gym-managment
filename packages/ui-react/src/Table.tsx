import type { ReactNode } from "react";
import type { TableModel } from "@gym-platform/ui";
import { EmptyState } from "./EmptyState.js";

export interface TableProps<T> {
  model: TableModel<T>;
  renderCell?: (row: T, columnKey: keyof T & string) => ReactNode;
  getRowKey?: (row: T, index: number) => string;
  emptyMessage?: string;
}

export function Table<T extends object>({
  model,
  renderCell,
  getRowKey,
  emptyMessage
}: TableProps<T>) {
  if (model.rows.length === 0) {
    return model.empty ? (
      <EmptyState model={model.empty} />
    ) : (
      <div className="empty-state">
        <p>{emptyMessage ?? "No rows to display."}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {model.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, rowIndex) => (
            <tr key={getRowKey?.(row, rowIndex) ?? rowIndex}>
              {model.columns.map((column) => (
                <td key={column.key}>
                  {renderCell ? renderCell(row, column.key) : formatCellValue(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCellValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}
