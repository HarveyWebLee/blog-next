"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Clipboard, Code } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiEndpoint } from "@/lib/utils/api-scanner";
import { ApiExamples } from "./api-examples";
import { ApiParameters } from "./api-parameters";
import { ApiRequestBody } from "./api-request-body";
import { ApiResponses } from "./api-responses";
import { ApiTester } from "./api-tester";

interface ApiEndpointCardProps {
  endpoint: ApiEndpoint;
}

export function ApiEndpointCard({ endpoint }: ApiEndpointCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"parameters" | "request" | "responses" | "examples" | "test">(
    "parameters"
  );

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateCurlCommand = () => {
    let curl = `curl -X ${endpoint.method} "${window.location.origin}${endpoint.path}"`;

    if (endpoint.requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(endpoint.requestBody, null, 2)}'`;
    }

    return curl;
  };

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardContent className="p-4">
        {/* 端点头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{endpoint.path}</code>
            {endpoint.description && <span className="text-sm text-muted-foreground">{endpoint.description}</span>}
          </div>
          <div className="flex items-center gap-2">
            <ApiTester endpoint={endpoint} />
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* 展开内容 */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* 标签页导航 */}
            <div className="flex gap-1 border-b">
              {[
                { key: "parameters", label: "参数", count: endpoint.parameters?.length || 0 },
                { key: "request", label: "请求体", count: endpoint.requestBody ? 1 : 0 },
                { key: "responses", label: "响应", count: endpoint.responses?.length || 0 },
                { key: "examples", label: "示例", count: endpoint.examples?.length || 0 },
                { key: "test", label: "测试", count: 0 },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key as any)}
                  className="rounded-none border-b-2 border-transparent data-[selected=true]:border-primary"
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* 标签页内容 */}
            <div className="min-h-[200px]">
              {activeTab === "parameters" && <ApiParameters parameters={endpoint.parameters || []} />}
              {activeTab === "request" && <ApiRequestBody requestBody={endpoint.requestBody} />}
              {activeTab === "responses" && <ApiResponses responses={endpoint.responses || []} />}
              {activeTab === "examples" && <ApiExamples examples={endpoint.examples || []} />}
              {activeTab === "test" && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Code className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">接口测试</h3>
                    <p className="text-muted-foreground mb-4">点击上方的"测试接口"按钮开始测试此API接口</p>
                    <div className="bg-muted/30 rounded-lg p-4 text-left">
                      <h4 className="font-medium mb-2">测试功能包括：</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 动态路径参数输入</li>
                        <li>• 查询参数配置</li>
                        <li>• 请求头设置</li>
                        <li>• 请求体编辑</li>
                        <li>• 实时响应查看</li>
                        <li>• 响应数据复制</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* cURL 命令 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">cURL 命令</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generateCurlCommand())}
                  className="h-8 w-8 p-0"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                {generateCurlCommand()}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
