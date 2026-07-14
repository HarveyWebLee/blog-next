"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Search, Shield, UserRound } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { useProfileDict } from "@/lib/contexts/profile-dict-context";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import { message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import type { Locale } from "@/types";
import type {
  AdminManagedUserRow,
  AdminUserDetail,
  ApiResponse,
  PaginatedResponseData,
  UserRole,
  UserStatus,
} from "@/types/blog";

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

function formatDt(lang: string, d: Date | string | null | undefined): string {
  if (d == null) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(lang === "en-US" ? "en-US" : lang === "ja-JP" ? "ja-JP" : "zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type AccountsAdminText = Record<string, string> & {
  roles: Record<UserRole, string>;
  statuses: Record<UserStatus, string>;
};

export default function ProfileAccountsAdmin({ lang }: { lang: string }) {
  const loc = resolveLocale(lang);
  const t = pickText(useProfileDict("accountsAdmin") as AccountsAdminText | null) as AccountsAdminText;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AdminManagedUserRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [saving, setSaving] = useState(false);

  const prefix = `/${lang}`;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== "super_admin") {
      router.replace(`${prefix}/profile`);
    }
  }, [authLoading, isAuthenticated, user?.role, router, prefix]);

  /** 显式 `Record<string, string>`，避免 `Authorization?: undefined` 不满足 `HeadersInit` */
  const buildAuthHeaders = useCallback((): Record<string, string> => clientBearerHeaders(), []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (q.trim()) qs.set("q", q.trim());
      const res = await fetch(`/api/admin/users?${qs.toString()}`, { headers: buildAuthHeaders() });
      const json = (await res.json()) as ApiResponse<PaginatedResponseData<AdminManagedUserRow>>;
      if (!json.success || !json.data) {
        message.error(json.message || t.loadFailed);
        return;
      }
      setList(json.data.data);
      setTotal(json.data.pagination.total);
      setTotalPages(json.data.pagination.totalPages);
    } catch {
      message.error(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [page, q, buildAuthHeaders, t.loadFailed]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== "super_admin") return;
    void loadList();
  }, [authLoading, isAuthenticated, user?.role, loadList]);

  const openDetail = async (row: AdminManagedUserRow) => {
    setModalOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { headers: buildAuthHeaders() });
      const json = (await res.json()) as ApiResponse<AdminUserDetail>;
      if (!json.success || !json.data) {
        message.error(json.message || t.loadFailed);
        setModalOpen(false);
        return;
      }
      setDetail(json.data);
      const r = json.data.role;
      // 与详情一致保留 super_admin，避免误映射成 admin 后在保存时错误 PATCH 根账户
      setEditRole(r === "super_admin" || r === "admin" || r === "author" || r === "user" ? r : "user");
      setEditStatus(json.data.status);
    } catch {
      message.error(t.loadFailed);
      setModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetail = async () => {
    if (!detail) return;
    // 根账户在详情中展示为超级管理员，不在此页修改角色/状态（与后端 PATCH 限制一致）
    if (detail.role === "super_admin") return;
    setSaving(true);
    try {
      const body: { role?: UserRole; status?: UserStatus } = {};
      if (editRole !== detail.role) body.role = editRole;
      if (editStatus !== detail.status) body.status = editStatus;
      if (Object.keys(body).length === 0) {
        setModalOpen(false);
        return;
      }
      const res = await fetch(`/api/admin/users/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResponse<AdminUserDetail>;
      if (!json.success || !json.data) {
        message.error(json.message || t.updateFailed);
        return;
      }
      message.success(t.updateOk);
      setDetail(json.data);
      setModalOpen(false);
      void loadList();
    } catch {
      message.error(t.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "super_admin") {
    return (
      <Card className="border border-warning/30 bg-warning/5">
        <CardBody className="gap-3">
          <div className="flex items-center gap-2 text-warning">
            <Shield className="h-5 w-5" />
            <span>{t.needSuper}</span>
          </div>
          <Button as={Link} href={`${prefix}/profile`} color="warning" variant="flat">
            {t.back}
          </Button>
        </CardBody>
      </Card>
    );
  }

  const roleKeys: UserRole[] = ["admin", "author", "user"];
  const statusKeys: UserStatus[] = ["active", "inactive", "banned"];

  if (!isTextReady(t)) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t.title}</h2>
        <p className="mt-1 text-small text-default-500">{t.subtitle}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium">{t.list}</p>
            <p className="text-small text-default-500">
              {t.total}
              {total}
              {t.usersUnit}
            </p>
          </div>
          <div className="flex w-full max-w-md gap-2">
            <Input
              size="sm"
              placeholder={t.searchPh}
              value={qInput}
              onValueChange={setQInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setQ(qInput);
                }
              }}
              startContent={<Search className="h-4 w-4 text-default-400" />}
            />
            <Button
              color="primary"
              size="sm"
              onPress={() => {
                setPage(1);
                setQ(qInput);
              }}
            >
              {t.search}
            </Button>
          </div>
        </CardHeader>
        <CardBody className="gap-4 pt-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-default-500">{t.noData}</p>
          ) : (
            <>
              <Table aria-label={t.list} removeWrapper>
                <TableHeader>
                  <TableColumn>{t.colUser}</TableColumn>
                  <TableColumn>{t.colEmail}</TableColumn>
                  <TableColumn>{t.colName}</TableColumn>
                  <TableColumn>{t.colRole}</TableColumn>
                  <TableColumn>{t.colStatus}</TableColumn>
                  <TableColumn>{t.colLastIn}</TableColumn>
                  <TableColumn>{t.colCreated}</TableColumn>
                  <TableColumn>{t.colActions}</TableColumn>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.username}</TableCell>
                      <TableCell>
                        <span className="max-w-[200px] truncate">{row.email}</span>
                      </TableCell>
                      <TableCell>{row.displayName || "—"}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {t.roles[row.role] ?? row.role}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={row.status === "active" ? "success" : row.status === "inactive" ? "warning" : "danger"}
                          variant="flat"
                        >
                          {t.statuses[row.status]}
                        </Chip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-small">
                        {row.lastLoginAt ? formatDt(lang, row.lastLoginAt) : t.neverLogin}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-small">{formatDt(lang, row.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            as={Link}
                            href={`${prefix}/users/${row.id}`}
                            size="sm"
                            variant="solid"
                            color="secondary"
                            startContent={<UserRound className="h-4 w-4" />}
                            className="min-w-[120px]"
                          >
                            {t.viewProfile}
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="min-w-[120px]"
                            onPress={() => void openDetail(row)}
                          >
                            {t.viewEdit}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 ? (
                <div className="flex justify-center">
                  <Pagination showControls page={page} total={totalPages} onChange={setPage} size="sm" />
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{t.detailTitle}</ModalHeader>
          <ModalBody>
            {detailLoading || !detail ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-4 text-small">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>
                    <span className="text-default-500">ID</span>：{detail.id}
                  </p>
                  <p>
                    <span className="text-default-500">{t.colUser}</span>：{detail.username}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-default-500">{t.colEmail}</span>：{detail.email}
                  </p>
                  <p>
                    <span className="text-default-500">{t.colName}</span>：{detail.displayName || "—"}
                  </p>
                  <div>
                    {detail.emailVerified ? (
                      <Chip size="sm" color="success" variant="flat">
                        {t.emailVerified}
                      </Chip>
                    ) : (
                      <Chip size="sm" variant="flat">
                        {t.emailUnverified}
                      </Chip>
                    )}
                  </div>
                  {/* 根账户：只读展示角色与状态，不提供下拉修改 */}
                  {detail.role === "super_admin" ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-default-500">{t.colRole}</span>
                        <Chip size="sm" variant="flat">
                          {t.roles[detail.role] ?? detail.role}
                        </Chip>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-default-500">{t.colStatus}</span>
                        <Chip
                          size="sm"
                          color={
                            detail.status === "active" ? "success" : detail.status === "inactive" ? "warning" : "danger"
                          }
                          variant="flat"
                        >
                          {t.statuses[detail.status]}
                        </Chip>
                      </div>
                    </>
                  ) : null}
                  {detail.bio ? (
                    <p className="sm:col-span-2">
                      <span className="text-default-500">{t.fieldBio}</span>：{detail.bio}
                    </p>
                  ) : null}
                </div>

                <div className="border-t border-default-200 pt-4 dark:border-default-100">
                  <p className="mb-2 font-medium">{t.profileSection}</p>
                  {detail.profile ? (
                    <div className="grid gap-1 sm:grid-cols-2">
                      {detail.profile.phone ? (
                        <p>
                          {t.fieldPhone}：{detail.profile.phone}
                        </p>
                      ) : null}
                      {detail.profile.location ? (
                        <p>
                          {t.fieldLocation}：{detail.profile.location}
                        </p>
                      ) : null}
                      {detail.profile.website ? (
                        <p className="sm:col-span-2">
                          {t.fieldWebsite}：{detail.profile.website}
                        </p>
                      ) : null}
                      {!detail.profile.phone && !detail.profile.location && !detail.profile.website ? (
                        <p className="text-default-500">—</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-default-500">—</p>
                  )}
                </div>

                {detail.role !== "super_admin" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label={t.colRole}
                      aria-label={t.colRole || "role"}
                      labelPlacement="outside"
                      selectedKeys={[editRole]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "admin" || v === "author" || v === "user") setEditRole(v);
                      }}
                    >
                      {roleKeys.map((r) => (
                        <SelectItem key={r}>{t.roles[r]}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      label={t.colStatus}
                      aria-label={t.colStatus || "status"}
                      labelPlacement="outside"
                      selectedKeys={[editStatus]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "active" || v === "inactive" || v === "banned") setEditStatus(v);
                      }}
                    >
                      {statusKeys.map((s) => (
                        <SelectItem key={s}>{t.statuses[s]}</SelectItem>
                      ))}
                    </Select>
                  </div>
                ) : null}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setModalOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              color="primary"
              isLoading={saving}
              isDisabled={!detail || detailLoading || detail.role === "super_admin"}
              onPress={() => void saveDetail()}
            >
              {t.save}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
