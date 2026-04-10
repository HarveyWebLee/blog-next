"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiGroup } from "@/lib/utils/api-scanner";
import { ApiEndpointCard } from "./api-endpoint-card";

interface ApiGroupCardProps {
  group: ApiGroup;
}

export function ApiGroupCard({ group }: ApiGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  return (
    <Card className="w-full">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-xl">{group.name}</CardTitle>
            <Badge variant="secondary">{group.endpoints.length} 个接口</Badge>
          </div>
          <div className="flex gap-2">
            {Array.from(new Set(group.endpoints.map((e) => e.method))).map((method) => (
              <Badge key={method} className={getMethodColor(method)}>
                {method}
              </Badge>
            ))}
          </div>
        </div>
        {group.description && <p className="text-muted-foreground text-sm mt-2">{group.description}</p>}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {group.endpoints.map((endpoint, index) => (
              <ApiEndpointCard key={index} endpoint={endpoint} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
