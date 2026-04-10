"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loading from "@/components/ui/loading";

export default function SlowLoadingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);

      const timer = setTimeout(() => {
        setIsLoading(false);
        clearInterval(interval);
      }, 10000); // 10秒加载时间

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isLoading]);

  const resetLoading = () => {
    setIsLoading(true);
    setLoadingTime(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <Loading variant="spinner" text={`正在加载内容... (${loadingTime}/10秒)`} size="lg" />
          <div className="w-64 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(loadingTime / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground">这是一个模拟的慢速加载页面，用于测试加载UI效果</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">慢速加载测试完成</h1>
          <p className="text-muted-foreground text-lg">这个页面模拟了10秒的加载时间，让你可以充分查看加载UI的效果</p>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">加载完成信息</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>• 加载时间: 10秒</p>
            <p>• 加载类型: 旋转加载器</p>
            <p>• 进度条: 已显示</p>
            <p>• 状态文本: 动态更新</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">测试其他加载效果</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">点击下面的按钮重新开始加载，体验不同的加载效果</p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={resetLoading} variant="default">
                重新开始加载 (10秒)
              </Button>
              <Button onClick={() => (window.location.href = "/loading-test")} variant="outline">
                查看交互式测试页面
              </Button>
              <Button onClick={() => (window.location.href = "/loading-demo")} variant="outline">
                查看演示页面
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">加载UI特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">视觉效果</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 流畅的CSS动画</li>
                <li>• 响应式设计</li>
                <li>• 暗色模式支持</li>
                <li>• 自定义颜色主题</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">用户体验</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 清晰的加载状态提示</li>
                <li>• 进度指示器</li>
                <li>• 可自定义的加载文本</li>
                <li>• 多种加载动画选择</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
