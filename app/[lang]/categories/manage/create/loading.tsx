"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function CategoriesCreateLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-52 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardBody className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 rounded-lg" />
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
