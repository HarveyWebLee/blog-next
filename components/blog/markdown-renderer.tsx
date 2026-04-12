"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@heroui/spinner";
import { useTheme } from "next-themes";

// 动态导入 Toast UI Viewer，禁用 SSR（与正文编辑器同引擎，保证渲染一致）
const Viewer = dynamic(() => import("@toast-ui/react-editor").then((mod) => mod.Viewer), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[12rem] items-center justify-center rounded-xl bg-default-100/60 dark:bg-default-50/10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner size="lg" color="primary" />
        <p className="text-default-500 text-sm">内容加载中…</p>
      </div>
    </div>
  ),
}) as React.ComponentType<Record<string, unknown>>;

interface MarkdownRendererProps {
  content: string;
  className?: string;
  showHeader?: boolean;
  height?: string;
}

/**
 * 博客正文 Markdown 展示：与 SimpleEditor（Toast UI）同源渲染。
 * 通过 getInstance().setMarkdown 同步 props，避免仅 initialValue 导致切换文章或异步加载后内容不更新。
 */
const MarkdownRenderer = ({ content, className = "", showHeader = false, height = "auto" }: MarkdownRendererProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("light");
  const viewerRef = useRef<{
    getInstance?: () => { setMarkdown: (v: string) => void };
    getRootElement?: () => HTMLElement | null;
  } | null>(null);
  const { theme, resolvedTheme } = useTheme();

  const updateViewerTheme = useCallback((nextTheme: string) => {
    const root = viewerRef.current?.getRootElement?.();
    if (!root) return;
    try {
      root.setAttribute("data-theme", nextTheme);
      root.classList.add("theme-transitioning");
      const viewerElements = root.querySelectorAll(
        ".toastui-editor-contents, .toastui-editor-md-preview, .toastui-editor-contents p, .toastui-editor-contents h1, .toastui-editor-contents h2, .toastui-editor-contents h3, .toastui-editor-contents h4, .toastui-editor-contents h5, .toastui-editor-contents h6"
      );
      viewerElements.forEach((element: Element) => {
        element.setAttribute("data-theme", nextTheme);
      });
      setTimeout(() => {
        root.classList.remove("theme-transitioning");
      }, 300);
    } catch (error) {
      console.warn("Failed to update viewer theme:", error);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const actualTheme = resolvedTheme || theme || "light";
    setCurrentTheme(actualTheme);
    updateViewerTheme(actualTheme);
  }, [isMounted, theme, resolvedTheme, updateViewerTheme]);

  /** 与 SimpleEditor 一致：实例就绪后把外部 content 写入 Viewer（解决 initialValue 只生效一次） */
  useEffect(() => {
    if (!isMounted) return;
    let cancelled = false;
    let rafId = 0;

    const syncMarkdown = () => {
      if (cancelled) return;
      const inst = viewerRef.current?.getInstance?.();
      if (!inst?.setMarkdown) {
        rafId = requestAnimationFrame(syncMarkdown);
        return;
      }
      const next = content ?? "";
      try {
        inst.setMarkdown(next);
      } catch {
        /* 热切换或卸载边界 */
      }
    };

    rafId = requestAnimationFrame(syncMarkdown);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [isMounted, content, currentTheme]);

  if (!isMounted) {
    return (
      <div className={`blog-article-markdown min-w-0 ${className}`}>
        {showHeader ? (
          <div className="border-default-200 dark:border-default-700 mb-4 border-b pb-4">
            <h3 className="text-foreground font-semibold">内容预览</h3>
            <p className="text-default-600 text-sm">Markdown 渲染视图</p>
          </div>
        ) : null}
        <div className="flex min-h-[12rem] items-center justify-center rounded-xl bg-default-100/60 dark:bg-default-50/10">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" color="primary" />
            <p className="text-default-500 text-sm">内容加载中…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className={`blog-article-markdown min-w-0 ${className}`}>
      {showHeader ? (
        <div className="border-default-200 dark:border-default-700 mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="text-foreground font-semibold">内容预览</h3>
            <p className="text-default-600 text-sm">Markdown 渲染视图</p>
          </div>
          <div className="border-default-200 dark:border-default-700 flex items-center gap-2 rounded-full border bg-content1/80 px-3 py-1 text-xs backdrop-blur-sm">
            <span className={`h-2 w-2 rounded-full ${currentTheme === "dark" ? "bg-primary-400" : "bg-warning-500"}`} />
            <span className="text-default-600 font-medium dark:text-default-300">
              {currentTheme === "dark" ? "暗色" : "亮色"}
            </span>
          </div>
        </div>
      ) : null}

      <div
        className="blog-article-markdown__viewer relative"
        style={{ minHeight: height === "auto" ? "min(12rem, 40vh)" : height }}
      >
        <Viewer
          mode="preview"
          theme={currentTheme}
          key={currentTheme}
          ref={viewerRef}
          initialValue={content || ""}
          usageStatistics={false}
          className="toastui-editor-viewer"
        />
      </div>
    </article>
  );
};

export default MarkdownRenderer;
