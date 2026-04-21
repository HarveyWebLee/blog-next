"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function ProfileNotificationsLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
          <CardBody className="p-4">
            <Skeleton className="h-4 w-3/4 rounded-lg mb-2" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
