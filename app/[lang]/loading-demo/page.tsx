"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loading, { ButtonLoading, CardLoading, ContentLoading, PageLoading } from "@/components/ui/loading";

export default function LoadingDemo() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const loadingVariants = [
    { variant: "spinner" as const, name: "旋转加载器" },
    { variant: "dots" as const, name: "点状加载器" },
    { variant: "pulse" as const, name: "脉冲加载器" },
    { variant: "skeleton" as const, name: "骨架屏加载器" },
    { variant: "wave" as const, name: "波浪加载器" },
    { variant: "shimmer" as const, name: "闪烁加载器" },
  ];

  const sizes = ["sm", "md", "lg"] as const;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">加载UI演示</h1>
          <p className="text-muted-foreground text-lg">展示各种加载动画效果和组件</p>
        </div>

        {/* 基础加载器变体 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">基础加载器变体</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingVariants.map(({ variant, name }) => (
              <div key={variant} className="text-center space-y-4">
                <h3 className="text-lg font-medium">{name}</h3>
                <Loading variant={variant} text={`${name}示例`} />
              </div>
            ))}
          </div>
        </Card>

        {/* 不同尺寸 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">不同尺寸</h2>
          <div className="flex justify-center items-center space-x-8">
            {sizes.map((size) => (
              <div key={size} className="text-center space-y-2">
                <h3 className="text-sm font-medium uppercase">{size}</h3>
                <Loading variant="spinner" size={size} text="" />
              </div>
            ))}
          </div>
        </Card>

        {/* 页面级加载器 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">页面级加载器</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">用于全页面加载状态，占据整个视口</p>
            <Button onClick={() => setActiveDemo(activeDemo === "page" ? null : "page")} variant="outline">
              {activeDemo === "page" ? "隐藏" : "显示"}页面加载器
            </Button>
            {activeDemo === "page" && (
              <div className="relative h-64 border-2 border-dashed border-muted rounded-lg overflow-hidden">
                <PageLoading text="页面加载中..." />
              </div>
            )}
          </div>
        </Card>

        {/* 卡片级加载器 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">卡片级加载器</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">用于卡片内容加载状态，显示骨架屏效果</p>
            <Button onClick={() => setActiveDemo(activeDemo === "card" ? null : "card")} variant="outline">
              {activeDemo === "card" ? "隐藏" : "显示"}卡片加载器
            </Button>
            {activeDemo === "card" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardLoading />
                <CardLoading />
              </div>
            )}
          </div>
        </Card>

        {/* 内容加载器 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">内容加载器</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">用于内容区域加载状态，显示闪烁效果</p>
            <Button onClick={() => setActiveDemo(activeDemo === "content" ? null : "content")} variant="outline">
              {activeDemo === "content" ? "隐藏" : "显示"}内容加载器
            </Button>
            {activeDemo === "content" && (
              <div className="space-y-4">
                <ContentLoading />
                <ContentLoading />
              </div>
            )}
          </div>
        </Card>

        {/* 按钮级加载器 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">按钮级加载器</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">用于按钮内部加载状态</p>
            <div className="flex flex-wrap gap-4">
              <Button disabled>
                <ButtonLoading size="sm" />
                <span className="ml-2">加载中...</span>
              </Button>
              <Button disabled variant="outline">
                <ButtonLoading size="md" />
                <span className="ml-2">处理中...</span>
              </Button>
              <Button disabled variant="secondary">
                <ButtonLoading size="lg" />
                <span className="ml-2">保存中...</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* 自定义样式示例 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">自定义样式</h2>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">自定义颜色</h3>
              <Loading
                variant="spinner"
                className="blog-border-x-box-shadow-blue-500 blog-border-y-box-shadowlue-200"
                text="蓝色加载器"
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">自定义大小</h3>
              <Loading variant="wave" className="scale-150" text="放大波浪加载器" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">渐变效果</h3>
              <Loading variant="pulse" className="bg-gradient-to-r from-blue-500 to-purple-500" text="渐变脉冲加载器" />
            </div>
          </div>
        </Card>

        {/* 使用场景说明 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">使用场景说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">页面级加载</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 路由切换时的全页面加载</li>
                <li>• 应用初始化加载</li>
                <li>• 数据预加载阶段</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">组件级加载</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 卡片内容加载</li>
                <li>• 列表数据加载</li>
                <li>• 表单提交状态</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">交互级加载</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 按钮点击反馈</li>
                <li>• 操作确认状态</li>
                <li>• 微交互反馈</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">内容级加载</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 文章内容加载</li>
                <li>• 图片懒加载</li>
                <li>• 媒体资源加载</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
