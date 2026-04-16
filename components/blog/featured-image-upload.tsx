"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import { Image as ImageIcon, ImagePlus, Trash2, Upload } from "lucide-react";

import { message } from "@/lib/utils";
import { extractObjectKeyFromPathStyleUrl } from "@/lib/utils/public-object-url";

export type FeaturedImageUploadLabels = {
  /** 主标题（与表单 label 一致） */
  title: string;
  /** 格式与尺寸建议等说明（仅上传入口） */
  hint: string;
  /** 空态虚线区内副文案：点击 / 拖拽说明 */
  emptyDropHint: string;
  uploadButton: string;
  removeButton: string;
  uploading: string;
  needLogin: string;
  uploadFailed: string;
  /** 头像裁剪：标题 */
  cropTitle?: string;
  /** 头像裁剪：说明文案 */
  cropHint?: string;
  /** 头像裁剪：缩放滑杆标签 */
  cropZoom?: string;
  /** 头像裁剪：取消按钮 */
  cropCancel?: string;
  /** 头像裁剪：确认按钮 */
  cropConfirm?: string;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** 存储路径前缀：文章配图 article，头像等 profile */
  scope?: "article" | "profile";
  labels: FeaturedImageUploadLabels;
};

const ACCEPT_MIME = /^image\/(jpeg|png|gif|webp)$/i;
const PROFILE_CROP_EXPORT_SIZE = 512;

type CropState = {
  x: number;
  y: number;
  scale: number;
};

const CROP_MIN_SCALE = 0.1;
const CROP_MAX_SCALE = 8;

function clampScale(v: number): number {
  return Math.min(CROP_MAX_SCALE, Math.max(CROP_MIN_SCALE, v));
}

/**
 * 特色图片：登录用户仅能通过本组件上传到 MinIO；支持替换（自动删旧对象）与移除。
 * 表单中的 URL 仍可由上传结果写入；历史外链数据仅展示预览，不提供手输修改入口。
 */
export function FeaturedImageUpload({ value, onChange, scope = "article", labels }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  /** 拖拽悬停时高亮虚线区 */
  const [isDragging, setIsDragging] = useState(false);
  /** 最近一次本组件上传得到的对象键，或从当前 value 解析出的可删键 */
  const trackedKeyRef = useRef<string | null>(null);
  /** 头像裁剪态：仅 scope=profile 使用 */
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropImageMeta, setCropImageMeta] = useState<{ width: number; height: number } | null>(null);
  const [cropState, setCropState] = useState<CropState>({ x: 0, y: 0, scale: 1 });
  const [cropViewportSize, setCropViewportSize] = useState(340);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const cropStageRef = useRef<HTMLDivElement>(null);
  const lastCropObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    trackedKeyRef.current = value ? extractObjectKeyFromPathStyleUrl(value) : null;
  }, [value]);

  useEffect(() => {
    if (!cropSource) return;
    if (lastCropObjectUrlRef.current && lastCropObjectUrlRef.current !== cropSource) {
      URL.revokeObjectURL(lastCropObjectUrlRef.current);
    }
    lastCropObjectUrlRef.current = cropSource;
    const img = new Image();
    img.onload = () => {
      const minSide = Math.min(img.width, img.height);
      const baseScale = PROFILE_CROP_EXPORT_SIZE / minSide;
      setCropImageMeta({ width: img.width, height: img.height });
      setCropState({ x: 0, y: 0, scale: Math.max(baseScale, 1) });
    };
    img.src = cropSource;
  }, [cropSource]);

  useEffect(() => {
    if (!cropSource || !cropStageRef.current) return;
    const element = cropStageRef.current;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const size = Math.max(1, Math.round(Math.min(rect.width, rect.height)));
      setCropViewportSize(size);
    };
    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [cropSource]);

  useEffect(() => {
    return () => {
      if (lastCropObjectUrlRef.current) {
        URL.revokeObjectURL(lastCropObjectUrlRef.current);
        lastCropObjectUrlRef.current = null;
      }
    };
  }, []);

  /**
   * React 合成 onWheel 在浏览器里常以 passive 注册，preventDefault 不生效，页面仍会滚动。
   * 必须用原生 addEventListener(..., { passive: false }) 才能拦住默认滚动。
   */
  useLayoutEffect(() => {
    if (scope !== "profile" || !cropSource) return;
    const el = cropStageRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const anchorX = e.clientX - rect.left - rect.width / 2;
      const anchorY = e.clientY - rect.top - rect.height / 2;
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      setCropState((prev) => {
        const nextScale = clampScale(prev.scale * factor);
        if (nextScale === prev.scale) return prev;
        const ratio = nextScale / prev.scale;
        return {
          x: anchorX - (anchorX - prev.x) * ratio,
          y: anchorY - (anchorY - prev.y) * ratio,
          scale: nextScale,
        };
      });
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [cropSource, scope]);

  const cropTexts = useMemo(
    () => ({
      title:
        labels.cropTitle || (scope === "profile" ? (labels.title.includes("Avatar") ? "Avatar Crop" : "头像裁剪") : ""),
      hint:
        labels.cropHint ||
        (scope === "profile"
          ? labels.title.includes("Avatar")
            ? "Drag to move and use zoom to fit your square avatar."
            : "拖拽调整位置，并通过缩放生成正方形头像。"
          : ""),
      zoom: labels.cropZoom || (labels.title.includes("Avatar") ? "Zoom" : "缩放"),
      cancel: labels.cropCancel || (labels.title.includes("Avatar") ? "Cancel" : "取消"),
      confirm: labels.cropConfirm || (labels.title.includes("Avatar") ? "Confirm Crop" : "确认裁剪"),
    }),
    [labels, scope]
  );

  const cropFitScale = useMemo(() => {
    if (!cropImageMeta || cropViewportSize <= 0) return 1;
    return cropViewportSize / Math.min(cropImageMeta.width, cropImageMeta.height);
  }, [cropImageMeta, cropViewportSize]);

  const setCropScaleAtAnchor = useCallback((nextScaleRaw: number, anchorX: number, anchorY: number) => {
    setCropState((prev) => {
      const nextScale = clampScale(nextScaleRaw);
      if (nextScale === prev.scale) return prev;
      const ratio = nextScale / prev.scale;
      return {
        x: anchorX - (anchorX - prev.x) * ratio,
        y: anchorY - (anchorY - prev.y) * ratio,
        scale: nextScale,
      };
    });
  }, []);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

  const resolvePreviousKeyForUpload = () => trackedKeyRef.current || "";

  const processUploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPT_MIME.test(file.type)) {
        message.warning(labels.hint);
        return;
      }

      const token = getToken();
      if (!token) {
        message.warning(labels.needLogin);
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("scope", scope);
      const pk = resolvePreviousKeyForUpload();
      if (pk) fd.append("previousKey", pk);

      setUploading(true);
      try {
        const res = await fetch("/api/uploads/image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const json = await res.json();
        if (json.success && json.data?.url) {
          onChange(json.data.url as string);
          trackedKeyRef.current = (json.data.key as string) || null;
          message.success(json.message || "OK");
        } else {
          message.error(`${labels.uploadFailed}: ${json.message || res.status}`);
        }
      } catch (err) {
        console.error(err);
        message.error(labels.uploadFailed);
      } finally {
        setUploading(false);
      }
    },
    [labels.hint, labels.needLogin, labels.uploadFailed, onChange, scope]
  );

  const openProfileCropper = useCallback(
    async (file: File) => {
      if (!ACCEPT_MIME.test(file.type)) {
        message.warning(labels.hint);
        return;
      }
      const url = URL.createObjectURL(file);
      setCropSource(url);
      setCropImageMeta(null);
      setCropState({ x: 0, y: 0, scale: 1 });
    },
    [labels.hint]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (scope === "profile") {
      await openProfileCropper(file);
      return;
    }
    await processUploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (scope === "profile") {
      await openProfileCropper(file);
      return;
    }
    await processUploadFile(file);
  };

  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropImageMeta) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originX: cropState.x,
      originY: cropState.y,
    };
    setIsDraggingCrop(true);
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag || !cropImageMeta) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    // 注意：不要在 setState 回调中再次读取 dragStartRef.current，避免 pointerup 后被置空导致空引用
    const nextX = drag.originX + dx;
    const nextY = drag.originY + dy;
    setCropState((prev) => ({ ...prev, x: nextX, y: nextY }));
  };

  const handleCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStartRef.current = null;
    setIsDraggingCrop(false);
  };

  const closeCropper = () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
    lastCropObjectUrlRef.current = null;
    setCropSource(null);
    setCropImageMeta(null);
    setCropState({ x: 0, y: 0, scale: 1 });
    setIsDraggingCrop(false);
    dragStartRef.current = null;
  };

  const confirmCropAndUpload = async () => {
    if (!cropSource || !cropImageMeta || !cropStageRef.current) return;
    const rect = cropStageRef.current.getBoundingClientRect();
    const stageSize = Math.round(Math.min(rect.width, rect.height));
    if (stageSize <= 0) return;

    const image = new Image();
    image.src = cropSource;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("crop image load failed"));
    });

    // 视图坐标 -> 原图坐标：导出换算与渲染共用同一套尺度（fitScale * 用户缩放）
    const renderScale = cropFitScale * cropState.scale;
    const sSize = stageSize / renderScale;
    const sx = cropImageMeta.width / 2 - sSize / 2 - cropState.x / renderScale;
    const sy = cropImageMeta.height / 2 - sSize / 2 - cropState.y / renderScale;
    const maxStartX = Math.max(0, cropImageMeta.width - sSize);
    const maxStartY = Math.max(0, cropImageMeta.height - sSize);
    const safeSx = Math.min(maxStartX, Math.max(0, sx));
    const safeSy = Math.min(maxStartY, Math.max(0, sy));

    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_CROP_EXPORT_SIZE;
    canvas.height = PROFILE_CROP_EXPORT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      message.error(labels.uploadFailed);
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, safeSx, safeSy, sSize, sSize, 0, 0, PROFILE_CROP_EXPORT_SIZE, PROFILE_CROP_EXPORT_SIZE);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      message.error(labels.uploadFailed);
      return;
    }
    const croppedFile = new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
    await processUploadFile(croppedFile);
    closeCropper();
  };

  const handleRemove = async () => {
    const key = trackedKeyRef.current;
    const token = getToken();
    if (key && token) {
      try {
        await fetch("/api/uploads/image", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key }),
        });
      } catch {
        /* 仍清空表单展示 */
      }
    }
    trackedKeyRef.current = null;
    onChange("");
  };

  const openFilePicker = () => {
    if (!uploading) fileRef.current?.click();
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-default-200/80",
        "bg-gradient-to-br from-default-100/40 via-primary-50/30 to-secondary-50/25",
        "p-4 shadow-sm backdrop-blur-sm sm:p-5",
        "dark:border-white/10 dark:from-white/[0.04] dark:via-primary-500/[0.06] dark:to-secondary-500/[0.05]"
      )}
    >
      {/* 与博客管理 Card 内区块一致的轻装饰角 */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl dark:bg-primary/20"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4">
        {/* 标题区：与管理页「基本信息」CardHeader 图标行风格对齐 */}
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "flex shrink-0 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 p-2.5",
              "shadow-sm ring-1 ring-primary/10 dark:from-primary/25 dark:to-secondary/15 dark:ring-primary/20"
            )}
          >
            <ImageIcon className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold leading-tight text-foreground">{labels.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-default-500">{labels.hint}</p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileInput}
        />

        {!value ? (
          /* 空态：可点击虚线区 + 主按钮，与项目内渐变/悬停过渡一致 */
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={clsx(
                "group relative flex min-h-[168px] w-full flex-col items-center justify-center gap-3 rounded-xl px-4 py-8",
                "border-2 border-dashed transition-all duration-300",
                "border-default-300/70 bg-content1/30 dark:border-default-500/35 dark:bg-content1/20",
                "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !uploading &&
                  "hover:border-primary/55 hover:bg-primary/5 dark:hover:border-primary/40 dark:hover:bg-primary/10",
                isDragging && "scale-[1.01] border-primary bg-primary/10 dark:bg-primary/15",
                uploading && "cursor-wait opacity-80"
              )}
            >
              <div
                className={clsx(
                  "flex h-14 w-14 items-center justify-center rounded-2xl",
                  "bg-primary/10 text-primary shadow-inner transition-transform duration-300",
                  "group-hover:scale-105 group-hover:bg-primary/15 dark:bg-primary/20 dark:group-hover:bg-primary/25"
                )}
              >
                {uploading ? (
                  <Spinner size="md" color="primary" />
                ) : (
                  <ImagePlus className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {uploading ? labels.uploading : labels.uploadButton}
                </p>
                <p className="mt-1 text-xs text-default-400">
                  {uploading ? "" : labels.emptyDropHint}
                  {scope === "profile"
                    ? ` · ${labels.title.includes("Avatar") ? "Square image recommended" : "建议上传正方形图片"}`
                    : ""}
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* 已选图：预览卡片 + 操作行 */
          <div className="flex flex-col gap-3">
            <div
              className={clsx(
                "relative overflow-hidden rounded-xl",
                "border border-default-200/90 bg-default-100/30 shadow-md ring-1 ring-black/5",
                "dark:border-default-100/15 dark:bg-default-50/10 dark:ring-white/10"
              )}
            >
              <div className="relative max-h-60 min-h-[120px] w-full bg-default-200/20 dark:bg-default-100/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- 后台预览任意外链/MinIO URL */}
                <img src={value} alt="" className="mx-auto max-h-60 w-full object-contain" />
                {uploading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-[2px]">
                    <Spinner size="lg" color="primary" />
                    <span className="text-xs font-medium text-default-600">{labels.uploading}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                color="primary"
                variant="flat"
                size="md"
                className="shadow-sm"
                startContent={<Upload className="h-4 w-4" />}
                isLoading={uploading}
                onPress={openFilePicker}
                isDisabled={uploading}
              >
                {uploading ? labels.uploading : labels.uploadButton}
              </Button>
              <Button
                type="button"
                variant="bordered"
                color="danger"
                size="md"
                className="border-danger-200/80 dark:border-danger-400/30"
                startContent={<Trash2 className="h-4 w-4" />}
                onPress={handleRemove}
                isDisabled={uploading}
              >
                {labels.removeButton}
              </Button>
            </div>
          </div>
        )}

        {scope === "profile" && cropSource ? (
          <div className="rounded-xl border border-default-200/80 bg-background/70 p-3 dark:border-default-200/20">
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">{cropTexts.title}</p>
              <p className="mt-1 text-xs text-default-500">{cropTexts.hint}</p>
            </div>

            <div
              ref={cropStageRef}
              className={clsx(
                "relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden overscroll-contain rounded-xl border border-default-300/70 bg-default-100/60",
                isDraggingCrop ? "cursor-grabbing" : "cursor-grab"
              )}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              onPointerCancel={handleCropPointerUp}
            >
              {cropImageMeta ? (
                // eslint-disable-next-line @next/next/no-img-element -- 裁剪阶段使用本地 objectURL
                <img
                  src={cropSource}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: `${cropImageMeta.width * cropFitScale}px`,
                    height: `${cropImageMeta.height * cropFitScale}px`,
                    transform: `translate(-50%, -50%) translate(${cropState.x}px, ${cropState.y}px) scale(${cropState.scale})`,
                    transformOrigin: "center center",
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner size="md" color="primary" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 ring-2 ring-white/70 dark:ring-black/40" />
            </div>

            <div className="mt-3 space-y-3">
              <label className="block text-xs text-default-500">
                {cropTexts.zoom}
                <input
                  type="range"
                  min={CROP_MIN_SCALE}
                  max={CROP_MAX_SCALE}
                  step={0.005}
                  value={cropState.scale}
                  onChange={(e) => setCropScaleAtAnchor(Number(e.target.value), 0, 0)}
                  className="mt-1 w-full"
                />
              </label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="bordered" onPress={closeCropper} isDisabled={uploading}>
                  {cropTexts.cancel}
                </Button>
                <Button type="button" color="primary" onPress={confirmCropAndUpload} isLoading={uploading}>
                  {cropTexts.confirm}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
