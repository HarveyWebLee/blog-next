"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function ProfileSettingsLoading() {
  return (
    <Card className="border-0 bg-white/[0.025] backdrop-blur-md dark:bg-black/[0.025]">
      <CardBody className="p-6 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-xl" />
        ))}
      </CardBody>
    </Card>
  );
}
