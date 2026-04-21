"use client";

import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto w-full max-w-md pt-10">
        <Skeleton className="mb-6 h-5 w-24 rounded-md" />
        <Card className="border border-default-200/80 bg-white/85 shadow-lg dark:border-white/10 dark:bg-black/20">
          <CardHeader className="pb-2">
            <div className="w-full space-y-3 text-center">
              <Skeleton className="mx-auto h-8 w-40 rounded-lg" />
              <Skeleton className="mx-auto h-4 w-60 rounded-lg" />
            </div>
          </CardHeader>
          <CardBody className="space-y-5 pt-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
