"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";
import { Database } from "lucide-react";

export default function ApiDocsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="mb-4 h-10 w-72 rounded-xl" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
        </div>

        <Card className="mb-6 bg-white/10 backdrop-blur-xl dark:bg-black/10">
          <CardBody className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <Skeleton className="h-6 w-48 rounded-lg" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 rounded-lg" />
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-xl dark:bg-black/10">
              <CardBody className="p-5">
                <Skeleton className="mb-3 h-6 w-40 rounded-lg" />
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
