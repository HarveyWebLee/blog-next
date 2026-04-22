"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DateRangePicker,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { Search, ShieldCheck, Trash2 } from "lucide-react";

import { BlogNavigation } from "@/components/blog/blog-navigation";
import enUS from "@/dictionaries/en-US.json";
import jaJP from "@/dictionaries/ja-JP.json";
import zhCN from "@/dictionaries/zh-CN.json";
import { useAuth } from "@/lib/contexts/auth-context";
import { message } from "@/lib/utils";
import type { AdminManagedUserRow, ApiResponse, PaginatedResponseData } from "@/types/blog";

type ReviewStatus = "pending" | "approved" | "spam";
type AdminCommentItem = {
  id: number;
  postId: number;
  postTitle: string | null;
  authorId: number | null;
  authorName: string | null;
  content: string;
  status: ReviewStatus;
  createdAt: string | Date;
};

const statusColorMap: Record<ReviewStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  spam: "danger",
};

export default function BlogCommentsReviewPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const dict = lang === "en-US" ? enUS : lang === "ja-JP" ? jaJP : zhCN;
  const t = dict.profile.commentReview;
  const unknownLabel = t.unknown;

  const [items, setItems] = useState<AdminCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | ReviewStatus>("pending");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [authorIdInput, setAuthorIdInput] = useState("");
  const [dateRangeInput, setDateRangeInput] = useState<any>(null);
  const [authorId, setAuthorId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [authorFilterOptions, setAuthorFilterOptions] = useState<Array<{ key: string; label: string }>>([]);
  const authorSelectItems = [{ key: "all", label: "全部作者" }, ...authorFilterOptions];

  const normalizeDateValue = (v: unknown): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object" && v !== null) {
      const maybeToString = (v as { toString?: () => string }).toString;
      if (typeof maybeToString === "function") {
        return maybeToString.call(v);
      }
    }
    return "";
  };

  const buildAuthHeaders = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("accessToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "12" });
      if (status !== "all") qs.set("status", status);
      if (q.trim()) qs.set("q", q.trim());
      if (authorId.trim()) qs.set("authorId", authorId.trim());
      if (dateFrom.trim()) qs.set("dateFrom", dateFrom.trim());
      if (dateTo.trim()) qs.set("dateTo", dateTo.trim());

      const res = await fetch(`/api/admin/comments?${qs.toString()}`, { headers: buildAuthHeaders() });
      const json = (await res.json()) as ApiResponse<PaginatedResponseData<AdminCommentItem>>;
      if (!json.success || !json.data) {
        throw new Error(json.message || "加载失败");
      }
      setItems(json.data.data);
      setAuthorFilterOptions((prev) => {
        const map = new Map<string, string>();
        for (const item of prev) map.set(item.key, item.label);
        for (const item of json.data!.data) {
          if (item.authorId != null) {
            map.set(String(item.authorId), item.authorName || `${unknownLabel} #${item.authorId}`);
          }
        }
        return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
      });
      setTotalPages(json.data.pagination.totalPages || 1);
      // 列表刷新后移除已不存在的勾选项，避免“幽灵选择”。
      const currentIds = new Set(json.data.data.map((row) => row.id));
      setSelectedIds((prev) => prev.filter((id) => currentIds.has(id)));
    } catch (error) {
      console.error("加载评论审核列表失败:", error);
      setItems([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, [authorId, buildAuthHeaders, dateFrom, dateTo, page, q, status, unknownLabel]);

  const loadPlatformUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?page=1&limit=50", { headers: buildAuthHeaders() });
      const json = (await res.json()) as ApiResponse<PaginatedResponseData<AdminManagedUserRow>>;
      if (!json.success || !json.data) return;
      setAuthorFilterOptions((prev) => {
        const map = new Map<string, string>();
        for (const item of prev) map.set(item.key, item.label);
        for (const user of json.data!.data) {
          map.set(String(user.id), user.displayName || user.username || `${unknownLabel} #${user.id}`);
        }
        return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
      });
    } catch (error) {
      console.error("加载平台用户列表失败:", error);
    }
  }, [buildAuthHeaders, unknownLabel]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || user?.role !== "super_admin") {
      router.replace(`/${lang}/blog/manage`);
      return;
    }
    void loadPlatformUsers();
    void loadComments();
  }, [isAuthLoading, isAuthenticated, user?.role, router, lang, loadComments, loadPlatformUsers]);

  const updateStatus = async (id: number, nextStatus: ReviewStatus) => {
    setUpdatingId(id);
    try {
      const reason = window.prompt(
        lang === "en-US" ? "Optional moderation reason:" : lang === "ja-JP" ? "審査理由（任意）:" : "审核理由（可选）:",
        ""
      );
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ status: nextStatus, reason: reason || undefined }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.success) {
        throw new Error(json.message || t.updateFailed);
      }
      message.success(t.updated);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: nextStatus } : it)));
    } catch (error) {
      console.error("更新评论状态失败:", error);
      message.error(error instanceof Error ? error.message : t.updateFailed);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllCurrentPage = () => {
    setSelectedIds(items.map((item) => item.id));
  };

  const invertSelectionCurrentPage = () => {
    const selectedSet = new Set(selectedIds);
    setSelectedIds(items.filter((item) => !selectedSet.has(item.id)).map((item) => item.id));
  };

  const deleteOne = async (id: number) => {
    const ok = window.confirm(
      lang === "en-US"
        ? "Delete this comment?"
        : lang === "ja-JP"
          ? "このコメントを削除しますか？"
          : "确定删除该评论吗？"
    );
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.success) {
        throw new Error(
          json.message || (lang === "en-US" ? "Delete failed" : lang === "ja-JP" ? "削除に失敗しました" : "删除失败")
        );
      }
      message.success(t.deleted);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setSelectedIds((prev) => prev.filter((it) => it !== id));
    } catch (error) {
      console.error("删除评论失败:", error);
      message.error(error instanceof Error ? error.message : t.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  const batchUpdateStatus = async (nextStatus: ReviewStatus) => {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    try {
      const reason = window.prompt(
        lang === "en-US"
          ? "Optional batch moderation reason:"
          : lang === "ja-JP"
            ? "一括審査理由（任意）:"
            : "批量审核理由（可选）:",
        ""
      );
      const res = await fetch("/api/admin/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ ids: selectedIds, status: nextStatus, reason: reason || undefined }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.success) {
        throw new Error(json.message || t.updateFailed);
      }
      message.success(t.updated);
      setItems((prev) => prev.map((it) => (selectedIds.includes(it.id) ? { ...it, status: nextStatus } : it)));
      setSelectedIds([]);
    } catch (error) {
      console.error("批量更新评论状态失败:", error);
      message.error(error instanceof Error ? error.message : t.updateFailed);
    } finally {
      setBatchLoading(false);
    }
  };

  const batchDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(
      lang === "en-US"
        ? `Delete ${selectedIds.length} selected comments?`
        : lang === "ja-JP"
          ? `選択した ${selectedIds.length} 件のコメントを削除しますか？`
          : `确定删除已选中的 ${selectedIds.length} 条评论吗？`
    );
    if (!ok) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.success) {
        throw new Error(json.message || t.deleteFailed);
      }
      message.success(t.deleted);
      const selectedSet = new Set(selectedIds);
      setItems((prev) => prev.filter((it) => !selectedSet.has(it.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("批量删除评论失败:", error);
      message.error(error instanceof Error ? error.message : t.deleteFailed);
    } finally {
      setBatchLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <>
        <BlogNavigation />
        <div className="flex justify-center py-24">
          <Spinner size="lg" color="primary" />
        </div>
      </>
    );
  }

  if (!isAuthenticated || user?.role !== "super_admin") {
    return (
      <>
        <BlogNavigation />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Card className="border border-warning/30 bg-warning/5">
            <CardBody className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-warning">
                <ShieldCheck className="h-5 w-5" />
                <span>{t.needSuper}</span>
              </div>
              <Button as={Link} href={`/${lang}/blog/manage`} color="warning" variant="flat">
                {t.backManage}
              </Button>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <BlogNavigation />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-default-500">{t.subtitle}</p>
          </div>
          <Button as={Link} href={`/${lang}/blog/manage`} variant="flat">
            {t.backManage}
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2 sm:max-w-5xl sm:grid-cols-3">
              <Input
                value={qInput}
                onValueChange={setQInput}
                placeholder={t.searchPh}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setQ(qInput);
                  }
                }}
                startContent={<Search className="h-4 w-4 text-default-400" />}
              />
              <Select
                selectedKeys={authorIdInput ? [authorIdInput] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string | undefined;
                  setAuthorIdInput(selected === "all" ? "" : (selected ?? ""));
                }}
                placeholder="选择用户"
                items={authorSelectItems}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
              <DateRangePicker
                className="sm:col-span-2 min-w-0 w-full [&_[data-slot='input-wrapper']]:min-w-0 [&_[data-slot='input-wrapper']]:max-w-full [&_[data-slot='input-wrapper']]:overflow-x-auto [&_[data-slot='input-wrapper']]:overflow-y-hidden [&_[data-slot='input-wrapper']]:whitespace-nowrap"
                value={dateRangeInput}
                onChange={(range) => setDateRangeInput(range)}
                label="日期范围"
                labelPlacement="outside"
                granularity="second"
                hourCycle={24}
                showMonthAndYearPickers
              />
              <Select
                selectedKeys={[status]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as "all" | ReviewStatus;
                  setPage(1);
                  setStatus(selected);
                }}
                className="w-40"
              >
                <SelectItem key="all">{t.statusAll}</SelectItem>
                <SelectItem key="pending">{t.statusPending}</SelectItem>
                <SelectItem key="approved">{t.statusApproved}</SelectItem>
                <SelectItem key="spam">{t.statusSpam}</SelectItem>
              </Select>
              <Button
                color="primary"
                onPress={() => {
                  setPage(1);
                  setQ(qInput);
                  setAuthorId(authorIdInput);
                  setDateFrom(normalizeDateValue(dateRangeInput?.start));
                  setDateTo(normalizeDateValue(dateRangeInput?.end));
                }}
              >
                {t.filter}
              </Button>
              <Button
                variant="flat"
                onPress={() => {
                  setDateRangeInput(null);
                  setPage(1);
                  setDateFrom("");
                  setDateTo("");
                }}
                isDisabled={!dateRangeInput}
              >
                清空日期
              </Button>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <Button
                size="sm"
                variant="flat"
                onPress={toggleSelectAllCurrentPage}
                isDisabled={loading || items.length === 0}
              >
                {t.selectAllCurrent}
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={invertSelectionCurrentPage}
                isDisabled={loading || items.length === 0}
              >
                {t.invertSelection}
              </Button>
              <Button
                size="sm"
                color="success"
                variant="flat"
                isDisabled={selectedIds.length === 0 || batchLoading}
                isLoading={batchLoading}
                onPress={() => void batchUpdateStatus("approved")}
              >
                {t.batchApprove}
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                isDisabled={selectedIds.length === 0 || batchLoading}
                isLoading={batchLoading}
                onPress={() => void batchUpdateStatus("spam")}
              >
                {t.batchMarkSpam}
              </Button>
              <Button
                size="sm"
                variant="flat"
                isDisabled={selectedIds.length === 0 || batchLoading}
                isLoading={batchLoading}
                onPress={() => void batchUpdateStatus("pending")}
              >
                {t.batchSetPending}
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="bordered"
                isDisabled={selectedIds.length === 0 || batchLoading}
                isLoading={batchLoading}
                onPress={() => void batchDelete()}
              >
                {t.batchDelete}
              </Button>
            </div>
          </CardHeader>
          <CardBody className="gap-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-default-500">{t.noData}</div>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="border border-default-200/60 shadow-none">
                  <CardBody className="gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                          className="h-4 w-4 cursor-pointer"
                        />
                        <Chip size="sm" color={statusColorMap[item.status]} variant="flat">
                          {item.status === "pending"
                            ? t.statusPending
                            : item.status === "approved"
                              ? t.statusApproved
                              : t.statusSpam}
                        </Chip>
                        <span className="truncate text-sm text-default-500">
                          {t.post}：{item.postTitle || `${t.unknown} #${item.postId}`}
                        </span>
                      </div>
                      <span className="text-xs text-default-400">
                        {t.author}：{item.authorName || `${t.unknown} #${item.authorId ?? "-"}`} · {t.at}：
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-default-700">{item.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.status !== "approved" ? (
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          isLoading={updatingId === item.id}
                          onPress={() => void updateStatus(item.id, "approved")}
                        >
                          {t.approve}
                        </Button>
                      ) : null}
                      {item.status !== "spam" ? (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          isLoading={updatingId === item.id}
                          onPress={() => void updateStatus(item.id, "spam")}
                        >
                          {t.markSpam}
                        </Button>
                      ) : null}
                      {item.status !== "pending" ? (
                        <Button
                          size="sm"
                          variant="flat"
                          isLoading={updatingId === item.id}
                          onPress={() => void updateStatus(item.id, "pending")}
                        >
                          {t.rollbackPending}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        color="danger"
                        variant="bordered"
                        isLoading={deletingId === item.id}
                        onPress={() => void deleteOne(item.id)}
                        startContent={deletingId === item.id ? null : <Trash2 className="h-4 w-4" />}
                      >
                        {t.delete}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
            {totalPages > 1 && (
              <div className="flex justify-center pt-2">
                <Pagination showControls page={page} total={totalPages} onChange={setPage} size="sm" />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
