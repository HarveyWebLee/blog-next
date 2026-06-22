"use client";

import { useParams } from "next/navigation";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const dict = useClientDictionary(lang);
  const t = (dict as { errors?: Record<string, string> })?.errors;

  if (!t) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold">{t.title}</h2>
      <p className="text-default-500">{t.description}</p>
      <button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={() => reset()}>
        {t.retry}
      </button>
    </div>
  );
}
