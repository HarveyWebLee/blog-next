"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** 存储路径前缀：文章配图 article，头像等 profile */
  scope?: "article" | "profile";
  labels: FeaturedImageUploadLabels;
};

const ACCEPT_MIME = /^image\/(jpeg|png|gif|webp)$/i;

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

  useEffect(() => {
    trackedKeyRef.current = value ? extractObjectKeyFromPathStyleUrl(value) : null;
  }, [value]);

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

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
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
    if (file) await processUploadFile(file);
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
                <p className="mt-1 text-xs text-default-400">{uploading ? "" : labels.emptyDropHint}</p>
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
      </div>
    </div>
  );
}
