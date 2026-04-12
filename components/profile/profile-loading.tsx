"use client";

import { Card, CardBody } from "@heroui/react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";

/** 与博客页骨架一致的加载占位 */
export default function ProfileLoading() {
  return (
    <Card className={PROFILE_GLASS_CARD}>
      <CardBody className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/4 rounded-lg bg-default-200" />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-default-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded-lg bg-default-200" />
              <div className="h-3 w-1/2 rounded-lg bg-default-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 rounded-lg bg-default-200" />
              <div className="h-3 rounded-lg bg-default-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 rounded-lg bg-default-200" />
              <div className="h-3 rounded-lg bg-default-200" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
