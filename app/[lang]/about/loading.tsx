"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";
import { Sparkles } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 2xl:px-12">
        <div className="mb-10 text-center">
          <Skeleton className="mx-auto mb-4 h-24 w-24 rounded-full" />
          <Skeleton className="mx-auto mb-3 h-10 w-72 rounded-xl" />
          <Skeleton className="mx-auto mb-6 h-5 w-full max-w-2xl rounded-lg" />
          <div className="flex justify-center gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-xl dark:bg-black/10">
              <CardBody className="p-6">
                <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
                <Skeleton className="mb-3 h-6 w-28 rounded-lg" />
                <Skeleton className="mb-2 h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="bg-white/10 backdrop-blur-xl dark:bg-black/10">
          <CardBody className="p-8">
            <div className="mb-6 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <Skeleton className="h-8 w-40 rounded-lg" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-5 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-4/5 rounded-lg" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
