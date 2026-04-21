"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";
import { Scale } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <Skeleton className="mx-auto mb-4 h-12 w-72 rounded-xl" />
          <Skeleton className="mx-auto mb-6 h-5 w-full max-w-2xl rounded-lg" />
          <div className="flex justify-center gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-xl dark:bg-black/10">
              <CardBody className="p-7">
                <div className="mb-4 flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-7 w-48 rounded-lg" />
                </div>
                <Skeleton className="mb-2 h-4 w-full rounded-lg" />
                <Skeleton className="mb-2 h-4 w-11/12 rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
