/**
 * 登录用户图片上传（MinIO / S3 兼容）
 * POST multipart: file, scope=article|profile, previousKey（可选，替换时删旧对象）
 * DELETE JSON: { key } — 仅允许删除本人命名空间下的对象键
 */

import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(createErrorResponse("请先登录"), { status: 401 });
    }

    if (!isObjectStorageConfigured()) {
      return NextResponse.json(createErrorResponse("对象存储未配置，请联系管理员配置 MINIO_* 环境变量"), {
        status: 503,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const scopeRaw = String(formData.get("scope") || "article");
    const previousKey = String(formData.get("previousKey") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(createErrorResponse("请使用 multipart 上传字段 file"), { status: 400 });
    }

    if (!isObjectStorageScope(scopeRaw)) {
      return NextResponse.json(createErrorResponse("scope 仅支持 article 或 profile"), { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length === 0) {
      return NextResponse.json(createErrorResponse("文件为空"), { status: 400 });
    }
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(createErrorResponse("图片大小不能超过 10MB"), { status: 400 });
    }

    const contentType = normalizeContentType(file.type, file.name);
    if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) {
      return NextResponse.json(createErrorResponse("仅支持 JPEG、PNG、GIF、WebP 图片"), { status: 400 });
    }

    const key = buildObjectKey(scopeRaw, user.userId, file.name);
    await putScopedObject({ key, body: buf, contentType });

    if (previousKey) {
      if (assertUserOwnsObjectKey(previousKey, user.userId)) {
        try {
          await deleteObjectByKey(previousKey);
        } catch (e) {
          console.error("[uploads/image] 删除旧对象失败（已忽略）:", e);
        }
      }
    }

    const url = buildPublicObjectUrl(key);
    if (!url) {
      return NextResponse.json(createErrorResponse("MINIO_PUBLIC_BASE_URL 未配置，无法生成访问地址"), {
        status: 500,
      });
    }

    return NextResponse.json(createSuccessResponse({ url, key, scope: scopeRaw }, "上传成功"), {
      status: 200,
    });
  } catch (error) {
    console.error("[uploads/image] POST:", error);
    return NextResponse.json(createErrorResponse("上传失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(createErrorResponse("请先登录"), { status: 401 });
    }

    if (!isObjectStorageConfigured()) {
      return NextResponse.json(createErrorResponse("对象存储未配置"), { status: 503 });
    }

    let key = "";
    try {
      const body = await request.json();
      key = String(body?.key || "").trim();
    } catch {
      key = new URL(request.url).searchParams.get("key")?.trim() || "";
    }

    if (!key) {
      return NextResponse.json(createErrorResponse("缺少参数 key"), { status: 400 });
    }

    if (!assertUserOwnsObjectKey(key, user.userId)) {
      return NextResponse.json(createErrorResponse("无权删除该资源"), { status: 403 });
    }

    await deleteObjectByKey(key);
    return NextResponse.json(createSuccessResponse(null, "已删除"), { status: 200 });
  } catch (error) {
    console.error("[uploads/image] DELETE:", error);
    return NextResponse.json(createErrorResponse("删除失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}
