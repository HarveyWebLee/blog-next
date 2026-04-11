"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";

import { message } from "@/lib/utils";
import { extractObjectKeyFromPathStyleUrl } from "@/lib/utils/public-object-url";

export type FeaturedImageUploadLabels = {
  /** 主标题（与表单 label 一致） */
  title: string;
  /** 手动填写外链的占位 */
  urlPlaceholder: string;
  /** 尺寸建议等说明 */
  hint: string;
  uploadButton: string;
  removeButton: string;
  uploading: string;
  needLogin: string;
  uploadFailed: string;
  orPasteUrl: string;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** 存储路径前缀：文章配图 article，头像等 profile */
  scope?: "article" | "profile";
  labels: FeaturedImageUploadLabels;
};

/**
 * 特色图片：登录用户可上传到 MinIO；支持替换（自动删旧对象）；仍可手动填 URL。
 */
export function FeaturedImageUpload({ value, onChange, scope = "article", labels }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  /** 最近一次本组件上传得到的对象键，或从当前 value 解析出的可删键 */
  const trackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    trackedKeyRef.current = value ? extractObjectKeyFromPathStyleUrl(value) : null;
  }, [value]);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

  const resolvePreviousKeyForUpload = () => trackedKeyRef.current || "";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

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

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">{labels.title}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="bordered"
          size="md"
          startContent={<Upload className="h-4 w-4" />}
          isLoading={uploading}
          onPress={() => fileRef.current?.click()}
        >
          {uploading ? labels.uploading : labels.uploadButton}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="light"
            color="danger"
            size="md"
            startContent={<Trash2 className="h-4 w-4" />}
            onPress={handleRemove}
            isDisabled={uploading}
          >
            {labels.removeButton}
          </Button>
        ) : null}
      </div>

      {value ? (
        <div className="relative mt-2 max-h-56 overflow-hidden rounded-lg border border-default-200 bg-default-100/40 dark:border-default-100/20">
          {/* 管理页预览：MinIO 域名随环境变化，此处用原生 img 避免 remotePatterns 遗漏 */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 后台预览任意外链/MinIO URL */}
          <img src={value} alt="" className="max-h-56 w-full object-contain" />
        </div>
      ) : null}

      <p className="text-xs text-default-400">{labels.orPasteUrl}</p>
      <Input
        placeholder={labels.urlPlaceholder}
        value={value}
        onValueChange={onChange}
        variant="bordered"
        size="md"
        type="url"
        startContent={<ImageIcon className="h-4 w-4 text-default-400" />}
        className="w-full"
      />
      <p className="text-xs text-default-400">{labels.hint}</p>
    </div>
  );
}
