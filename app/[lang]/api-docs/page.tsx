import { Suspense } from "react";

import { ApiDocsClient } from "@/components/api-docs/api-docs-client";
import { PageLoading } from "@/components/ui/loading";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/types";

interface ApiDocsPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function ApiDocsPage({ params }: ApiDocsPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">{dict.apiDocs?.title || "API 接口文档"}</h1>
          <p className="text-lg text-muted-foreground">
            {dict.apiDocs?.description || "完整的API接口文档，包含所有可用的接口、参数说明和使用示例"}
          </p>
        </div>

        <Suspense fallback={<PageLoading text="加载API文档中..." />}>
          <ApiDocsClient />
        </Suspense>
      </div>
    </div>
  );
}
