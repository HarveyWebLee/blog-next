"use client";

import { Badge } from "@/components/ui/badge";
import type { ApiRequestBody } from "@/lib/utils/api-scanner";

interface ApiRequestBodyProps {
  requestBody?: ApiRequestBody;
}

export function ApiRequestBody({ requestBody }: ApiRequestBodyProps) {
  if (!requestBody) {
    return <div className="text-center py-8 text-muted-foreground">此接口无需请求体</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm text-foreground">请求体信息</h4>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">类型:</span>
          <Badge variant="outline">{requestBody.type}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">必需:</span>
          <Badge variant={requestBody.required ? "destructive" : "secondary"}>
            {requestBody.required ? "是" : "否"}
          </Badge>
        </div>

        {requestBody.description && (
          <div>
            <span className="text-sm font-medium">描述:</span>
            <p className="text-sm text-muted-foreground mt-1">{requestBody.description}</p>
          </div>
        )}

        {requestBody.schema && (
          <div>
            <span className="text-sm font-medium">数据结构:</span>
            <pre className="mt-2 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
              {JSON.stringify(requestBody.schema, null, 2)}
            </pre>
          </div>
        )}

        {requestBody.example && (
          <div>
            <span className="text-sm font-medium">示例数据:</span>
            <pre className="mt-2 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
              {JSON.stringify(requestBody.example, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
