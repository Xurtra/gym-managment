import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import type { ApiConfig } from "../../config/env.js";
import { badRequest, notFound } from "../../http/errors.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const KEY_PREFIX = "member-images";
const STRUCTURED_ASSET_PREFIX = "k_";

interface R2Config {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export async function uploadMemberProfileImage(
  config: ApiConfig,
  scope: { gymId: string; consumerId?: string },
  input: { fileName: string; contentType: string; base64Data: string }
) {
  const storage = requireStorage(config);
  const body = decodeBase64Image(input.base64Data);
  if (body.byteLength > MAX_IMAGE_BYTES) {
    throw badRequest("Profile images must be 5 MB or smaller.", "member_image_too_large");
  }
  const objectKey = buildObjectKey(scope, input.fileName, input.contentType);
  const client = createClient(storage);
  await client.send(
    new PutObjectCommand({
      Bucket: storage.bucket,
      Key: objectKey,
      Body: body,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
  return { assetId: encodeAssetId(objectKey), contentType: input.contentType };
}

export async function readMemberProfileImage(config: ApiConfig, assetId: string) {
  const storage = requireStorage(config);
  const client = createClient(storage);
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: storage.bucket,
        Key: keyForAssetId(assetId)
      })
    );
    if (!response.Body) {
      throw notFound("Profile image was not found.");
    }
    return {
      body: await toUint8Array(response.Body),
      contentType: response.ContentType ?? "application/octet-stream",
      cacheControl: response.CacheControl ?? "public, max-age=3600"
    };
  } catch (error) {
    if (isMissingObject(error)) {
      throw notFound("Profile image was not found.");
    }
    throw error;
  }
}

function requireStorage(config: ApiConfig): R2Config {
  if (
    !config.r2Bucket ||
    !config.r2Endpoint ||
    !config.r2AccessKeyId ||
    !config.r2SecretAccessKey
  ) {
    throw badRequest(
      "Member image storage is not configured on this API instance.",
      "member_image_storage_not_configured"
    );
  }
  return {
    bucket: config.r2Bucket,
    endpoint: config.r2Endpoint,
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey
  };
}

function createClient(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

function buildObjectKey(
  scope: { gymId: string; consumerId?: string },
  fileName: string,
  contentType: string
) {
  const extension = sanitizeExtension(fileName, contentType);
  const gymSegment = sanitizePathSegment(scope.gymId);
  const fileSegment = `${randomUUID()}${extension}`;
  if (scope.consumerId) {
    return `${KEY_PREFIX}/gyms/${gymSegment}/consumers/${sanitizePathSegment(scope.consumerId)}/profile/${fileSegment}`;
  }
  return `${KEY_PREFIX}/gyms/${gymSegment}/uploads/${randomUUID()}/profile/${fileSegment}`;
}

function encodeAssetId(objectKey: string) {
  return `${STRUCTURED_ASSET_PREFIX}${Buffer.from(objectKey, "utf8").toString("base64url")}`;
}

function keyForAssetId(assetId: string) {
  if (assetId.startsWith(STRUCTURED_ASSET_PREFIX)) {
    return decodeAssetId(assetId);
  }
  return `${KEY_PREFIX}/${assetId}`;
}

function decodeAssetId(assetId: string) {
  try {
    const encodedKey = assetId.slice(STRUCTURED_ASSET_PREFIX.length);
    const objectKey = Buffer.from(encodedKey, "base64url").toString("utf8");
    if (!objectKey.startsWith(`${KEY_PREFIX}/`)) {
      throw new Error("invalid");
    }
    return objectKey;
  } catch {
    throw notFound("Profile image was not found.");
  }
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-");
}

function decodeBase64Image(base64Data: string) {
  try {
    const decoded = Buffer.from(base64Data, "base64");
    if (decoded.byteLength === 0) {
      throw new Error("empty");
    }
    return decoded;
  } catch {
    throw badRequest("Profile image payload must be valid base64.", "member_image_invalid_base64");
  }
}

function sanitizeExtension(fileName: string, contentType: string) {
  const fromName = extname(fileName).toLowerCase();
  if (/^\.[a-z0-9]{1,10}$/.test(fromName)) {
    return fromName;
  }
  const subtype = contentType.split("/")[1]?.toLowerCase();
  if (!subtype) {
    return ".bin";
  }
  if (subtype === "jpeg") {
    return ".jpg";
  }
  return `.${subtype.replace(/[^a-z0-9]/g, "") || "bin"}`;
}

async function toUint8Array(body: {
  transformToByteArray?: () => Promise<Uint8Array>;
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | Buffer | string>;
}) {
  if (typeof body.transformToByteArray === "function") {
    return body.transformToByteArray();
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
    if (typeof chunk === "string") {
      chunks.push(new TextEncoder().encode(chunk));
      continue;
    }
    chunks.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function isMissingObject(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const errorWithCode = error as Error & { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return (
    errorWithCode.name === "NoSuchKey" ||
    errorWithCode.Code === "NoSuchKey" ||
    errorWithCode.$metadata?.httpStatusCode === 404
  );
}
