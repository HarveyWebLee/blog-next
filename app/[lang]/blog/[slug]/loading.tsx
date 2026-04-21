"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function BlogDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Card className="border-0 bg-white/10 backdrop-blur-xl dark:bg-black/10">
        <CardBody className="p-6">
          <Skeleton className="mb-4 h-10 w-2/3 rounded-lg" />
          <Skeleton className="mb-2 h-5 w-full rounded-lg" />
          <Skeleton className="mb-6 h-5 w-5/6 rounded-lg" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </CardBody>
      </Card>
      <Card className="border-0 bg-white/10 backdrop-blur-xl dark:bg-black/10">
        <CardBody className="p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded-lg" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
