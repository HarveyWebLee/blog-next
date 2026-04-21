"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function BlogManageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-52 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <Card>
        <CardBody className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </CardBody>
      </Card>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="p-4">
              <Skeleton className="h-6 w-1/3 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
