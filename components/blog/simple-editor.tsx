"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { ChevronDown, Maximize2, Minimize2, Settings, Sparkles, Type } from "lucide-react";
import { useTheme } from "next-themes";

// 动态导入Toast UI Editor，禁用SSR
const Editor = dynamic(() => import("@toast-ui/react-editor").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-lg bg-default-100 dark:bg-default-50/10">
      <div className="text-center">
        <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-default-500 text-xs">编辑器加载中...</p>
      </div>
    </div>
  ),
}) as any; // 临时类型断言，避免SSR问题

interface SimpleEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
  /** 保留兼容：若需定时回调（如对接草稿接口）可传入；管理页表单保存请使用页面底部主按钮 */
  onSave?: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

const SimpleEditor = ({
  value = "",
  onChange,
  placeholder = "",
  height = "500px",
  className = "",
  onSave,
  autoSave = false,
  autoSaveInterval = 30000,
}: SimpleEditorProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("light");
  const editorRef = useRef<typeof Editor>(null);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateEditorTheme = useCallback((themeName: string) => {
    if (editorRef.current) {
      try {
        const editorContainer = editorRef.current.getRootElement();
        if (editorContainer) {
          editorContainer.setAttribute("data-theme", themeName);
          editorContainer.classList.add("theme-transitioning");
          const editorElements = editorContainer.querySelectorAll(
            ".tui-editor-defaultUI, .te-toolbar, .te-editor, .te-preview, .ProseMirror"
          );
          editorElements.forEach((element: Element) => {
            element.setAttribute("data-theme", themeName);
          });
          setTimeout(() => {
            editorContainer.classList.remove("theme-transitioning");
          }, 300);
        }
      } catch (error) {
        console.warn("Failed to update editor theme:", error);
        try {
          const editorContainer = editorRef.current.getRootElement();
          if (editorContainer) {
            editorContainer.setAttribute("data-theme", themeName);
          }
        } catch (fallbackError) {
          console.warn("Fallback theme update also failed:", fallbackError);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      const actualTheme = resolvedTheme || theme || "light";
      setCurrentTheme(actualTheme);
      const timer = setTimeout(() => {
        updateEditorTheme(actualTheme);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMounted, theme, resolvedTheme, updateEditorTheme]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange) {
      const markdown = editorRef.current.getInstance().getMarkdown();
      onChange(markdown);
    }
  }, [onChange]);

  const handleFullscreenToggle = useCallback(() => {
    if (!isFullscreen) {
      if (editorRef.current) {
        editorRef.current.getInstance().setHeight("100vh");
      }
    } else if (editorRef.current) {
      editorRef.current.getInstance().setHeight(height);
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, height]);

  const handleSave = useCallback(() => {
    onSave?.();
  }, [onSave]);

  useEffect(() => {
    if (autoSave && onSave) {
      const intervalId = setInterval(() => {
        setIsAutoSaving(true);
        handleSave();
        setTimeout(() => setIsAutoSaving(false), 1000);
      }, autoSaveInterval);
      return () => clearInterval(intervalId);
    }
  }, [autoSave, autoSaveInterval, handleSave, onSave]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (editorRef.current) {
          editorRef.current.getInstance().setHeight(height);
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [height]);

  useEffect(() => {
    if (!isMounted) return;
    let cancelled = false;
    let rafId = 0;

    const syncMarkdown = () => {
      if (cancelled) return;
      const inst = editorRef.current?.getInstance?.();
      if (!inst) {
        rafId = requestAnimationFrame(syncMarkdown);
        return;
      }
      const next = value ?? "";
      if (inst.getMarkdown() !== next) {
        inst.setMarkdown(next);
      }
    };

    rafId = requestAnimationFrame(syncMarkdown);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [isMounted, value, currentTheme]);

  useEffect(() => {
    if (!isMounted) return;
    let cancelled = false;
    let rafId = 0;
    let bound: { off: (e: string, fn: () => void) => void } | null = null;

    const attach = () => {
      if (cancelled) return;
      const inst = editorRef.current?.getInstance?.();
      if (!inst) {
        rafId = requestAnimationFrame(attach);
        return;
      }
      bound = inst;
      inst.on("change", handleContentChange);
    };

    rafId = requestAnimationFrame(attach);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      try {
        bound?.off("change", handleContentChange);
      } catch {
        /* 实例可能已销毁 */
      }
    };
  }, [isMounted, handleContentChange, currentTheme]);

  const headerBar = (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="shrink-0 rounded-lg bg-gradient-to-br from-primary to-secondary p-1.5 shadow-sm">
          <Type className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-tight text-foreground">正文编辑</h3>
          <p className="text-default-500 flex items-center gap-1 text-xs">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="truncate">Markdown / 所见即所得</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden items-center gap-1.5 rounded-full border border-default-200 bg-default-100/80 px-2 py-0.5 sm:flex dark:border-default-100/20 dark:bg-default-50/10">
          <div className={`h-1.5 w-1.5 rounded-full ${currentTheme === "dark" ? "bg-blue-500" : "bg-amber-500"}`} />
          <span className="text-default-600 text-[10px] font-medium dark:text-default-400">
            {currentTheme === "dark" ? "暗色" : "亮色"}
          </span>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-default-500"
          onPress={handleFullscreenToggle}
          title={isFullscreen ? "退出全屏" : "全屏编辑"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  if (!isMounted) {
    return (
      <div className={className}>
        <Card className="rounded-xl border border-default-200/70 bg-gradient-to-br from-background via-default-50/30 to-default-50/90 shadow-md backdrop-blur-sm dark:border-white/10 dark:from-white/[0.045] dark:via-background/90 dark:to-secondary-500/[0.06]">
          <CardHeader className="gap-0 pb-2 pt-3">{headerBar}</CardHeader>
          <CardBody className="px-3 pb-3 pt-0">
            <div className="flex h-72 items-center justify-center rounded-lg bg-default-100 dark:bg-default-50/10">
              <div className="text-center">
                <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-default-500 text-xs">编辑器加载中...</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""} ${className}`}>
      <Card
        className={`rounded-xl border border-default-200/70 bg-gradient-to-br from-background via-default-50/30 to-default-50/90 shadow-md backdrop-blur-sm dark:border-white/10 dark:from-white/[0.045] dark:via-background/90 dark:to-secondary-500/[0.06] ${isFullscreen ? "h-full rounded-none" : ""}`}
      >
        <CardHeader className="gap-0 pb-2 pt-3">{headerBar}</CardHeader>

        <CardBody className="space-y-2 px-3 pb-3 pt-0">
          {/* 字数条：紧凑；保存由页面表单统一提交 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-default-200/80 bg-default-100/50 px-2.5 py-1.5 text-[11px] dark:border-default-100/15 dark:bg-default-50/10">
            <span className="text-default-600 dark:text-default-400">
              词数 <strong className="text-foreground">{value.split(/\s+/).filter((w) => w.length > 0).length}</strong>
            </span>
            <span className="text-default-600 dark:text-default-400">
              字符 <strong className="text-foreground">{value.length}</strong>
            </span>
            {autoSave && onSave && isAutoSaving && <span className="text-warning text-[11px]">自动保存…</span>}
          </div>

          {/* 未传 placeholder 时不下发给 Toast，避免空文档仍出现长段默认提示 */}
          <div className="relative overflow-hidden rounded-lg border border-default-200/60 dark:border-default-100/10">
            <Editor
              key={currentTheme}
              theme={currentTheme}
              ref={editorRef}
              height={isFullscreen ? "calc(100vh - 120px)" : height}
              initialEditType="markdown"
              initialValue={value ?? ""}
              previewStyle="vertical"
              usageStatistics={false}
              {...(placeholder?.trim() ? { placeholder: placeholder.trim() } : {})}
              toolbarItems={[
                ["heading", "bold", "italic", "strike"],
                ["hr", "quote"],
                ["ul", "ol", "task", "indent", "outdent"],
                ["table", "image", "link"],
                ["code", "codeblock"],
                ["scrollSync"],
              ]}
              hooks={{
                addImageBlobHook: (blob: Blob, callback: (dataUrl: string, type: string) => void) => {
                  const reader = new FileReader();
                  reader.onload = (e: ProgressEvent<FileReader>) => {
                    callback(e.target?.result as string, "image");
                  };
                  reader.readAsDataURL(blob);
                },
              }}
            />
          </div>

          {/* 功能说明：默认折叠，减少占高 */}
          <div className="rounded-lg border border-default-200/60 bg-default-100/30 dark:border-default-100/10 dark:bg-default-50/5">
            <Button
              type="button"
              variant="light"
              size="sm"
              className="h-9 min-h-9 w-full justify-between gap-2 px-2.5 text-default-700 dark:text-default-300"
              onPress={() => setTipsOpen((o) => !o)}
              endContent={
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-default-400 transition-transform ${tipsOpen ? "rotate-180" : ""}`}
                />
              }
            >
              <span className="flex items-center gap-2 text-xs font-medium">
                <Settings className="h-3.5 w-3.5" />
                编辑器功能说明
              </span>
            </Button>
            {tipsOpen && (
              <div className="border-t border-default-200/50 px-2.5 pb-2.5 pt-1 dark:border-default-100/10">
                <ul className="grid grid-cols-1 gap-1.5 text-[11px] leading-snug text-default-600 sm:grid-cols-2 dark:text-default-400">
                  <li className="flex gap-1.5">
                    <span className="text-primary">·</span>
                    双模式：Markdown 与所见即所得
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-primary">·</span>
                    分栏预览与滚动同步
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-primary">·</span>
                    工具栏：标题、列表、表格、代码块等
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-primary">·</span>
                    代码高亮与图片粘贴
                  </li>
                  <li className="flex gap-1.5 sm:col-span-2">
                    <span className="text-primary">·</span>
                    全屏编辑见右上角按钮；保存请使用页面底部「保存」
                  </li>
                </ul>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SimpleEditor;
