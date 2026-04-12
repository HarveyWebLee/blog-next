"use client";

import { Suspense, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isSameOriginReferrerExceptSegment,
  parseSafeInternalReturn,
  type LegalSelfSegment,
} from "@/lib/utils/safe-return-path";

/** 法律页顶部返回按钮样式（隐私 / 条款共用） */
export const legalBackNavBtnClass =
  "group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 border-primary/50 hover:border-primary hover:bg-primary/5";

export type LegalBackNavLabels = {
  backToPrevious: string;
  backToHome: string;
};

function LegalBackNavInner({
  lang,
  labels,
  forbidSegment,
}: {
  lang: string;
  labels: LegalBackNavLabels;
  forbidSegment: LegalSelfSegment;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeReturn = parseSafeInternalReturn(searchParams.get("return"), forbidSegment);
  const [sameOriginBack, setSameOriginBack] = useState(false);

  useLayoutEffect(() => {
    if (safeReturn) {
      setSameOriginBack(false);
      return;
    }
    setSameOriginBack(isSameOriginReferrerExceptSegment(forbidSegment));
  }, [safeReturn, searchParams, forbidSegment]);

  if (safeReturn) {
    return (
      <div className="mb-8 flex justify-start">
        <Button variant="outline" size="sm" asChild className={legalBackNavBtnClass}>
          <Link href={safeReturn} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {labels.backToPrevious}
          </Link>
        </Button>
      </div>
    );
  }

  if (sameOriginBack) {
    return (
      <div className="mb-8 flex justify-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={legalBackNavBtnClass}
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {labels.backToPrevious}
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-8 flex justify-start">
      <Button variant="outline" size="sm" asChild className={legalBackNavBtnClass}>
        <Link href={`/${lang}`} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {labels.backToHome}
        </Link>
      </Button>
    </div>
  );
}

function LegalBackNavFallback({ lang, labels }: { lang: string; labels: LegalBackNavLabels }) {
  return (
    <div className="mb-8 flex justify-start">
      <Button variant="outline" size="sm" asChild className={legalBackNavBtnClass}>
        <Link href={`/${lang}`} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {labels.backToHome}
        </Link>
      </Button>
    </div>
  );
}

/**
 * 隐私 / 服务条款页顶部返回：`?return=` → `router.back()`（本站 referrer）→ 带语言首页。
 * 需包在路由段内；内部已用 Suspense 包裹 `useSearchParams`。
 */
export function LegalBackNav({
  lang,
  labels,
  forbidSegment,
}: {
  lang: string;
  labels: LegalBackNavLabels;
  forbidSegment: LegalSelfSegment;
}) {
  return (
    <Suspense fallback={<LegalBackNavFallback lang={lang} labels={labels} />}>
      <LegalBackNavInner lang={lang} labels={labels} forbidSegment={forbidSegment} />
    </Suspense>
  );
}
