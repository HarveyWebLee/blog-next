"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";
import { Layers, Tag as TagIcon } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* 页面标题骨架 */}
      <div className="mb-12 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <Layers className="w-8 h-8 text-primary" />
          </div>
          <Skeleton className="h-12 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-96 mx-auto rounded-lg" />
      </div>

      {/* 统计信息骨架 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardBody className="p-4 text-center">
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 标签云骨架 */}
      <Card className="mb-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
              <TagIcon className="w-6 h-6 text-primary" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {Array.from({ length: 20 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-8 rounded-full animate-pulse"
                style={{
                  width: `${Math.random() * 60 + 40}px`,
                  animationDelay: `${index * 50}ms`,
                }}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 搜索和筛选骨架 */}
      <Card className="mb-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
        <CardBody className="p-6">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-48 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 标签列表骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card
            key={index}
            className="backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="w-10 h-10 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
