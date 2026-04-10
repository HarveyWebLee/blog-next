"use client";

import { Badge } from "@/components/ui/badge";
import { ApiResponse } from "@/lib/utils/api-scanner";

interface ApiResponsesProps {
  responses: ApiResponse[];
}

export function ApiResponses({ responses }: ApiResponsesProps) {
  if (responses.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">暂无响应信息</div>;
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (status >= 400 && status < 500) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    } else if (status >= 500) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm text-foreground">响应信息</h4>
      <div className="space-y-3">
        {responses.map((response, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(response.status)}>{response.status}</Badge>
              <span className="text-sm font-medium">{response.description}</span>
            </div>

            {response.schema && (
              <div className="mt-3">
                <span className="text-sm font-medium text-muted-foreground">数据结构:</span>
                <pre className="mt-2 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                  {JSON.stringify(response.schema, null, 2)}
                </pre>
              </div>
            )}

            {response.example && (
              <div className="mt-3">
                <span className="text-sm font-medium text-muted-foreground">示例响应:</span>
                <pre className="mt-2 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                  {JSON.stringify(response.example, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
