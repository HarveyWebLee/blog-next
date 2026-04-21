"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function ProfileFavoritesLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
          <CardBody className="p-5">
            <Skeleton className="h-24 w-full rounded-xl mb-3" />
            <Skeleton className="h-5 w-2/3 rounded-lg" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
