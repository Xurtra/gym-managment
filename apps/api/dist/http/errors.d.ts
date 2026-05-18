export declare class AppError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
export declare const badRequest: (message: string, code?: string) => AppError;
export declare const unauthorized: (message?: string) => AppError;
export declare const forbidden: (message?: string) => AppError;
export declare const notFound: (message?: string) => AppError;
export declare const conflict: (message: string, code?: string) => AppError;
//# sourceMappingURL=errors.d.ts.map