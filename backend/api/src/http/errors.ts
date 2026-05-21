export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export const badRequest = (message: string, code = "bad_request") =>
  new AppError(400, code, message);

export const unauthorized = (message = "Authentication is required.") =>
  new AppError(401, "unauthorized", message);

export const forbidden = (message = "You do not have permission to perform this action.") =>
  new AppError(403, "forbidden", message);

export const notFound = (message = "The requested resource was not found.") =>
  new AppError(404, "not_found", message);

export const conflict = (message: string, code = "conflict") => new AppError(409, code, message);
