"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";

export default function LangError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const dict = useClientDictionary(lang);
  const t = (dict as { errors?: Record<string, string> })?.errors;

  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  if (!t) {
    return null;
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold">{t.title}</h2>
      <p className="max-w-md text-default-500">{t.description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => reset()}
        >
          {t.retry}
        </button>
        <Link href={`/${lang}`} className="text-primary underline-offset-4 hover:underline">
          {t.backHome}
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-4 max-w-lg break-all font-mono text-xs text-danger">{error.message}</p>
      )}
    </div>
  );
}
