"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-3 h-10 w-64 rounded-xl" />
          <Skeleton className="mx-auto h-5 w-full max-w-2xl rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-xl dark:bg-black/10">
              <CardBody className="p-5">
                <Skeleton className="mb-4 h-40 w-full rounded-xl" />
                <Skeleton className="mb-2 h-6 w-3/4 rounded-lg" />
                <Skeleton className="mb-2 h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
