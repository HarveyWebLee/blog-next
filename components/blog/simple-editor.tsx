"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Maximize2, Minimize2, Save, Settings, Sparkles, Type } from "lucide-react";
import { useTheme } from "next-themes";

// 动态导入Toast UI Editor，禁用SSR
const Editor = dynamic(() => import("@toast-ui/react-editor").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">编辑器加载中...</p>
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
  onSave?: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

const SimpleEditor = ({
  value = "",
  onChange,
  placeholder = "开始编写您的博客内容...",
  height = "500px",
  className = "",
  onSave,
  autoSave = false,
  autoSaveInterval = 30000,
}: SimpleEditorProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("light");
  const editorRef = useRef<typeof Editor>(null);
  const { theme, resolvedTheme } = useTheme();

  // 确保组件只在客户端挂载后渲染
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 更新编辑器主题的函数
  const updateEditorTheme = useCallback((theme: string) => {
    if (editorRef.current) {
      try {
        // 获取编辑器根元素
        const editorContainer = editorRef.current.getRootElement();
        if (editorContainer) {
          // 更新根容器的主题属性
          editorContainer.setAttribute("data-theme", theme);
          editorContainer.classList.add("theme-transitioning");

          // 查找并更新所有相关的编辑器元素
          const editorElements = editorContainer.querySelectorAll(
            ".tui-editor-defaultUI, .te-toolbar, .te-editor, .te-preview, .ProseMirror"
          );
          editorElements.forEach((element: Element) => {
            element.setAttribute("data-theme", theme);
          });

          // 移除过渡效果类
          setTimeout(() => {
            editorContainer.classList.remove("theme-transitioning");
          }, 300);
        }
      } catch (error) {
        console.warn("Failed to update editor theme:", error);
        // 如果更新失败，至少通过CSS类名更新主题
        try {
          const editorContainer = editorRef.current.getRootElement();
          if (editorContainer) {
            editorContainer.setAttribute("data-theme", theme);
          }
        } catch (fallbackError) {
          console.warn("Fallback theme update also failed:", fallbackError);
        }
      }
    }
  }, []);

  // 监听主题变化
  useEffect(() => {
    if (isMounted) {
      const actualTheme = resolvedTheme || theme || "light";
      setCurrentTheme(actualTheme);

      // 延迟更新编辑器的主题，确保编辑器已完全加载
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
    } else {
      if (editorRef.current) {
        editorRef.current.getInstance().setHeight(height);
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, height]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  // 自动保存
  useEffect(() => {
    if (autoSave) {
      const intervalId = setInterval(() => {
        setIsAutoSaving(true);
        handleSave();
        setTimeout(() => setIsAutoSaving(false), 1000);
      }, autoSaveInterval);
      return () => clearInterval(intervalId);
    }
  }, [autoSave, autoSaveInterval, handleSave]);

  // 全屏状态监听
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

  // 初始化编辑器
  useEffect(() => {
    if (isMounted && editorRef.current) {
      const editorInstance = editorRef.current.getInstance();

      // 设置初始内容
      if (value && value !== editorInstance.getMarkdown()) {
        editorInstance.setMarkdown(value);
      }

      // 应用当前主题
      updateEditorTheme(currentTheme);

      // 监听内容变化
      editorInstance.on("change", handleContentChange);

      return () => {
        editorInstance.off("change", handleContentChange);
      };
    }
  }, [isMounted, value, handleContentChange, currentTheme, updateEditorTheme]);

  // 如果组件未挂载，显示加载状态
  if (!isMounted) {
    return (
      <div className={`${className}`}>
        <Card className="shadow-xl border-0 bg-gradient-to-br from-background to-default-50 rounded-2xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                  <Type className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    编辑器
                  </h3>
                  <p className="text-default-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    支持 Markdown / WYSIWYG 双模式
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-4 p-0">
            <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">编辑器加载中...</p>
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
        className={`shadow-xl border-0 bg-gradient-to-br from-background to-default-50 ${isFullscreen ? "h-full rounded-none" : "rounded-2xl"}`}
      >
        <CardHeader className="pb-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Type className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  编辑器
                </h3>
                <p className="text-default-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  支持 Markdown / WYSIWYG 双模式
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 主题指示器 */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div
                  className={`w-2 h-2 rounded-full ${currentTheme === "dark" ? "bg-blue-500" : "bg-yellow-500"}`}
                ></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {currentTheme === "dark" ? "暗色" : "亮色"}
                </span>
              </div>

              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
                onPress={handleFullscreenToggle}
                title={isFullscreen ? "退出全屏" : "全屏编辑"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-4 p-0 space-y-6">
          {/* 状态栏 */}
          <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-success-50 to-info-50 dark:from-success-900/20 dark:to-info-900/20 border border-success-200 dark:border-success-800">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="font-medium text-success-700 dark:text-success-300">
                  字数: {value.split(/\s+/).filter((word) => word.length > 0).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-info rounded-full"></div>
                <span className="font-medium text-info-700 dark:text-info-300">字符: {value.length}</span>
              </div>
              {isAutoSaving && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 text-warning animate-spin">⚡</div>
                  <span className="text-warning-600">自动保存中...</span>
                </div>
              )}
            </div>

            <Button
              size="sm"
              color="primary"
              variant="shadow"
              className="font-medium"
              onPress={handleSave}
              startContent={<Save className="w-4 h-4" />}
            >
              保存
            </Button>
          </div>

          {/* Toast UI Editor */}
          <div className="relative">
            <Editor
              key={currentTheme}
              theme={currentTheme}
              ref={editorRef}
              height={isFullscreen ? "calc(100vh - 200px)" : height}
              initialEditType="markdown"
              previewStyle="vertical"
              usageStatistics={false}
              placeholder={placeholder}
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
                  // 处理图片上传
                  const reader = new FileReader();
                  reader.onload = (e: ProgressEvent<FileReader>) => {
                    callback(e.target?.result as string, "image");
                  };
                  reader.readAsDataURL(blob);
                },
              }}
            />
          </div>

          {/* 功能说明 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-info-50 to-primary-50 dark:from-info-900/20 dark:to-primary-900/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-info/20">
                <Settings className="w-5 h-5 text-info" />
              </div>
              <div className="text-sm">
                <p className="font-semibold mb-3 text-info-700 dark:text-info-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Editor 功能
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-info-600 dark:text-info-400">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-info rounded-full"></div>
                    <span>
                      <strong>双模式编辑：</strong>Markdown 源码 + WYSIWYG 所见即所得
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-info rounded-full"></div>
                    <span>
                      <strong>实时预览：</strong>左侧编辑，右侧实时预览
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-info rounded-full"></div>
                    <span>
                      <strong>丰富工具栏：</strong>标题、粗体、斜体、列表、表格等
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-info rounded-full"></div>
                    <span>
                      <strong>代码高亮：</strong>支持多种编程语言语法高亮
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-info rounded-full"></div>
                    <span>
                      <strong>图片支持：</strong>拖拽上传和粘贴图片
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-info rounded-full"></div>
                    <span>
                      <strong>全屏编辑：</strong>专注写作体验
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SimpleEditor;
