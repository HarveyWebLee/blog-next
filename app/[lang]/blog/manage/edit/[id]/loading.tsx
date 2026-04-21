"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function BlogEditLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <Card>
        <CardBody className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardBody className="p-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </CardBody>
      </Card>
    </div>
  );
}
