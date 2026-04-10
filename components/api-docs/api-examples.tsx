"use client";

import { useState } from "react";
import { ArrowRight, Check, Clipboard, Code, Copy, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiExample } from "@/lib/utils/api-scanner";

interface ApiExamplesProps {
  examples: ApiExample[];
}

export function ApiExamples({ examples }: ApiExamplesProps) {
  const [activeExample, setActiveExample] = useState(0);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  if (examples.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Code className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">暂无示例</p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems((prev) => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const generateCurlCommand = (example: ApiExample) => {
    const method = example.name.includes("GET")
      ? "GET"
      : example.name.includes("POST")
        ? "POST"
        : example.name.includes("PUT")
          ? "PUT"
          : example.name.includes("DELETE")
            ? "DELETE"
            : "GET";

    let curl = `curl -X ${method} "${window.location.origin}${example.name.replace("基本示例", "").trim()}"`;

    if (example.request?.headers) {
      Object.entries(example.request.headers).forEach(([key, value]) => {
        curl += ` \\\n  -H "${key}: ${value}"`;
      });
    }

    if (example.request?.body) {
      curl += ` \\\n  -d '${JSON.stringify(example.request.body, null, 2)}'`;
    }

    return curl;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    if (status >= 500) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-lg text-foreground">使用示例</h4>
      </div>

      {/* 示例选择器 */}
      {examples.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {examples.map((example, index) => (
            <Button
              key={index}
              variant={activeExample === index ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveExample(index)}
              className="transition-all duration-200"
            >
              {example.name}
            </Button>
          ))}
        </div>
      )}

      {/* 当前示例内容 */}
      {examples[activeExample] && (
        <div className="space-y-6">
          {examples[activeExample].description && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{examples[activeExample].description}</p>
              </CardContent>
            </Card>
          )}

          {/* 请求示例 */}
          {examples[activeExample].request && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-base">请求示例</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generateCurlCommand(examples[activeExample]), "curl")}
                    className="h-8 w-8 p-0"
                  >
                    {copiedItems.has("curl") ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* cURL 命令 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      cURL
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateCurlCommand(examples[activeExample]), "curl")}
                      className="h-6 px-2 text-xs"
                    >
                      {copiedItems.has("curl") ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          复制
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                    {generateCurlCommand(examples[activeExample])}
                  </pre>
                </div>

                {/* Headers */}
                {examples[activeExample].request?.headers && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">请求头</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(examples[activeExample].request?.headers, null, 2), "headers")
                        }
                        className="h-6 px-2 text-xs"
                      >
                        {copiedItems.has("headers") ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            复制
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                      {JSON.stringify(examples[activeExample].request?.headers, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Body */}
                {examples[activeExample].request?.body && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">请求体</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(examples[activeExample].request?.body, null, 2), "body")
                        }
                        className="h-6 px-2 text-xs"
                      >
                        {copiedItems.has("body") ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            复制
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                      {JSON.stringify(examples[activeExample].request?.body, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 响应示例 */}
          {examples[activeExample].response && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-base">响应示例</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(examples[activeExample].response?.status || 200)}`}>
                      {examples[activeExample].response?.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(examples[activeExample].response?.body, null, 2), "response")
                      }
                      className="h-8 w-8 p-0"
                    >
                      {copiedItems.has("response") ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                  {JSON.stringify(examples[activeExample].response?.body, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
