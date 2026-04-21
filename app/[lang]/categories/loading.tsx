"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function LoadingPage() {
  return (
    <div className="categories-page">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-xl dark:bg-black/10">
            <CardBody className="p-5">
              <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
              <Skeleton className="mb-2 h-5 w-24 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mb-8 bg-white/10 backdrop-blur-xl dark:bg-black/10">
        <CardBody className="p-6">
          <Skeleton className="mb-4 h-11 w-full rounded-xl" />
          <div className="flex flex-col gap-3 md:flex-row">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-xl dark:bg-black/10">
            <CardBody className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-28 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
