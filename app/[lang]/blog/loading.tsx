"use client";

import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="mb-8 border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
            <CardHeader>
              <div className="w-full space-y-2">
                <Skeleton className="h-6 w-36 rounded-lg" />
                <Skeleton className="h-4 w-72 rounded-lg" />
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            </CardBody>
          </Card>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
                <CardBody className="p-5">
                  <Skeleton className="mb-4 h-40 w-full rounded-xl" />
                  <Skeleton className="mb-3 h-6 w-3/4 rounded-lg" />
                  <Skeleton className="mb-2 h-4 w-full rounded-lg" />
                  <Skeleton className="mb-4 h-4 w-5/6 rounded-lg" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
            <CardBody className="p-5">
              <Skeleton className="mb-4 h-6 w-24 rounded-lg" />
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 rounded-lg" />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
