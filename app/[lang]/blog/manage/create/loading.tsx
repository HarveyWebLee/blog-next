"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function BlogCreateLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64 rounded-lg" />
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
      <Card>
        <CardBody className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
