/**
 * S3 兼容对象存储（MinIO）封装：按业务 scope 生成对象键、上传、删除、拼公开 URL。
 * 配置来自环境变量，未配置时上传接口应返回 503 提示。
 */

import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { ObjectStorageScope } from "@/lib/storage/resource-scopes";

let client: S3Client | null = null;

function getS3Client(): S3Client | null {
  const endpoint = process.env.MINIO_ENDPOINT?.trim();
  const accessKeyId = (process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER)?.trim();
  const secretAccessKey = (process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD)?.trim();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  if (!client) {
    client = new S3Client({
      region: process.env.MINIO_REGION?.trim() || "us-east-1",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return client;
}

export function isObjectStorageConfigured(): boolean {
  const bucket = process.env.MINIO_BUCKET?.trim();
  return !!(getS3Client() && bucket);
}

export function getObjectStorageBucket(): string | null {
  const b = process.env.MINIO_BUCKET?.trim();
  return b || null;
}

function extractSafeExtension(filename: string): string {
  const m = filename.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return m ? `.${m[1]}` : "";
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

export const ALLOWED_IMAGE_MIME_TYPES = new Set(Object.keys(MIME_TO_EXT));

/**
 * 构建浏览器可访问的 URL（path-style：/bucket/key）
 */
export function buildPublicObjectUrl(objectKey: string): string {
  const base = (process.env.MINIO_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  const bucket = getObjectStorageBucket();
  if (!base || !bucket) return "";
  return `${base}/${bucket}/${objectKey.replace(/^\/+/, "")}`;
}

/**
 * 生成对象键：{scope}/{userId}/{uuid}.{ext}
 */
export function buildObjectKey(scope: ObjectStorageScope, userId: number, filename: string): string {
  const ext = extractSafeExtension(filename);
  return `${scope}/${userId}/${randomUUID()}${ext}`;
}

export function normalizeContentType(declared: string | undefined, filename: string): string {
  const d = declared?.split(";")[0]?.trim().toLowerCase();
  if (d && ALLOWED_IMAGE_MIME_TYPES.has(d)) return d;
  const ext = extractSafeExtension(filename);
  for (const [mime, e] of Object.entries(MIME_TO_EXT)) {
    if (e === ext) return mime;
  }
  return "application/octet-stream";
}

export async function putScopedObject(params: { key: string; body: Buffer; contentType: string }): Promise<void> {
  const s3 = getS3Client();
  const bucket = getObjectStorageBucket();
  if (!s3 || !bucket) throw new Error("对象存储未配置");

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
}

/**
 * 仅允许删除「当前用户」命名空间下的对象键，防止横向误删。
 */
export function assertUserOwnsObjectKey(key: string, userId: number): boolean {
  const parts = key.split("/").filter(Boolean);
  if (parts.length < 3) return false;
  const [scope, uid] = parts;
  if (scope !== "article" && scope !== "profile") return false;
  return uid === String(userId);
}

export async function deleteObjectByKey(key: string): Promise<void> {
  const s3 = getS3Client();
  const bucket = getObjectStorageBucket();
  if (!s3 || !bucket) throw new Error("对象存储未配置");
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
