"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FALLBACK_LANG = "zh-CN";

export default function LoadingNavPage() {
  const router = useRouter();
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : FALLBACK_LANG;
  const prefix = `/${lang}`;

  const testPages = [
    {
      title: "交互式测试页面",
      description: "可以手动触发不同的加载效果，每个加载持续5秒",
      url: "/loading-test",
      features: ["手动控制", "多种变体", "实时切换"],
    },
    {
      title: "慢速加载页面",
      description: "模拟10秒的慢速加载，带有进度条和倒计时",
      url: "/slow-loading",
      features: ["进度条", "倒计时", "长时间加载"],
    },
    {
      title: "延迟加载页面",
      description: "页面加载时自动显示5秒加载状态",
      url: "/delayed-page",
      features: ["自动加载", "5秒延迟", "变体切换"],
    },
    {
      title: "演示页面",
      description: "展示所有加载组件的静态演示",
      url: "/loading-demo",
      features: ["静态演示", "完整展示", "使用说明"],
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">加载UI测试导航</h1>
          <p className="text-muted-foreground text-lg">选择下面的页面来测试不同的加载UI效果</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testPages.map((page, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">{page.title}</h2>
                  <p className="text-muted-foreground">{page.description}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-primary">特性:</h3>
                  <div className="flex flex-wrap gap-2">
                    {page.features.map((feature, featureIndex) => (
                      <span key={featureIndex} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <Button onClick={() => router.push(`${prefix}${page.url}`)} className="w-full" size="lg">
                  访问 {page.title}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">使用说明</h2>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">如何测试加载效果：</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>点击上面的任意页面按钮</li>
                <li>观察加载动画效果</li>
                <li>在交互式页面中，可以手动触发不同的加载效果</li>
                <li>在慢速加载页面中，可以查看长时间加载的效果</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">测试建议：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>尝试不同的加载变体（spinner, dots, pulse等）</li>
                <li>测试不同尺寸（sm, md, lg）</li>
                <li>在暗色模式下查看效果</li>
                <li>在不同设备上测试响应式效果</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">快速链接</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => router.push(`${prefix}/blog`)} variant="outline">
              博客页面 (有loading.tsx)
            </Button>
            <Button onClick={() => router.push(`${prefix}/about`)} variant="outline">
              关于页面 (有loading.tsx)
            </Button>
            <Button onClick={() => router.push(`${prefix}/api-docs`)} variant="outline">
              API 文档 (有loading.tsx)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
