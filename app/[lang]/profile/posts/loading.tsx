"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function ProfilePostsLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
          <CardBody className="p-5">
            <Skeleton className="h-6 w-2/3 rounded-lg mb-2" />
            <Skeleton className="h-4 w-full rounded-lg mb-1" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
