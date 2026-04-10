"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@heroui/card";
import { Eye, FileText } from "lucide-react";
import { useTheme } from "next-themes";

// 动态导入Toast UI Editor Viewer，禁用SSR
const Viewer = dynamic(() => import("@toast-ui/react-editor").then((mod) => mod.Viewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">内容加载中...</p>
      </div>
    </div>
  ),
}) as any;

interface MarkdownRendererProps {
  content: string;
  className?: string;
  showHeader?: boolean;
  height?: string;
}

const MarkdownRenderer = ({ content, className = "", showHeader = false, height = "auto" }: MarkdownRendererProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("light");
  const viewerRef = useRef<typeof Viewer>(null);
  const { theme, resolvedTheme } = useTheme();

  const updateViewerTheme = useCallback((nextTheme: string) => {
    if (viewerRef.current) {
      try {
        const viewerContainer = viewerRef.current.getRootElement();
        if (viewerContainer) {
          viewerContainer.setAttribute("data-theme", nextTheme);
          viewerContainer.classList.add("theme-transitioning");

          const viewerElements = viewerContainer.querySelectorAll(
            ".toastui-editor-contents, .toastui-editor-md-preview, .toastui-editor-contents p, .toastui-editor-contents h1, .toastui-editor-contents h2, .toastui-editor-contents h3, .toastui-editor-contents h4, .toastui-editor-contents h5, .toastui-editor-contents h6"
          );
          viewerElements.forEach((element: Element) => {
            element.setAttribute("data-theme", nextTheme);
          });

          setTimeout(() => {
            viewerContainer.classList.remove("theme-transitioning");
          }, 300);
        }
      } catch (error) {
        console.warn("Failed to update viewer theme:", error);
      }
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const actualTheme = resolvedTheme || theme || "light";
      setCurrentTheme(actualTheme);
      updateViewerTheme(actualTheme);
    }
  }, [isMounted, theme, resolvedTheme, updateViewerTheme]);

  // 如果组件未挂载，显示加载状态
  if (!isMounted) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="p-4 border-b border-default-200 dark:border-default-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">内容预览</h3>
                <p className="text-sm text-default-600">Markdown 渲染视图</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">内容加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="p-4 border-b border-default-200 dark:border-default-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">内容预览</h3>
                <p className="text-sm text-default-600">Markdown 渲染视图</p>
              </div>
            </div>

            {/* 主题指示器 */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <div
                className={`w-2 h-2 rounded-full ${currentTheme === "dark" ? "bg-blue-500" : "bg-yellow-500"}`}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {currentTheme === "dark" ? "暗色" : "亮色"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="relative" style={{ minHeight: height === "auto" ? "200px" : height }}>
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
    </div>
  );
};

export default MarkdownRenderer;
