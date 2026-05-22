import { describe, expect, it } from "vitest";
import { AppError, badRequest, conflict, forbidden, notFound, unauthorized } from "./errors.js";

describe("AppError", () => {
  it("sets status, code, and message and is instanceof Error", () => {
    const error = new AppError(418, "teapot", "I am a teapot.");
    expect(error.status).toBe(418);
    expect(error.code).toBe("teapot");
    expect(error.message).toBe("I am a teapot.");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("badRequest", () => {
  it("produces status 400 with default code", () => {
    const err = badRequest("Field is required.");
    expect(err.status).toBe(400);
    expect(err.code).toBe("bad_request");
    expect(err.message).toBe("Field is required.");
  });

  it("accepts a custom code", () => {
    const err = badRequest("Invalid slug.", "invalid_slug");
    expect(err.code).toBe("invalid_slug");
    expect(err.status).toBe(400);
  });
});

describe("unauthorized", () => {
  it("produces status 401 with default message", () => {
    const err = unauthorized();
    expect(err.status).toBe(401);
    expect(err.code).toBe("unauthorized");
    expect(err.message).toMatch(/authentication/i);
  });

  it("accepts a custom message", () => {
    const err = unauthorized("Token is expired.");
    expect(err.message).toBe("Token is expired.");
    expect(err.status).toBe(401);
  });
});

describe("forbidden", () => {
  it("produces status 403 with default message", () => {
    const err = forbidden();
    expect(err.status).toBe(403);
    expect(err.code).toBe("forbidden");
    expect(err.message).toMatch(/permission/i);
  });

  it("accepts a custom message", () => {
    const err = forbidden("Not your gym.");
    expect(err.message).toBe("Not your gym.");
  });
});

describe("notFound", () => {
  it("produces status 404 with default code and message", () => {
    const err = notFound();
    expect(err.status).toBe(404);
    expect(err.code).toBe("not_found");
    expect(err.message).toMatch(/not found/i);
  });

  it("accepts a custom message", () => {
    const err = notFound("Member not found.");
    expect(err.message).toBe("Member not found.");
  });
});

describe("conflict", () => {
  it("produces status 409 with default code", () => {
    const err = conflict("Email already exists.");
    expect(err.status).toBe(409);
    expect(err.code).toBe("conflict");
    expect(err.message).toBe("Email already exists.");
  });

  it("accepts a custom code", () => {
    const err = conflict("Duplicate barcode.", "duplicate_barcode");
    expect(err.code).toBe("duplicate_barcode");
    expect(err.status).toBe(409);
  });
});
