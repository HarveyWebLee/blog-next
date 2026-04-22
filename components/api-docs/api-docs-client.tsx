"use client";

import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { RotateCcw } from "lucide-react";

import { ApiDocsAccessDenied } from "@/components/api-docs/api-docs-access-denied";
import { ApiDocsAuthPanel } from "@/components/api-docs/api-docs-auth-panel";
import { ApiDocsTesterProvider, useApiDocsTester } from "@/components/api-docs/api-docs-tester-context";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useAuth } from "@/lib/contexts/auth-context";
import { message } from "@/lib/utils";
import { ApiGroup } from "@/lib/utils/api-scanner";
import { isInMemorySuperRootClientUser } from "@/lib/utils/authz";
import { ApiFilterTabs } from "./api-filter-tabs";
import { ApiGroupCard } from "./api-group-card";
import { ApiSearchBar } from "./api-search-bar";

interface ApiDocsData {
  groups: ApiGroup[];
  stats: {
    totalGroups: number;
    totalEndpoints: number;
    lastScan: string;
    methodStats?: Record<string, number>;
    versionStats?: {
      withVersion: number;
      withoutVersion: number;
      versions: Record<string, number>;
    };
  };
  usageStats?: {
    totalRequests: number;
    refreshRequests: number;
    openApiRequests: number;
    lastAccessAt: string;
  };
  message: string;
}

type UnversionedEndpointItem = {
  method: string;
  path: string;
  groupName: string;
  sourceFile?: string;
};

type VisibleEndpointItem = {
  groupName: string;
  method: string;
  path: string;
  sourceFile?: string;
  version?: string;
};

function ApiDocsMain({ lang }: { lang: string }) {
  const { syncBearerFromStorage, bearerToken } = useApiDocsTester();
  const [apiData, setApiData] = useState<ApiDocsData | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [selectedVersion, setSelectedVersion] = useState<string>("all");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unversionedEndpoints, setUnversionedEndpoints] = useState<UnversionedEndpointItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    syncBearerFromStorage();
  }, [syncBearerFromStorage]);

  const loadApiData = useCallback(
    async (forceRefresh: boolean = false, version: string = "all") => {
      try {
        setLoading(true);
        setLoadError(null);
        const fromCtx = bearerToken.trim();
        const fromStorage = typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? "").trim() : "";
        const token = fromCtx || fromStorage;
        if (!token) {
          setLoadError("未找到可用 Token：请在下方「登录鉴权测试」登录，或先全站登录超级管理员后再打开本页。");
          setApiData(null);
          return;
        }

        const qs = new URLSearchParams();
        if (forceRefresh) qs.set("refresh", "true");
        if (version !== "all") qs.set("version", version);
        const query = qs.toString();
        const response = await fetch(`/api/api-docs${query ? `?${query}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          setLoadError(result.message || `请求失败 (${response.status})`);
          setApiData(null);
          if (response.status === 401 || response.status === 403) {
            message.warning(result.message || "无权限获取文档数据");
          }
          return;
        }

        if (result.data) {
          const rawGroups = result.data as ApiGroup[];
          const transformedData: ApiDocsData = {
            groups: rawGroups,
            stats:
              result.stats ||
              ({
                totalGroups: rawGroups.length,
                totalEndpoints: rawGroups.reduce((sum: number, group: ApiGroup) => sum + group.endpoints.length, 0),
                lastScan: new Date().toLocaleString("zh-CN"),
              } as ApiDocsData["stats"]),
            usageStats: result.usageStats,
            message: result.message || "API文档获取成功",
          };
          setApiData(transformedData);
          const unversioned = rawGroups.flatMap((group) =>
            group.endpoints
              .filter((endpoint) => !endpoint.version || !endpoint.version.trim())
              .map((endpoint) => ({
                method: endpoint.method,
                path: endpoint.path,
                groupName: group.name,
                sourceFile: endpoint.sourceFile,
              }))
          );
          setUnversionedEndpoints(unversioned);
        }
      } catch (error) {
        console.error("获取API数据失败:", error);
        setLoadError(error instanceof Error ? error.message : "网络错误");
        setApiData(null);
        setUnversionedEndpoints([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bearerToken]
  );

  const filterApiGroups = useCallback(() => {
    if (!apiData) return;

    let filtered = [...apiData.groups];

    if (searchQuery) {
      filtered = filtered
        .map((group) => ({
          ...group,
          endpoints: group.endpoints.filter(
            (endpoint) =>
              endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.authHint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          ),
        }))
        .filter((group) => group.endpoints.length > 0);
    }

    if (selectedMethod !== "all") {
      filtered = filtered
        .map((group) => ({
          ...group,
          endpoints: group.endpoints.filter((endpoint) => endpoint.method === selectedMethod),
        }))
        .filter((group) => group.endpoints.length > 0);
    }

    setFilteredGroups(filtered);
  }, [apiData, searchQuery, selectedMethod]);

  useEffect(() => {
    void loadApiData(false, selectedVersion);
  }, [loadApiData, selectedVersion]);

  useEffect(() => {
    filterApiGroups();
  }, [filterApiGroups]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadApiData(true, selectedVersion);
  };

  const handleExportOpenApi = () => {
    if (typeof window === "undefined") return;
    const fromCtx = bearerToken.trim();
    const fromStorage = typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? "").trim() : "";
    const token = fromCtx || fromStorage;
    if (!token) {
      message.warning("请先登录并获取 Token");
      return;
    }
    const qs = new URLSearchParams({ format: "openapi", download: "true" });
    if (selectedVersion !== "all") {
      qs.set("version", selectedVersion);
    }
    void fetch(`/api/api-docs?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || `导出失败 (${res.status})`);
        }
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "openapi.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        message.success("OpenAPI 导出成功");
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : "导出失败");
      });
  };

  const handleCopyUnversionedEndpoints = async () => {
    if (unversionedEndpoints.length === 0) {
      message.warning("当前没有未标注版本的端点");
      return;
    }
    const payload = unversionedEndpoints.map((item) => `${item.method} ${item.path}`).join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      message.success(`已复制 ${unversionedEndpoints.length} 条未标注端点`);
    } catch {
      message.error("复制失败，请检查浏览器剪贴板权限");
    }
  };

  const handleCopyGroupUnversionedEndpoints = async (groupName: string) => {
    const groupItems = unversionedEndpoints.filter((item) => item.groupName === groupName);
    if (groupItems.length === 0) {
      message.warning("该分组没有未标注端点");
      return;
    }
    const payload = groupItems.map((item) => `${item.method} ${item.path}`).join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      message.success(`已复制 ${groupName} 分组 ${groupItems.length} 条端点`);
    } catch {
      message.error("复制失败，请检查浏览器剪贴板权限");
    }
  };

  const handleExportUnversionedCsv = () => {
    if (unversionedEndpoints.length === 0) {
      message.warning("当前没有未标注版本的端点");
      return;
    }
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = ["group", "method", "path", "sourceFile"];
    const rows = unversionedEndpoints.map((item) => [item.groupName, item.method, item.path, item.sourceFile || ""]);
    const csv = [header, ...rows].map((row) => row.map((col) => escapeCsv(String(col))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unversioned-api-endpoints.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${unversionedEndpoints.length} 条未标注端点 CSV`);
  };

  const handleExportGroupUnversionedCsv = (groupName: string) => {
    const groupItems = unversionedEndpoints.filter((item) => item.groupName === groupName);
    if (groupItems.length === 0) {
      message.warning("该分组没有未标注版本的端点");
      return;
    }
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = ["group", "method", "path", "sourceFile"];
    const rows = groupItems.map((item) => [item.groupName, item.method, item.path, item.sourceFile || ""]);
    const csv = [header, ...rows].map((row) => row.map((col) => escapeCsv(String(col))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeGroup = groupName.replace(/[^a-zA-Z0-9-_]/g, "_");
    a.download = `unversioned-api-endpoints-${safeGroup}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${groupName} 分组 ${groupItems.length} 条端点 CSV`);
  };

  const unversionedByGroup = unversionedEndpoints.reduce<Record<string, UnversionedEndpointItem[]>>((acc, item) => {
    if (!acc[item.groupName]) {
      acc[item.groupName] = [];
    }
    acc[item.groupName].push(item);
    return acc;
  }, {});
  const groupNames = Object.keys(unversionedByGroup).sort();

  const handleExportAllGroupsZip = async () => {
    if (groupNames.length === 0) {
      message.warning("当前没有可导出的分组");
      return;
    }
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const zip = new JSZip();
    for (const groupName of groupNames) {
      const groupItems = unversionedByGroup[groupName] || [];
      if (groupItems.length === 0) continue;
      const header = ["group", "method", "path", "sourceFile"];
      const rows = groupItems.map((item) => [item.groupName, item.method, item.path, item.sourceFile || ""]);
      const csv = [header, ...rows].map((row) => row.map((col) => escapeCsv(String(col))).join(",")).join("\n");
      const safeGroup = groupName.replace(/[^a-zA-Z0-9-_]/g, "_");
      zip.file(`unversioned-api-endpoints-${safeGroup}.csv`, csv);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unversioned-api-endpoints-groups.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${groupNames.length} 个分组 ZIP`);
  };

  const getVisibleEndpoints = (): VisibleEndpointItem[] =>
    filteredGroups.flatMap((group) =>
      group.endpoints.map((endpoint) => ({
        groupName: group.name,
        method: endpoint.method,
        path: endpoint.path,
        sourceFile: endpoint.sourceFile,
        version: endpoint.version,
      }))
    );

  const handleExportVisibleGroupsZip = async () => {
    const visibleEndpoints = getVisibleEndpoints();
    if (visibleEndpoints.length === 0) {
      message.warning("当前筛选条件下没有可导出的端点");
      return;
    }
    const byGroup = visibleEndpoints.reduce<Record<string, VisibleEndpointItem[]>>((acc, item) => {
      if (!acc[item.groupName]) {
        acc[item.groupName] = [];
      }
      acc[item.groupName].push(item);
      return acc;
    }, {});
    const names = Object.keys(byGroup).sort();
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const zip = new JSZip();
    for (const groupName of names) {
      const groupItems = byGroup[groupName] || [];
      if (groupItems.length === 0) continue;
      const header = ["group", "method", "path", "sourceFile", "version"];
      const rows = groupItems.map((item) => [
        item.groupName,
        item.method,
        item.path,
        item.sourceFile || "",
        item.version || "",
      ]);
      const csv = [header, ...rows].map((row) => row.map((col) => escapeCsv(String(col))).join(",")).join("\n");
      const safeGroup = groupName.replace(/[^a-zA-Z0-9-_]/g, "_");
      zip.file(`filtered-api-endpoints-${safeGroup}.csv`, csv);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered-api-endpoints-groups.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success(`已导出当前筛选结果：${visibleEndpoints.length} 个端点，${names.length} 个分组`);
  };

  const handleExportVisibleSingleCsv = () => {
    const visibleEndpoints = getVisibleEndpoints();
    if (visibleEndpoints.length === 0) {
      message.warning("当前筛选条件下没有可导出的端点");
      return;
    }
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = ["group", "method", "path", "sourceFile", "version"];
    const rows = visibleEndpoints.map((item) => [
      item.groupName,
      item.method,
      item.path,
      item.sourceFile || "",
      item.version || "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((col) => escapeCsv(String(col))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered-api-endpoints.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success(`已导出当前筛选结果 CSV：${visibleEndpoints.length} 个端点`);
  };

  if (loading) {
    return <PageLoading text="加载 API 元数据…" />;
  }

  if (!apiData) {
    return (
      <div className="space-y-6">
        <ApiDocsAuthPanel lang={lang} onAfterLoginTest={() => void loadApiData(false, selectedVersion)} />
        <div className="text-center py-8 rounded-lg border border-dashed border-default-300">
          <p className="text-muted-foreground">{loadError || "无法加载 API 文档"}</p>
          <Button onClick={() => void loadApiData(true)} className="mt-4">
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ApiDocsAuthPanel lang={lang} onAfterLoginTest={() => void loadApiData(false, selectedVersion)} />

      {/* 头部信息（页面级标题由 page.tsx 提供，此处仅统计与操作） */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-foreground">扫描结果</p>
          <p className="text-muted-foreground mt-1 text-sm">
            共 {apiData.stats.totalGroups} 组，{apiData.stats.totalEndpoints} 个端点
          </p>
          <p className="text-xs text-muted-foreground">最后扫描: {apiData.stats.lastScan}</p>
          {apiData.stats.versionStats ? (
            <p className="text-xs text-muted-foreground">
              版本标注：{apiData.stats.versionStats.withVersion} 个端点已标注，
              {apiData.stats.versionStats.withoutVersion}
              个端点未标注
            </p>
          ) : null}
          {apiData.usageStats ? (
            <p className="text-xs text-muted-foreground">
              文档调用：总 {apiData.usageStats.totalRequests} 次，刷新 {apiData.usageStats.refreshRequests} 次，OpenAPI
              导出 {apiData.usageStats.openApiRequests} 次
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <ActionMenu triggerLabel="导出菜单" align="right" width="sm">
            <Button size="sm" variant="ghost" className="w-full justify-start" onPress={handleExportOpenApi}>
              导出 OpenAPI
            </Button>
            <Button size="sm" variant="ghost" className="w-full justify-start" onPress={handleExportVisibleSingleCsv}>
              导出筛选 CSV
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onPress={() => void handleExportVisibleGroupsZip()}
            >
              导出筛选 ZIP
            </Button>
          </ActionMenu>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "刷新中…" : "强制重新扫描"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-4 dark:border-amber-700/60 dark:bg-amber-950/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">版本治理助手</p>
            <p className="text-xs text-amber-700/90 dark:text-amber-200/80">
              当前共有 {unversionedEndpoints.length} 个未标注版本的端点，可复制后批量补充 `@version`。
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedVersion("none")}>
              仅看未标注
            </Button>
            <ActionMenu triggerLabel="治理导出" align="right" width="md">
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                onPress={() => void handleCopyUnversionedEndpoints()}
              >
                复制未标注列表
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start" onPress={handleExportUnversionedCsv}>
                导出未标注 CSV
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                onPress={() => void handleExportAllGroupsZip()}
              >
                导出未标注分组 ZIP
              </Button>
            </ActionMenu>
          </div>
        </div>
        {groupNames.length > 0 ? (
          <div className="mt-3 space-y-2">
            {groupNames.map((groupName) => {
              const groupItems = unversionedByGroup[groupName];
              const expanded = expandedGroups[groupName] ?? false;
              return (
                <div
                  key={groupName}
                  className="rounded border border-amber-300/70 bg-white/50 p-2 dark:border-amber-700/60 dark:bg-black/10"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [groupName]: !expanded,
                        }))
                      }
                      className="text-left text-xs font-medium text-amber-800 dark:text-amber-300"
                    >
                      {expanded ? "▼" : "▶"} {groupName}（{groupItems.length}）
                    </button>
                    <div className="flex items-center gap-2 justify-self-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 min-w-0 px-2 text-xs"
                        onClick={() => void handleCopyGroupUnversionedEndpoints(groupName)}
                      >
                        复制本组
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 min-w-0 px-2 text-xs"
                        onClick={() => handleExportGroupUnversionedCsv(groupName)}
                      >
                        导出本组 CSV
                      </Button>
                    </div>
                  </div>
                  {expanded ? (
                    <div className="mt-2 max-h-48 space-y-1 overflow-auto rounded border border-amber-200/70 bg-amber-100/30 p-2 dark:border-amber-800/60 dark:bg-amber-950/20">
                      {groupItems.map((item) => (
                        <div
                          key={`${item.method}-${item.path}`}
                          className="font-mono text-[11px] text-amber-900 dark:text-amber-200"
                        >
                          {item.method} {item.path}
                          {item.sourceFile ? (
                            <span className="ml-2 rounded bg-amber-200/60 px-1 py-0.5 text-[10px] text-amber-900 dark:bg-amber-800/40 dark:text-amber-100">
                              {item.sourceFile}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <ApiSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">全部版本</option>
          <option value="none">未标注版本</option>
          {Object.keys(apiData.stats.versionStats?.versions || {})
            .sort()
            .map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
        </select>
        <ApiFilterTabs selectedMethod={selectedMethod} onMethodChange={setSelectedMethod} />
      </div>

      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || selectedMethod !== "all" ? "没有找到匹配的 API" : "暂无 API 数据"}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => <ApiGroupCard key={group.name} group={group} />)
        )}
      </div>
    </div>
  );
}

export function ApiDocsClient({ lang }: { lang: string }) {
  const { user, isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <PageLoading text="校验访问权限…" />;
  }

  if (!isInMemorySuperRootClientUser(user)) {
    return <ApiDocsAccessDenied lang={lang} />;
  }

  return (
    <ApiDocsTesterProvider>
      <ApiDocsMain lang={lang} />
    </ApiDocsTesterProvider>
  );
}
