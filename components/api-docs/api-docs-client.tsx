"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { ApiDocsAccessDenied } from "@/components/api-docs/api-docs-access-denied";
import { ApiDocsAuthPanel } from "@/components/api-docs/api-docs-auth-panel";
import { ApiDocsTesterProvider, useApiDocsTester } from "@/components/api-docs/api-docs-tester-context";
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
  };
  message: string;
}

function ApiDocsMain({ lang }: { lang: string }) {
  const { syncBearerFromStorage, bearerToken } = useApiDocsTester();
  const [apiData, setApiData] = useState<ApiDocsData | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    syncBearerFromStorage();
  }, [syncBearerFromStorage]);

  const loadApiData = useCallback(
    async (forceRefresh: boolean = false) => {
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

        const response = await fetch(`/api/api-docs${forceRefresh ? "?refresh=true" : ""}`, {
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
          const transformedData: ApiDocsData = {
            groups: result.data,
            stats:
              result.stats ||
              ({
                totalGroups: result.data.length,
                totalEndpoints: result.data.reduce((sum: number, group: ApiGroup) => sum + group.endpoints.length, 0),
                lastScan: new Date().toLocaleString("zh-CN"),
              } as ApiDocsData["stats"]),
            message: result.message || "API文档获取成功",
          };
          setApiData(transformedData);
        }
      } catch (error) {
        console.error("获取API数据失败:", error);
        setLoadError(error instanceof Error ? error.message : "网络错误");
        setApiData(null);
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
    void loadApiData();
  }, [loadApiData]);

  useEffect(() => {
    filterApiGroups();
  }, [filterApiGroups]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadApiData(true);
  };

  if (loading) {
    return <PageLoading text="加载 API 元数据…" />;
  }

  if (!apiData) {
    return (
      <div className="space-y-6">
        <ApiDocsAuthPanel lang={lang} onAfterLoginTest={() => void loadApiData(false)} />
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
      <ApiDocsAuthPanel lang={lang} onAfterLoginTest={() => void loadApiData(false)} />

      {/* 头部信息（页面级标题由 page.tsx 提供，此处仅统计与操作） */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-foreground">扫描结果</p>
          <p className="text-muted-foreground mt-1 text-sm">
            共 {apiData.stats.totalGroups} 组，{apiData.stats.totalEndpoints} 个端点
          </p>
          <p className="text-xs text-muted-foreground">最后扫描: {apiData.stats.lastScan}</p>
        </div>
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <ApiSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
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
