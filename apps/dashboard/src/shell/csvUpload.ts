import { button, emptyState } from "@gym-platform/ui";
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
  preview?: CsvUploadPreview;
  empty?: EmptyStateModel;
  chooseAction: ButtonModel;
  uploadAction: ButtonModel;
  removeAction: ButtonModel;
  templateAction?: ButtonModel;
}

export function buildDashboardCsvUpload(inputModel: {
  label: string;
  file?: UploadFileInput;
  columns?: string[];
  previewRows?: string[][];
  requiredColumns?: string[];
  maxSizeBytes?: number;
  uploading?: boolean;
  uploaded?: boolean;
  templateAvailable?: boolean;
}): DashboardCsvUpload {
  const maxSizeBytes = inputModel.maxSizeBytes ?? 5 * 1024 * 1024;
  const errors = validateCsvFile(inputModel.file, maxSizeBytes);
  const preview = buildPreview(
    inputModel.columns,
    inputModel.previewRows,
    inputModel.requiredColumns
  );
  if (preview.missingRequiredColumns.length > 0) {
    errors.push(`Missing required columns: ${preview.missingRequiredColumns.join(", ")}.`);
  }
  const status = resolveStatus({
    hasFile: Boolean(inputModel.file),
    hasErrors: errors.length > 0,
    uploading: inputModel.uploading ?? false,
    uploaded: inputModel.uploaded ?? false
  });

  const upload: DashboardCsvUpload = {
    kind: "dashboard_csv_upload",
    label: inputModel.label.trim(),
    status,
    accept: ".csv,text/csv",
    maxSizeBytes,
    errors,
    preview,
    chooseAction: button({
      label: inputModel.file ? "Replace CSV" : "Choose CSV",
      icon: "file-up",
      intent: "secondary"
    }),
    uploadAction: button({
      label: inputModel.uploading ? "Uploading" : "Upload CSV",
      icon: "upload",
      disabled: status !== "ready"
    }),
    removeAction: button({
      label: "Remove CSV",
      icon: "trash-2",
      intent: "secondary",
      disabled: !inputModel.file
    })
  };

  if (inputModel.file) {
    upload.file = inputModel.file;
  }
  if (!inputModel.file) {
    upload.empty = emptyState({
      title: "No CSV selected",
      body: "Choose a CSV file to preview and upload."
    });
  }
  if (inputModel.templateAvailable) {
    upload.templateAction = button({
      label: "Download template",
      icon: "download",
      intent: "secondary"
    });
  }

  return upload;
}

function validateCsvFile(file: UploadFileInput | undefined, maxSizeBytes: number) {
  const errors: string[] = [];
  if (!file) {
    return errors;
  }
  const csvExtension = file.name.toLowerCase().endsWith(".csv");
  const csvType = !file.type || file.type === "text/csv" || file.type === "application/csv";
  if (!csvExtension || !csvType) {
    errors.push("File must be a CSV.");
  }
  if (file.sizeBytes > maxSizeBytes) {
    errors.push("File is larger than the allowed size.");
  }
  return errors;
}

function buildPreview(
  columns: string[] | undefined,
  rows: string[][] | undefined,
  requiredColumns: string[] | undefined
): CsvUploadPreview {
  const normalizedColumns = columns ?? [];
  const required = requiredColumns ?? [];
  const selectedColumns = new Set(normalizedColumns.map((column) => column.toLowerCase()));
  return {
    columns: normalizedColumns,
    rows: (rows ?? []).slice(0, 5),
    rowCount: rows?.length ?? 0,
    missingRequiredColumns: required.filter((column) => !selectedColumns.has(column.toLowerCase()))
  };
}

function resolveStatus(inputModel: {
  hasFile: boolean;
  hasErrors: boolean;
  uploading: boolean;
  uploaded: boolean;
}): CsvUploadStatus {
  if (inputModel.hasErrors) {
    return "error";
  }
  if (inputModel.uploading) {
    return "uploading";
  }
  if (inputModel.uploaded) {
    return "success";
  }
  return inputModel.hasFile ? "ready" : "idle";
}
