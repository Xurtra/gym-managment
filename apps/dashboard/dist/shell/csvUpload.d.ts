import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
export type CsvUploadStatus = "idle" | "ready" | "uploading" | "success" | "error";
export interface UploadFileInput {
    name: string;
    sizeBytes: number;
    type?: string;
    lastModified?: string;
}
export interface CsvUploadPreview {
    columns: string[];
    rows: string[][];
    rowCount: number;
    missingRequiredColumns: string[];
}
export interface DashboardCsvUpload {
    kind: "dashboard_csv_upload";
    label: string;
    status: CsvUploadStatus;
    accept: string;
    maxSizeBytes: number;
    file?: UploadFileInput;
    errors: string[];
    errorCount: number;
    preview?: CsvUploadPreview;
    previewRowCount: number;
    columnCount: number;
    summaryLabel: string;
    empty?: EmptyStateModel;
    chooseAction: ButtonModel;
    uploadAction: ButtonModel;
    removeAction: ButtonModel;
    templateAction?: ButtonModel;
}
export declare function buildDashboardCsvUpload(inputModel: {
    label: string;
    file?: UploadFileInput;
    columns?: string[];
    previewRows?: string[][];
    requiredColumns?: string[];
    maxSizeBytes?: number;
    uploading?: boolean;
    uploaded?: boolean;
    templateAvailable?: boolean;
}): DashboardCsvUpload;
//# sourceMappingURL=csvUpload.d.ts.map