"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loading from "@/components/ui/loading";

export default function DelayedPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingVariant, setLoadingVariant] = useState<"spinner" | "dots" | "pulse" | "skeleton" | "wave" | "shimmer">(
    "spinner"
  );

  useEffect(() => {
    // 模拟API调用延迟
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5秒延迟

    return () => clearTimeout(timer);
  }, []);

  const changeVariant = (variant: typeof loadingVariant) => {
    setLoadingVariant(variant);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading variant={loadingVariant} text={`使用 ${loadingVariant} 加载中...`} size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">延迟加载页面</h1>
          <p className="text-muted-foreground text-lg">这个页面模拟了5秒的加载时间，让你可以查看加载UI效果</p>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">测试不同的加载效果</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button onClick={() => changeVariant("spinner")} variant="outline" className="h-16">
              旋转加载器
            </Button>
            <Button onClick={() => changeVariant("dots")} variant="outline" className="h-16">
              点状加载器
            </Button>
            <Button onClick={() => changeVariant("pulse")} variant="outline" className="h-16">
              脉冲加载器
            </Button>
            <Button onClick={() => changeVariant("skeleton")} variant="outline" className="h-16">
              骨架屏加载器
            </Button>
            <Button onClick={() => changeVariant("wave")} variant="outline" className="h-16">
              波浪加载器
            </Button>
            <Button onClick={() => changeVariant("shimmer")} variant="outline" className="h-16">
              闪烁加载器
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">页面内容</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>这是一个模拟的延迟加载页面，用于测试加载UI组件。</p>
            <p>点击上面的按钮可以重新触发加载状态，每次加载持续5秒。</p>
            <p>这样你就可以充分查看不同加载动画的效果了。</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">其他测试页面</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => (window.location.href = "/loading-test")} variant="default">
              交互式测试页面
            </Button>
            <Button onClick={() => (window.location.href = "/slow-loading")} variant="default">
              慢速加载页面 (10秒)
            </Button>
            <Button onClick={() => (window.location.href = "/loading-demo")} variant="outline">
              演示页面
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
