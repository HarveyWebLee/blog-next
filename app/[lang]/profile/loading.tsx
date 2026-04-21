"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function ProfilePageLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-3">
            {/* 资料概览骨架 */}
            <Card className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
              <CardBody className="p-6">
                <div className="mb-5 flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              </CardBody>
            </Card>

            {/* 统计卡骨架 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
                  <CardBody className="p-5">
                    <Skeleton className="mb-3 h-4 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* 最近活动骨架 */}
            <Card className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
              <CardBody className="p-6">
                <Skeleton className="mb-4 h-6 w-28 rounded-lg" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 rounded-lg" />
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 侧栏导航骨架 */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
              <CardBody className="p-4">
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 rounded-lg" />
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
