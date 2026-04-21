"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function ProfileCategoriesLoading() {
  return (
    <Card className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
      <CardBody className="p-6 space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </CardBody>
    </Card>
  );
}
