"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function CategoriesManageLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Card>
        <CardBody className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardBody className="p-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
