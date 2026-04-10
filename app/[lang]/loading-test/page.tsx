"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loading from "@/components/ui/loading";

export default function LoadingTestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingVariant, setLoadingVariant] = useState<"spinner" | "dots" | "pulse" | "skeleton" | "wave" | "shimmer">(
    "spinner"
  );
  const [loadingText, setLoadingText] = useState("页面加载中...");
  const [loadingSize, setLoadingSize] = useState<"sm" | "md" | "lg">("md");

  // 模拟加载完成
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5秒后自动完成加载
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const startLoading = (variant: typeof loadingVariant, text: string, size: typeof loadingSize = "md") => {
    setLoadingVariant(variant);
    setLoadingText(text);
    setLoadingSize(size);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading variant={loadingVariant} text={loadingText} size={loadingSize} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">加载状态测试</h1>
          <p className="text-muted-foreground text-lg">点击按钮查看不同的加载效果，每个加载状态会持续5秒</p>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">测试不同的加载变体</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={() => startLoading("spinner", "旋转加载中...", "lg")} variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-lg font-medium">旋转加载器</div>
                <div className="text-sm text-muted-foreground">5秒加载时间</div>
              </div>
            </Button>

            <Button onClick={() => startLoading("dots", "点状加载中...", "lg")} variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-lg font-medium">点状加载器</div>
                <div className="text-sm text-muted-foreground">5秒加载时间</div>
              </div>
            </Button>

            <Button onClick={() => startLoading("pulse", "脉冲加载中...", "lg")} variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-lg font-medium">脉冲加载器</div>
                <div className="text-sm text-muted-foreground">5秒加载时间</div>
              </div>
            </Button>

            <Button
              onClick={() => startLoading("skeleton", "骨架屏加载中...", "lg")}
              variant="outline"
              className="h-20"
            >
              <div className="text-center">
                <div className="text-lg font-medium">骨架屏加载器</div>
                <div className="text-sm text-muted-foreground">5秒加载时间</div>
              </div>
            </Button>

            <Button onClick={() => startLoading("wave", "波浪加载中...", "lg")} variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-lg font-medium">波浪加载器</div>
                <div className="text-sm text-muted-foreground">5秒加载时间</div>
              </div>
            </Button>

            <Button onClick={() => startLoading("shimmer", "闪烁加载中...", "lg")} variant="outline" className="h-20">
              <div className="text-center">
                <div className="text-lg font-medium">闪烁加载器</div>
                <div className="text-sm text-muted-foreground">5秒加载时间</div>
              </div>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">测试不同尺寸</h2>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => startLoading("spinner", "小尺寸加载中...", "sm")} variant="outline">
              小尺寸 (sm)
            </Button>
            <Button onClick={() => startLoading("spinner", "中等尺寸加载中...", "md")} variant="outline">
              中等尺寸 (md)
            </Button>
            <Button onClick={() => startLoading("spinner", "大尺寸加载中...", "lg")} variant="outline">
              大尺寸 (lg)
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">测试页面级加载</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">这些按钮会触发全页面加载状态，模拟真实的路由切换</p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => {
                  setIsLoading(true);
                  setLoadingVariant("spinner");
                  setLoadingText("博客页面加载中...");
                  setLoadingSize("lg");
                }}
                variant="default"
              >
                博客页面加载
              </Button>
              <Button
                onClick={() => {
                  setIsLoading(true);
                  setLoadingVariant("skeleton");
                  setLoadingText("关于页面加载中...");
                  setLoadingSize("lg");
                }}
                variant="default"
              >
                关于页面加载
              </Button>
              <Button
                onClick={() => {
                  setIsLoading(true);
                  setLoadingVariant("wave");
                  setLoadingText("文档页面加载中...");
                  setLoadingSize("lg");
                }}
                variant="default"
              >
                文档页面加载
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">手动控制</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">手动控制加载状态，可以随时开始和停止</p>
            <div className="flex space-x-4">
              <Button onClick={() => setIsLoading(true)} variant="default">
                开始加载
              </Button>
              <Button onClick={() => setIsLoading(false)} variant="outline">
                停止加载
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">当前状态: {isLoading ? "加载中" : "已完成"}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
