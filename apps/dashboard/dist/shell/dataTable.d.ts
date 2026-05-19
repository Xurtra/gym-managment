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
export interface DataTableColumnState<T extends Record<string, DataTableCellValue>> extends DataTableColumn<T> {
    sorted: boolean;
    direction?: DataTableSortDirection;
    nextDirection: DataTableSortDirection;
}
export interface DashboardDataTable<T extends Record<string, DataTableCellValue>> {
    kind: "dashboard_data_table";
    columns: Array<DataTableColumnState<T>>;
    columnCount: number;
    rows: T[];
    rowCount: number;
    allRows: T[];
    totalRowCount: number;
    sort?: DataTableSort;
    sortedColumnKey?: string;
    summaryLabel: string;
    pagination: DataTablePagination;
    table: TableModel<T>;
}
export declare function buildDashboardDataTable<T extends Record<string, DataTableCellValue>>(inputModel: {
    columns: Array<DataTableColumn<T>>;
    rows: T[];
    sort?: DataTableSort;
    page?: number;
    pageSize?: number;
}): DashboardDataTable<T>;
//# sourceMappingURL=dataTable.d.ts.map