/**
 * 登录用户图片上传（MinIO / S3 兼容）
 * POST multipart: file, scope=article|profile, previousKey（可选，替换时删旧对象）
 * DELETE JSON: { key } — 仅允许删除本人命名空间下的对象键
 */
import { NextRequest, NextResponse } from "next/server";

import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  assertUserOwnsObjectKey,
  buildObjectKey,
  buildPublicObjectUrl,
  deleteObjectByKey,
  isObjectStorageConfigured,
  normalizeContentType,
  putScopedObject,
} from "@/lib/services/object-storage.service";
import { isObjectStorageScope } from "@/lib/storage/resource-scopes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";

const MAX_BYTES = 10 * 1024 * 1024;

async function handleUploadsImagePOST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(localizedErrorResponse(request, "common.pleaseLogin"), { status: 401 });
    }

    if (!isObjectStorageConfigured()) {
      return NextResponse.json(localizedErrorResponse(request, "upload.storageNotConfigured"), {
        status: 503,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const scopeRaw = String(formData.get("scope") || "article");
    const previousKey = String(formData.get("previousKey") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(localizedErrorResponse(request, "upload.multipartRequired"), { status: 400 });
    }

    if (!isObjectStorageScope(scopeRaw)) {
      return NextResponse.json(localizedErrorResponse(request, "upload.invalidScope"), { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length === 0) {
      return NextResponse.json(localizedErrorResponse(request, "upload.fileEmpty"), { status: 400 });
    }
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(localizedErrorResponse(request, "upload.fileTooLarge"), { status: 400 });
    }

    const contentType = normalizeContentType(file.type, file.name);
    if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) {
      return NextResponse.json(localizedErrorResponse(request, "upload.invalidType"), { status: 400 });
    }

    const key = buildObjectKey(scopeRaw, user.userId, file.name);
    await putScopedObject({ key, body: buf, contentType });

    if (previousKey) {
      if (assertUserOwnsObjectKey(previousKey, user.userId)) {
        try {
          await deleteObjectByKey(previousKey);
        } catch (e) {
          logger.warn("api/uploads/image", "删除旧对象失败（已忽略）", { err: String(e) });
        }
      }
    }

    const url = buildPublicObjectUrl(key);
    if (!url) {
      return NextResponse.json(localizedErrorResponse(request, "upload.publicUrlMissing"), {
        status: 500,
      });
    }

    return NextResponse.json(localizedSuccessResponse(request, { url, key, scope: scopeRaw }, "upload.success"), {
      status: 200,
    });
  } catch (error) {
    throw error;
  }
}

async function handleUploadsImageDELETE(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(localizedErrorResponse(request, "common.pleaseLogin"), { status: 401 });
    }

    if (!isObjectStorageConfigured()) {
      return NextResponse.json(localizedErrorResponse(request, "upload.storageUnavailable"), { status: 503 });
    }

    let key = "";
    try {
      const body = await request.json();
      key = String(body?.key || "").trim();
    } catch {
      key = new URL(request.url).searchParams.get("key")?.trim() || "";
    }

    if (!key) {
      return NextResponse.json(localizedErrorResponse(request, "upload.keyRequired"), { status: 400 });
    }

    if (!assertUserOwnsObjectKey(key, user.userId)) {
      return NextResponse.json(localizedErrorResponse(request, "upload.forbiddenDelete"), { status: 403 });
    }

    await deleteObjectByKey(key);
    return NextResponse.json(localizedSuccessResponse(request, null, "upload.deleted"), { status: 200 });
  } catch (error) {
    throw error;
  }
}

export const { POST, DELETE } = defineApiHandlers(
  {
    POST: handleUploadsImagePOST,
    DELETE: handleUploadsImageDELETE,
  },
  {
    onUnhandledErrorResponse: ({ request, method }) =>
      NextResponse.json(localizedErrorResponse(request, method === "POST" ? "upload.failed" : "upload.deleteFailed"), {
        status: 500,
      }),
  }
);
