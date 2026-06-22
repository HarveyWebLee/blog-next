"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Home } from "lucide-react";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";

export default function AuthNotFound() {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const dict = useClientDictionary(lang);
  const t = (dict as { auth?: { notFound?: Record<string, string> } })?.auth?.notFound;

  if (!t) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardBody className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <span className="text-2xl font-bold text-gray-600">404</span>
            </div>

            <h1 className="mb-4 text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="mb-6 text-gray-600">{t.description}</p>

            <div className="space-y-3">
              <Button as={Link} href={`/${lang}/auth/login`} color="primary" size="lg" className="w-full font-medium">
                {t.goLogin}
              </Button>

              <Button
                as={Link}
                href={`/${lang}`}
                variant="light"
                size="lg"
                className="w-full"
                startContent={<Home className="h-4 w-4" />}
              >
                {t.backHome}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
