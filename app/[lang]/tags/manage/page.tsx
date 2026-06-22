/**
 * 标签管理主页面
 * 提供标签的增删改查功能
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from "@heroui/react";
import {
  BarChart3,
  Calendar,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Hash,
  MoreVertical,
  Palette,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { generateRandomUrlAlias, message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { Locale } from "@/types";
import { ApiResponse, PaginatedResponseData, Tag, TagQueryParams } from "@/types/blog";

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

/** 词典占位符替换 */
function fmt(template: string, params: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

type TagDict = Record<string, string>;

/** 将用户输入规范为 #RRGGBB；无法解析时返回 null */
const normalizeHexColor = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hex)) return null;
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${hex.toLowerCase()}`;
};

/**
 * 标签管理页面组件
 */
export default function TagsManagePage() {
  const params = useParams<{ lang: string }>();
  const locale = resolveLocale(params.lang);
  const dict = useClientDictionary(params.lang);
  const t = dict?.tag as TagDict | undefined;
  const c = dict?.common as Record<string, string> | undefined;

  // 状态管理
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  /** 顶部统计卡：固定展示全量统计，不受搜索/状态筛选影响 */
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  /** 搜索防抖定时器：避免输入每个字符都触发一次列表接口 */
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 模态框状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#667eea",
    isActive: true,
  });
  /** 与取色器同步的十六进制展示（允许输入过程中的中间态） */
  const [colorHexInput, setColorHexInput] = useState("#667eea");

  const fetchTags = useCallback(
    async (params: Partial<TagQueryParams> = {}) => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: params.page?.toString() || currentPage.toString(),
          limit: limit.toString(),
          sortBy: params.sortBy || "createdAt",
          sortOrder: params.sortOrder || "desc",
          ...(params.search && { search: params.search }),
          ...(params.isActive !== undefined && { isActive: params.isActive.toString() }),
        });

        const response = await fetch(`/api/tags?${queryParams}`, {
          headers: { ...clientBearerHeaders() },
        });
        const result: ApiResponse<PaginatedResponseData<Tag>> = await response.json();

        if (result.success && result.data) {
          setTags(result.data.data);
          setTotalPages(result.data.pagination.totalPages);
          setTotal(result.data.pagination.total);
        } else {
          console.error("获取标签列表失败:", result.message);
        }
      } catch (error) {
        console.error("获取标签列表失败:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, limit]
  );

  /**
   * 拉取标签全量统计（总数/激活/停用）：
   * - 与列表筛选参数解耦，避免顶部统计随筛选变化
   * - 仅请求分页 total，降低数据传输
   */
  const fetchSummary = useCallback(async () => {
    try {
      const baseParams = "page=1&limit=1&sortBy=createdAt&sortOrder=desc";
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        fetch(`/api/tags?${baseParams}`, { headers: { ...clientBearerHeaders() } }),
        fetch(`/api/tags?${baseParams}&isActive=true`, { headers: { ...clientBearerHeaders() } }),
        fetch(`/api/tags?${baseParams}&isActive=false`, { headers: { ...clientBearerHeaders() } }),
      ]);

      const [allJson, activeJson, inactiveJson] = (await Promise.all([
        allRes.json(),
        activeRes.json(),
        inactiveRes.json(),
      ])) as [
        ApiResponse<PaginatedResponseData<Tag>>,
        ApiResponse<PaginatedResponseData<Tag>>,
        ApiResponse<PaginatedResponseData<Tag>>,
      ];

      if (allJson.success && activeJson.success && inactiveJson.success) {
        setSummary({
          total: allJson.data?.pagination.total || 0,
          active: activeJson.data?.pagination.total || 0,
          inactive: inactiveJson.data?.pagination.total || 0,
        });
      }
    } catch (error) {
      console.error("获取标签汇总统计失败:", error);
    }
  }, []);

  // 搜索处理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);

    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      fetchTags({ search: query, page: 1 });
    }, 400);
  };

  // 状态筛选处理
  const handleStatusFilter = (status: boolean | undefined) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchTags({ isActive: status, page: 1, search: searchQuery });
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTags({ page, search: searchQuery, isActive: statusFilter });
  };

  // 删除标签
  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: "DELETE",
        headers: { ...clientBearerHeaders() },
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        setIsDeleteModalOpen(false);
        setSelectedTag(null);
        fetchTags();
        fetchSummary();
      } else {
        message.error(result.message || t!.deleteFailed);
      }
    } catch (error) {
      console.error("删除标签失败:", error);
      message.error(t!.deleteFailed);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 打开删除模态框
  const openDeleteModal = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDeleteModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTagId(null);
    setFormData({
      name: "",
      slug: generateRandomUrlAlias(8),
      description: "",
      color: "#667eea",
      isActive: true,
    });
    setColorHexInput("#667eea");
    setIsEditModalOpen(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTagId(tag.id);
    const nextColor = tag.color || "#667eea";
    setFormData({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || "",
      color: nextColor,
      isActive: tag.isActive ?? true,
    });
    setColorHexInput(nextColor);
    setIsEditModalOpen(true);
  };

  const handleSaveTag = async () => {
    if (!formData.name.trim()) {
      message.warning(t!.nameRequired);
      return;
    }

    try {
      setSaveLoading(true);
      const normalizedFromInput = normalizeHexColor(colorHexInput);
      const finalColor = normalizedFromInput ?? normalizeHexColor(formData.color);
      if (!finalColor) {
        message.warning(t!.invalidColor);
        setSaveLoading(false);
        return;
      }
      const isEdit = editingTagId != null;
      const endpoint = isEdit ? `/api/tags/${editingTagId}` : "/api/tags";
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...clientBearerHeaders(),
        },
        body: JSON.stringify({
          ...formData,
          color: finalColor,
          slug: formData.slug.trim() || generateRandomUrlAlias(8),
        }),
      });
      const result: ApiResponse<Tag> = await response.json();
      if (!result.success) {
        message.error(result.message || t!.saveFailed);
        return;
      }
      setIsEditModalOpen(false);
      fetchTags();
      fetchSummary();
    } catch (error) {
      console.error("保存标签失败:", error);
      message.error(t!.saveFailed);
    } finally {
      setSaveLoading(false);
    }
  };

  // 切换标签状态
  const toggleTagStatus = async (tag: Tag) => {
    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...clientBearerHeaders(),
        },
        body: JSON.stringify({ isActive: !tag.isActive }),
      });

      const result: ApiResponse<Tag> = await response.json();

      if (result.success) {
        fetchTags();
        fetchSummary();
      } else {
        message.error(result.message || t!.updateFailed);
      }
    } catch (error) {
      console.error("更新标签状态失败:", error);
      message.error(t!.updateFailed);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchSummary();
  }, [fetchTags, fetchSummary]);

  // 卸载时清除搜索防抖定时器，避免离开后仍触发列表请求
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, []);

  if (!t || !c) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.tagManagement}
          </h1>
          <p className="text-default-600 mt-2 text-lg">{t.manageTags}</p>
        </div>

        {/* 统计卡片 */}
        <div className="flex gap-4">
          <Card className="p-4 min-w-[120px]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.total}</p>
                <p className="text-sm text-default-500">{t.statsTotal}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{summary.active}</p>
                <p className="text-sm text-default-500">{t.statsActive}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 min-w-[120px]">
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{summary.inactive}</p>
                <p className="text-sm text-default-500">{t.statsInactive}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <Input
              placeholder={t.searchTags}
              value={searchQuery}
              onValueChange={handleSearch}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              className="flex-1 max-w-md"
            />

            {/* 状态筛选 */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === undefined ? "solid" : "bordered"}
                color={statusFilter === undefined ? "primary" : "default"}
                onPress={() => handleStatusFilter(undefined)}
                startContent={<Filter className="w-4 h-4" />}
              >
                {t.filterAll}
              </Button>
              <Button
                variant={statusFilter === true ? "solid" : "bordered"}
                color={statusFilter === true ? "success" : "default"}
                onPress={() => handleStatusFilter(true)}
                startContent={<Eye className="w-4 h-4" />}
              >
                {t.active}
              </Button>
              <Button
                variant={statusFilter === false ? "solid" : "bordered"}
                color={statusFilter === false ? "warning" : "default"}
                onPress={() => handleStatusFilter(false)}
                startContent={<EyeOff className="w-4 h-4" />}
              >
                {t.inactive}
              </Button>
            </div>

            {/* 创建按钮 */}
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={openCreateModal}
              className="lg:ml-auto"
            >
              {t.createTag}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 标签列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            <span className="text-lg font-semibold">{t.tagList}</span>
            <Badge content={total} color="primary" variant="flat">
              <Chip size="sm" variant="flat">
                {total} {t.countSuffix}
              </Chip>
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-default-600 mb-2">{t.noData}</h3>
              <p className="text-default-500 mb-4">{t.noDataDesc}</p>
              <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={openCreateModal}>
                {t.createTag}
              </Button>
            </div>
          ) : (
            <>
              <Table aria-label={t.tagList} className="min-h-[400px]">
                <TableHeader>
                  <TableColumn>{t.tableInfo}</TableColumn>
                  <TableColumn>{t.description}</TableColumn>
                  <TableColumn>{t.postCount}</TableColumn>
                  <TableColumn>{t.status}</TableColumn>
                  <TableColumn>{t.createdAt}</TableColumn>
                  <TableColumn>{t.actions}</TableColumn>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id} className="hover:bg-default-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: tag.color || "#667eea" }}
                          >
                            <Hash className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{tag.name}</div>
                            <div className="text-sm text-default-500 flex items-center gap-1">
                              <span>#{tag.slug}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {tag.description ? (
                            <p className="truncate text-default-700">{tag.description}</p>
                          ) : (
                            <span className="text-default-400 italic">{t.noDescription}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={tag.postCount && tag.postCount > 0 ? "primary" : "default"}
                        >
                          {tag.postCount || 0} {t.postUnit}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={tag.isActive}
                            onValueChange={() => toggleTagStatus(tag)}
                            color="success"
                            size="sm"
                          />
                          <span className="text-sm text-default-600">{tag.isActive ? t.active : t.inactive}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-default-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(tag.createdAt).toLocaleDateString(locale)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly variant="light" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="w-4 h-4" />}
                              onPress={() => openEditModal(tag)}
                            >
                              {c.edit}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => openDeleteModal(tag)}
                            >
                              {c.delete}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    showControls
                    showShadow
                    color="primary"
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} size="2xl">
        <ModalContent>
          <ModalHeader>{editingTagId ? t.editTag : t.createTagModal}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label={t.name}
                value={formData.name}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                isRequired
              />
              <Input
                label={t.slug}
                value={formData.slug}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, slug: value }))}
              />
            </div>
            <Textarea
              label={t.description}
              value={formData.description}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              minRows={3}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t.color}</p>
                <div className="flex flex-wrap items-end gap-3">
                  <Input
                    type="color"
                    aria-label={t.color}
                    className="w-20 min-w-[5rem]"
                    value={formData.color}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, color: value }));
                      setColorHexInput(value);
                    }}
                  />
                  <Input
                    label={t.hexColor}
                    placeholder="#667eea"
                    className="min-w-[12rem] flex-1"
                    value={colorHexInput}
                    onValueChange={(value) => {
                      setColorHexInput(value);
                      const n = normalizeHexColor(value);
                      if (n) setFormData((prev) => ({ ...prev, color: n }));
                    }}
                  />
                </div>
              </div>
              <Switch
                isSelected={formData.isActive}
                onValueChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              >
                {t.activeStatusLabel}
              </Switch>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
              {c.cancel}
            </Button>
            <Button color="primary" onPress={handleSaveTag} isLoading={saveLoading}>
              {saveLoading ? t.saving : c.save}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} size="sm">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-danger" />
              {t.confirmDeleteTitle}
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p>{fmt(t.confirmDeleteNamed, { name: selectedTag?.name || "" })}</p>
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-700 flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  {t.deleteWarningExtended}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDeleteModalOpen(false)}>
              {c.cancel}
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteTag}
              isLoading={deleteLoading}
              startContent={!deleteLoading && <Trash2 className="w-4 h-4" />}
            >
              {deleteLoading ? t.deleting : c.delete}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
