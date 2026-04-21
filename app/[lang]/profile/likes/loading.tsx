"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function ProfileLikesLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
          <CardBody className="p-5">
            <Skeleton className="h-20 w-full rounded-xl mb-3" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
