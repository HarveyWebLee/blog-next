"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { ApiEndpoint, ApiGroup } from "@/lib/utils/api-scanner";
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

export function ApiDocsClient() {
  const [apiData, setApiData] = useState<ApiDocsData | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");

  const loadApiData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/api-docs${forceRefresh ? "?refresh=true" : ""}`);
      const result = await response.json();

      if (result.success && result.data) {
        const transformedData: ApiDocsData = {
          groups: result.data,
          stats: result.stats || {
            totalGroups: result.data.length,
            totalEndpoints: result.data.reduce((sum: number, group: ApiGroup) => sum + group.endpoints.length, 0),
            lastScan: new Date().toLocaleString("zh-CN"),
          },
          message: result.message || "API文档获取成功",
        };
        setApiData(transformedData);
      } else {
        console.error("获取API数据失败:", result.message);
      }
    } catch (error) {
      console.error("获取API数据失败:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    loadApiData();
  }, [loadApiData]);

  useEffect(() => {
    filterApiGroups();
  }, [filterApiGroups]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadApiData(true);
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!apiData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">无法加载API文档</p>
        <Button onClick={() => loadApiData(true)} className="mt-4">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">API 文档</h1>
          <p className="text-muted-foreground mt-1">
            发现 {apiData.stats.totalGroups} 个API组，共 {apiData.stats.totalEndpoints} 个接口
          </p>
          <p className="text-sm text-muted-foreground">最后扫描时间: {apiData.stats.lastScan}</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RotateCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "刷新中..." : "刷新"}
        </Button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <ApiSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <ApiFilterTabs selectedMethod={selectedMethod} onMethodChange={setSelectedMethod} />
      </div>

      {/* API组列表 */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || selectedMethod !== "all" ? "没有找到匹配的API接口" : "暂无API接口"}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => <ApiGroupCard key={group.name} group={group} />)
        )}
      </div>
    </div>
  );
}
