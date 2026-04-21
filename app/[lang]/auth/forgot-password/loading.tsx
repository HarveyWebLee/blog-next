"use client";

import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";

export default function LoadingPage() {
  return (
    <div className="h-screen overflow-y-auto pt-24">
      <div className="container mx-auto max-w-screen-sm px-4">
        <Skeleton className="mb-6 h-10 w-28 rounded-full" />
        <Card className="border border-default-200/80 bg-white/85 shadow-lg dark:border-white/10 dark:bg-black/20">
          <CardHeader className="pb-2">
            <div className="w-full space-y-3 text-center">
              <Skeleton className="mx-auto h-8 w-40 rounded-lg" />
              <Skeleton className="mx-auto h-4 w-72 rounded-lg" />
            </div>
          </CardHeader>
          <CardBody className="space-y-5 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="mx-auto h-4 w-44 rounded-md" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
