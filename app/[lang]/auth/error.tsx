"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const dict = useClientDictionary(lang);
  const t = (dict as { auth?: { errorPage?: Record<string, string> } })?.auth?.errorPage;

  useEffect(() => {
    if (t) console.error("[auth error]", error);
  }, [error, t]);

  if (!t) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardBody className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="mb-4 text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="mb-6 text-gray-600">{t.description}</p>

            <div className="space-y-3">
              <Button
                onClick={reset}
                color="primary"
                size="lg"
                className="w-full font-medium"
                startContent={<RefreshCw className="h-4 w-4" />}
              >
                {t.retry}
              </Button>

              <Button
                as={Link}
                href={`/${lang}`}
                variant="light"
                size="lg"
                className="w-full"
                startContent={<ArrowLeft className="h-4 w-4" />}
              >
                {t.backHome}
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 rounded-lg bg-gray-100 p-4 text-left">
                <p className="mb-2 text-xs text-gray-600">{t.devInfo}</p>
                <p className="break-all font-mono text-xs text-red-600">{error.message}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
