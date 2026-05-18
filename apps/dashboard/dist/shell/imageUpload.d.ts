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
    altTextField: InputModel;
    empty?: EmptyStateModel;
    chooseAction: ButtonModel;
    uploadAction: ButtonModel;
    removeAction: ButtonModel;
}
export declare function buildDashboardImageUpload(inputModel: {
    label: string;
    file?: ImageUploadFileInput;
    altText?: string;
    maxSizeBytes?: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: number;
    uploading?: boolean;
    uploaded?: boolean;
}): DashboardImageUpload;
//# sourceMappingURL=imageUpload.d.ts.map