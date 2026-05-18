import { button, table } from "@gym-platform/ui";
import type { ButtonModel, TableModel } from "@gym-platform/ui";

export type DataTableSortDirection = "asc" | "desc";
export type DataTableCellValue = string | number | boolean | Date | undefined;

export interface DataTableColumn<T extends Record<string, DataTableCellValue>> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
}

export interface DataTableSort {
  key: string;
  direction: DataTableSortDirection;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
  startRow: number;
  endRow: number;
  canPrevious: boolean;
  canNext: boolean;
  previousAction: ButtonModel;
  nextAction: ButtonModel;
}

export interface DataTableColumnState<T extends Record<string, DataTableCellValue>>
  extends DataTableColumn<T> {
  sorted: boolean;
  direction?: DataTableSortDirection;
  nextDirection: DataTableSortDirection;
}

export interface DashboardDataTable<T extends Record<string, DataTableCellValue>> {
  kind: "dashboard_data_table";
  columns: Array<DataTableColumnState<T>>;
  rows: T[];
  allRows: T[];
  sort?: DataTableSort;
  pagination: DataTablePagination;
  table: TableModel<T>;
}

export function buildDashboardDataTable<T extends Record<string, DataTableCellValue>>(inputModel: {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  sort?: DataTableSort;
  page?: number;
  pageSize?: number;
}): DashboardDataTable<T> {
  const sort = normalizeSort(inputModel.sort, inputModel.columns);
  const sortedRows = sortRows(inputModel.rows, sort);
  const pageSize = Math.max(1, inputModel.pageSize ?? 10);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const page = clamp(inputModel.page ?? 1, 1, totalPages);
  const startIndex = (page - 1) * pageSize;
  const rows = sortedRows.slice(startIndex, startIndex + pageSize);
  const pagination = buildPagination({
    page,
    pageSize,
    totalRows: sortedRows.length,
    totalPages,
    rowCount: rows.length
  });

  return {
    kind: "dashboard_data_table",
    columns: inputModel.columns.map((column) => ({
      ...column,
      sortable: column.sortable ?? false,
      sorted: sort?.key === column.key,
      ...(sort?.key === column.key ? { direction: sort.direction } : {}),
      nextDirection: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc"
    })),
    rows,
    allRows: sortedRows,
    ...(sort ? { sort } : {}),
    pagination,
    table: table({
      columns: inputModel.columns.map((column) => ({ key: column.key, label: column.label })),
      rows
    })
  };
}

function normalizeSort<T extends Record<string, DataTableCellValue>>(
  sort: DataTableSort | undefined,
  columns: Array<DataTableColumn<T>>
) {
  if (!sort) {
    return undefined;
  }
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column?.sortable) {
    return undefined;
  }
  return sort;
}

function sortRows<T extends Record<string, DataTableCellValue>>(rows: T[], sort?: DataTableSort) {
  if (!sort) {
    return [...rows];
  }
  return [...rows].sort((left, right) => compareCellValues(left[sort.key], right[sort.key], sort));
}

function compareCellValues(
  left: DataTableCellValue,
  right: DataTableCellValue,
  sort: DataTableSort
) {
  const direction = sort.direction === "asc" ? 1 : -1;
  if (left === right) {
    return 0;
  }
  if (left === undefined) {
    return 1;
  }
  if (right === undefined) {
    return -1;
  }
  if (left instanceof Date && right instanceof Date) {
    return (left.getTime() - right.getTime()) * direction;
  }
  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * direction;
  }
  return String(left).localeCompare(String(right)) * direction;
}

function buildPagination(inputModel: {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
  rowCount: number;
}): DataTablePagination {
  const canPrevious = inputModel.page > 1;
  const canNext = inputModel.page < inputModel.totalPages;
  const startRow = inputModel.totalRows === 0 ? 0 : (inputModel.page - 1) * inputModel.pageSize + 1;
  const endRow = inputModel.totalRows === 0 ? 0 : startRow + inputModel.rowCount - 1;
  return {
    page: inputModel.page,
    pageSize: inputModel.pageSize,
    totalRows: inputModel.totalRows,
    totalPages: inputModel.totalPages,
    startRow,
    endRow,
    canPrevious,
    canNext,
    previousAction: button({
      label: "Previous",
      icon: "chevron-left",
      intent: "secondary",
      disabled: !canPrevious
    }),
    nextAction: button({
      label: "Next",
      icon: "chevron-right",
      intent: "secondary",
      disabled: !canNext
    })
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
