import { button, emptyState, input } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel } from "@gym-platform/ui";
import type { UploadFileInput } from "./csvUpload.js";

export type ImageUploadStatus = "idle" | "ready" | "uploading" | "success" | "error";

export interface ImageUploadFileInput extends UploadFileInput {
  width?: number;
  height?: number;
  previewUrl?: string;
}

export interface DashboardImageUpload {
  kind: "dashboard_image_upload";
  label: string;
  status: ImageUploadStatus;
  accept: string;
  maxSizeBytes: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
  file?: ImageUploadFileInput;
  previewUrl?: string;
  errors: string[];
  errorCount: number;
  hasPreview: boolean;
  summaryLabel: string;
  altTextField: InputModel;
  empty?: EmptyStateModel;
  chooseAction: ButtonModel;
  uploadAction: ButtonModel;
  removeAction: ButtonModel;
}

export function buildDashboardImageUpload(inputModel: {
  label: string;
  file?: ImageUploadFileInput;
  altText?: string;
  maxSizeBytes?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
  uploading?: boolean;
  uploaded?: boolean;
}): DashboardImageUpload {
  const maxSizeBytes = inputModel.maxSizeBytes ?? 5 * 1024 * 1024;
  const errors = validateImageFile({
    file: inputModel.file,
    maxSizeBytes,
    minWidth: inputModel.minWidth,
    minHeight: inputModel.minHeight,
    aspectRatio: inputModel.aspectRatio
  });
  const status = resolveStatus({
    hasFile: Boolean(inputModel.file),
    hasErrors: errors.length > 0,
    uploading: inputModel.uploading ?? false,
    uploaded: inputModel.uploaded ?? false
  });
  const hasPreview = Boolean(inputModel.file?.previewUrl);
  const upload: DashboardImageUpload = {
    kind: "dashboard_image_upload",
    label: inputModel.label.trim(),
    status,
    accept: "image/png,image/jpeg,image/webp",
    maxSizeBytes,
    ...(inputModel.minWidth ? { minWidth: inputModel.minWidth } : {}),
    ...(inputModel.minHeight ? { minHeight: inputModel.minHeight } : {}),
    ...(inputModel.aspectRatio ? { aspectRatio: inputModel.aspectRatio } : {}),
    errors,
    errorCount: errors.length,
    hasPreview,
    summaryLabel:
      !inputModel.file
        ? "No image selected"
        : errors.length > 0
          ? `${errors.length} image validation error${errors.length === 1 ? "" : "s"}`
          : hasPreview
            ? "Image preview ready"
            : "Image ready",
    altTextField: input({
      name: "altText",
      label: "Alt text",
      value: inputModel.altText?.trim() ?? "",
      type: "text",
      required: false
    }),
    chooseAction: button({
      label: inputModel.file ? "Replace image" : "Choose image",
      icon: "image-up",
      intent: "secondary"
    }),
    uploadAction: button({
      label: inputModel.uploading ? "Uploading" : "Upload image",
      icon: "upload",
      disabled: status !== "ready"
    }),
    removeAction: button({
      label: "Remove image",
      icon: "trash-2",
      intent: "secondary",
      disabled: !inputModel.file
    })
  };

  if (inputModel.file) {
    upload.file = inputModel.file;
  }
  if (inputModel.file?.previewUrl) {
    upload.previewUrl = inputModel.file.previewUrl;
  }
  if (!inputModel.file) {
    upload.empty = emptyState({
      title: "No image selected",
      body: "Choose an image to preview and upload."
    });
  }

  return upload;
}

function validateImageFile(inputModel: {
  file: ImageUploadFileInput | undefined;
  maxSizeBytes: number;
  minWidth: number | undefined;
  minHeight: number | undefined;
  aspectRatio: number | undefined;
}) {
  const errors: string[] = [];
  const file = inputModel.file;
  if (!file) {
    return errors;
  }
  const fileName = file.name.toLowerCase();
  const validExtension =
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp");
  const validType =
    !file.type ||
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp";
  if (!validExtension || !validType) {
    errors.push("File must be a PNG, JPG, or WebP image.");
  }
  if (file.sizeBytes > inputModel.maxSizeBytes) {
    errors.push("Image is larger than the allowed size.");
  }
  if (inputModel.minWidth && file.width && file.width < inputModel.minWidth) {
    errors.push("Image width is below the minimum.");
  }
  if (inputModel.minHeight && file.height && file.height < inputModel.minHeight) {
    errors.push("Image height is below the minimum.");
  }
  if (inputModel.aspectRatio && file.width && file.height) {
    const actualRatio = file.width / file.height;
    if (Math.abs(actualRatio - inputModel.aspectRatio) > 0.01) {
      errors.push("Image aspect ratio does not match the required ratio.");
    }
  }
  return errors;
}

function resolveStatus(inputModel: {
  hasFile: boolean;
  hasErrors: boolean;
  uploading: boolean;
  uploaded: boolean;
}): ImageUploadStatus {
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
