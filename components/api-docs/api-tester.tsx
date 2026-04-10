"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { AlertCircle, Check, CheckCircle, Clock, Code, Copy, Play, Send } from "lucide-react";

import { ApiEndpoint } from "@/lib/utils/api-scanner";

interface ApiTesterProps {
  endpoint: ApiEndpoint;
}

interface TestResult {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  duration: number;
  error?: string;
}

export function ApiTester({ endpoint }: ApiTesterProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // 请求参数状态
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<Record<string, string>>({
    "Content-Type": "application/json",
  });
  const [requestBody, setRequestBody] = useState<string>("");

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

  const buildUrl = () => {
    // 构建完整的API URL
    let url = `${window.location.origin}${endpoint.path}`;

    // 替换路径参数
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });

    // 添加查询参数
    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value.trim() !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  };

  const testApi = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const startTime = Date.now();
      const url = buildUrl();

      console.log("测试URL:", url); // 调试日志

      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          ...headers,
        },
      };

      if (endpoint.method !== "GET" && requestBody.trim()) {
        try {
          requestOptions.body = JSON.stringify(JSON.parse(requestBody));
        } catch (e) {
          setResult({
            status: 0,
            statusText: "Invalid JSON",
            data: null,
            headers: {},
            duration: 0,
            error: "请求体JSON格式错误",
          });
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(url, requestOptions);
      const duration = Date.now() - startTime;

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResult({
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
        duration,
      });
    } catch (error) {
      setResult({
        status: 0,
        statusText: "Network Error",
        data: null,
        headers: {},
        duration: 0,
        error: error instanceof Error ? error.message : "网络请求失败",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "success";
    if (status >= 400 && status < 500) return "warning";
    if (status >= 500) return "danger";
    return "default";
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4" />;
    if (status >= 400) return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <>
      <Button onPress={onOpen} color="primary" variant="flat" startContent={<Play className="h-4 w-4" />} size="sm">
        测试接口
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "py-6",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  <span>API 接口测试</span>
                </div>
                <div className="flex items-center gap-2">
                  <Chip color="primary" variant="flat" size="sm">
                    {endpoint.method}
                  </Chip>
                  <span className="text-sm text-default-500">{endpoint.path}</span>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-6">
                  {/* 请求配置 */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        <span className="font-semibold">请求配置</span>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      {/* 完整URL显示 */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">请求URL</h4>
                        <div className="p-3 bg-default-50 border border-default-200 rounded-lg">
                          <code className="text-sm font-mono text-primary">{buildUrl()}</code>
                        </div>
                      </div>

                      {/* 路径参数 */}
                      {(endpoint.parameters?.filter((p) => p.location === "path") || []).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">路径参数</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(endpoint.parameters || [])
                              .filter((p) => p.location === "path")
                              .map((param) => (
                                <Input
                                  key={param.name}
                                  label={param.name}
                                  placeholder={`输入 ${param.name}`}
                                  value={pathParams[param.name] || ""}
                                  onChange={(e) =>
                                    setPathParams((prev) => ({
                                      ...prev,
                                      [param.name]: e.target.value,
                                    }))
                                  }
                                  description={param.description}
                                  isRequired={param.required}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* 查询参数 */}
                      {(endpoint.parameters?.filter((p) => p.location === "query") || []).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">查询参数</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(endpoint.parameters || [])
                              .filter((p) => p.location === "query")
                              .map((param) => (
                                <Input
                                  key={param.name}
                                  label={param.name}
                                  placeholder={`输入 ${param.name}`}
                                  value={queryParams[param.name] || ""}
                                  onChange={(e) =>
                                    setQueryParams((prev) => ({
                                      ...prev,
                                      [param.name]: e.target.value,
                                    }))
                                  }
                                  description={param.description}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* 请求头 */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">请求头</h4>
                        <div className="space-y-2">
                          {Object.entries(headers).map(([key, value], index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder="Header 名称"
                                value={key}
                                onChange={(e) => {
                                  const newHeaders = { ...headers };
                                  delete newHeaders[key];
                                  newHeaders[e.target.value] = value;
                                  setHeaders(newHeaders);
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Header 值"
                                value={value}
                                onChange={(e) =>
                                  setHeaders((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                className="flex-1"
                              />
                              <Button
                                color="danger"
                                variant="light"
                                size="sm"
                                onPress={() => {
                                  const newHeaders = { ...headers };
                                  delete newHeaders[key];
                                  setHeaders(newHeaders);
                                }}
                              >
                                删除
                              </Button>
                            </div>
                          ))}
                          <Button
                            color="primary"
                            variant="light"
                            size="sm"
                            onPress={() =>
                              setHeaders((prev) => ({
                                ...prev,
                                "": "",
                              }))
                            }
                          >
                            添加请求头
                          </Button>
                        </div>
                      </div>

                      {/* 请求体 */}
                      {endpoint.method !== "GET" && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">请求体</h4>
                          <textarea
                            className="w-full p-3 border border-default-200 rounded-lg bg-default-50 text-sm font-mono"
                            rows={8}
                            placeholder="输入 JSON 格式的请求体..."
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                          />
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* 测试按钮 */}
                  <div className="flex justify-center">
                    <Button
                      color="primary"
                      size="lg"
                      onPress={testApi}
                      isLoading={isLoading}
                      startContent={!isLoading && <Play className="h-4 w-4" />}
                    >
                      {isLoading ? "测试中..." : "发送请求"}
                    </Button>
                  </div>

                  {/* 测试结果 */}
                  {result && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-semibold">测试结果</span>
                          <Chip color={getStatusColor(result.status)} variant="flat" size="sm">
                            {result.status} {result.statusText}
                          </Chip>
                          <Chip color="default" variant="flat" size="sm">
                            {result.duration}ms
                          </Chip>
                        </div>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        {result.error && (
                          <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                            <div className="flex items-center gap-2 text-danger-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">错误信息</span>
                            </div>
                            <p className="text-sm text-danger-600 mt-1">{result.error}</p>
                          </div>
                        )}

                        {/* 响应头 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">响应头</h4>
                            <Button
                              size="sm"
                              variant="light"
                              onPress={() =>
                                copyToClipboard(JSON.stringify(result.headers, null, 2), "response-headers")
                              }
                              startContent={
                                copiedItems.has("response-headers") ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )
                              }
                            >
                              {copiedItems.has("response-headers") ? "已复制" : "复制"}
                            </Button>
                          </div>
                          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                            {JSON.stringify(result.headers, null, 2)}
                          </pre>
                        </div>

                        {/* 响应体 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">响应体</h4>
                            <Button
                              size="sm"
                              variant="light"
                              onPress={() =>
                                copyToClipboard(
                                  typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2),
                                  "response-body"
                                )
                              }
                              startContent={
                                copiedItems.has("response-body") ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )
                              }
                            >
                              {copiedItems.has("response-body") ? "已复制" : "复制"}
                            </Button>
                          </div>
                          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                            {typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  关闭
                </Button>
                <Button color="primary" onPress={onClose}>
                  完成
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
