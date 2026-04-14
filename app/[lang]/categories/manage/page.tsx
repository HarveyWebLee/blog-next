/**
 * 分类管理主页面
 * 提供分类的增删改查功能
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "@heroui/react";
import {
  BarChart3,
  Calendar,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Folder,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { message } from "@/lib/utils";
import { Locale } from "@/types";
import { ApiResponse, Category, CategoryQueryParams, PaginatedResponseData } from "@/types/blog";

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

const MANAGE_TEXT: Record<
  Locale,
  {
    pageTitle: string;
    pageDesc: string;
    totalLabel: string;
    activeLabel: string;
    inactiveLabel: string;
    searchPlaceholder: string;
    all: string;
    active: string;
    inactive: string;
    createCategory: string;
    listTitle: string;
    totalCount: (count: number) => string;
    noData: string;
    noDataDesc: string;
    tableInfo: string;
    tableDesc: string;
    tablePostCount: string;
    tableStatus: string;
    tableCreatedAt: string;
    tableActions: string;
    noDesc: string;
    postUnit: string;
    edit: string;
    del: string;
    deleting: string;
    deleteConfirmTitle: string;
    deleteConfirmDesc: (name?: string) => string;
    deleteWarning: string;
    cancel: string;
    deleteFailed: string;
    updateFailed: string;
  }
> = {
  "zh-CN": {
    pageTitle: "分类管理",
    pageDesc: "管理博客分类，包括创建、编辑、删除和状态控制",
    totalLabel: "总分类",
    activeLabel: "激活",
    inactiveLabel: "停用",
    searchPlaceholder: "搜索分类名称...",
    all: "全部",
    active: "激活",
    inactive: "停用",
    createCategory: "创建分类",
    listTitle: "分类列表",
    totalCount: (count) => `共 ${count} 个分类`,
    noData: "暂无分类",
    noDataDesc: "开始创建你的第一个分类吧",
    tableInfo: "分类信息",
    tableDesc: "描述",
    tablePostCount: "文章数量",
    tableStatus: "状态",
    tableCreatedAt: "创建时间",
    tableActions: "操作",
    noDesc: "无描述",
    postUnit: "篇",
    edit: "编辑",
    del: "删除",
    deleting: "删除中...",
    deleteConfirmTitle: "确认删除",
    deleteConfirmDesc: (name) => `确定要删除分类 ${name || ""} 吗？`,
    deleteWarning: "注意：如果该分类下还有文章或子分类，将无法删除。",
    cancel: "取消",
    deleteFailed: "删除分类失败",
    updateFailed: "更新分类状态失败",
  },
  "en-US": {
    pageTitle: "Category Management",
    pageDesc: "Manage blog categories including create, edit, delete and status",
    totalLabel: "Total",
    activeLabel: "Active",
    inactiveLabel: "Inactive",
    searchPlaceholder: "Search categories...",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    createCategory: "Create Category",
    listTitle: "Category List",
    totalCount: (count) => `${count} categories`,
    noData: "No categories",
    noDataDesc: "Create your first category",
    tableInfo: "Category",
    tableDesc: "Description",
    tablePostCount: "Posts",
    tableStatus: "Status",
    tableCreatedAt: "Created At",
    tableActions: "Actions",
    noDesc: "No description",
    postUnit: "posts",
    edit: "Edit",
    del: "Delete",
    deleting: "Deleting...",
    deleteConfirmTitle: "Confirm Delete",
    deleteConfirmDesc: (name) => `Are you sure you want to delete ${name || "this category"}?`,
    deleteWarning: "If this category has posts or children, it cannot be deleted.",
    cancel: "Cancel",
    deleteFailed: "Failed to delete category",
    updateFailed: "Failed to update category status",
  },
  "ja-JP": {
    pageTitle: "カテゴリー管理",
    pageDesc: "カテゴリの作成・編集・削除と状態管理",
    totalLabel: "総数",
    activeLabel: "有効",
    inactiveLabel: "無効",
    searchPlaceholder: "カテゴリー名を検索...",
    all: "すべて",
    active: "有効",
    inactive: "無効",
    createCategory: "カテゴリー作成",
    listTitle: "カテゴリー一覧",
    totalCount: (count) => `${count} 件`,
    noData: "カテゴリーがありません",
    noDataDesc: "最初のカテゴリーを作成しましょう",
    tableInfo: "カテゴリー",
    tableDesc: "説明",
    tablePostCount: "記事数",
    tableStatus: "状態",
    tableCreatedAt: "作成日",
    tableActions: "操作",
    noDesc: "説明なし",
    postUnit: "件",
    edit: "編集",
    del: "削除",
    deleting: "削除中...",
    deleteConfirmTitle: "削除確認",
    deleteConfirmDesc: (name) => `${name || "このカテゴリー"} を削除しますか？`,
    deleteWarning: "記事や子カテゴリーがある場合は削除できません。",
    cancel: "キャンセル",
    deleteFailed: "カテゴリーの削除に失敗しました",
    updateFailed: "状態更新に失敗しました",
  },
};

/**
 * 分类管理页面组件
 */
export default function CategoriesManagePage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const locale = resolveLocale(params.lang);
  const t = MANAGE_TEXT[locale];

  // 状态管理
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  /** 顶部统计卡：固定展示全量统计，不受搜索/状态筛选影响 */
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  // 模态框状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = useCallback(
    async (params: Partial<CategoryQueryParams> = {}) => {
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

        const response = await fetch(`/api/categories?${queryParams}`);
        const result: ApiResponse<PaginatedResponseData<Category>> = await response.json();

        if (result.success && result.data) {
          setCategories(result.data.data);
          setTotalPages(result.data.pagination.totalPages);
          setTotal(result.data.pagination.total);
        } else {
          console.error("获取分类列表失败:", result.message);
        }
      } catch (error) {
        console.error("获取分类列表失败:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, limit]
  );

  /**
   * 拉取全量统计（总数/激活/停用）：
   * - 与列表筛选参数解耦，保证顶部统计卡语义稳定
   * - 通过分页 total 获取计数，避免拉取全部分类数据
   */
  const fetchSummary = useCallback(async () => {
    try {
      const baseParams = "page=1&limit=1&sortBy=createdAt&sortOrder=desc";
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        fetch(`/api/categories?${baseParams}`),
        fetch(`/api/categories?${baseParams}&isActive=true`),
        fetch(`/api/categories?${baseParams}&isActive=false`),
      ]);

      const [allJson, activeJson, inactiveJson] = (await Promise.all([
        allRes.json(),
        activeRes.json(),
        inactiveRes.json(),
      ])) as [
        ApiResponse<PaginatedResponseData<Category>>,
        ApiResponse<PaginatedResponseData<Category>>,
        ApiResponse<PaginatedResponseData<Category>>,
      ];

      if (allJson.success && activeJson.success && inactiveJson.success) {
        setSummary({
          total: allJson.data?.pagination.total || 0,
          active: activeJson.data?.pagination.total || 0,
          inactive: inactiveJson.data?.pagination.total || 0,
        });
      }
    } catch (error) {
      console.error("获取分类汇总统计失败:", error);
    }
  }, []);

  // 搜索处理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchCategories({ search: query, page: 1 });
  };

  // 状态筛选处理
  const handleStatusFilter = (status: boolean | undefined) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchCategories({ isActive: status, page: 1, search: searchQuery });
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCategories({ page, search: searchQuery, isActive: statusFilter });
  };

  // 删除分类
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
        fetchCategories();
        fetchSummary();
      } else {
        message.error(result.message || t.deleteFailed);
      }
    } catch (error) {
      console.error("删除分类失败:", error);
      message.error(t.deleteFailed);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 打开删除模态框
  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  // 切换分类状态
  const toggleCategoryStatus = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      const result: ApiResponse<Category> = await response.json();

      if (result.success) {
        fetchCategories();
        fetchSummary();
      } else {
        message.error(result.message || t.updateFailed);
      }
    } catch (error) {
      console.error("更新分类状态失败:", error);
      message.error(t.updateFailed);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSummary();
  }, [fetchCategories, fetchSummary]);

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.pageTitle}
          </h1>
          <p className="text-default-600 mt-2 text-lg">{t.pageDesc}</p>
        </div>

        {/* 统计卡片 */}
        <div className="flex gap-4">
          <Card className="p-4 min-w-[120px]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.total}</p>
                <p className="text-sm text-default-500">{t.totalLabel}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{summary.active}</p>
                <p className="text-sm text-default-500">{t.activeLabel}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 min-w-[120px]">
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{summary.inactive}</p>
                <p className="text-sm text-default-500">{t.inactiveLabel}</p>
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
              placeholder={t.searchPlaceholder}
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
                {t.all}
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
              onPress={() => router.push(`/${params.lang}/categories/manage/create`)}
              className="lg:ml-auto"
            >
              {t.createCategory}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 分类列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            <span className="text-lg font-semibold">{t.listTitle}</span>
            <Badge color="primary" variant="flat">
              <Chip size="sm" variant="flat">
                {t.totalCount(total)}
              </Chip>
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-default-600 mb-2">{t.noData}</h3>
              <p className="text-default-500 mb-4">{t.noDataDesc}</p>
              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={() => router.push(`/${params.lang}/categories/manage/create`)}
              >
                {t.createCategory}
              </Button>
            </div>
          ) : (
            <>
              <Table aria-label={t.listTitle} className="min-h-[400px]">
                <TableHeader>
                  <TableColumn>{t.tableInfo}</TableColumn>
                  <TableColumn>{t.tableDesc}</TableColumn>
                  <TableColumn>{t.tablePostCount}</TableColumn>
                  <TableColumn>{t.tableStatus}</TableColumn>
                  <TableColumn>{t.tableCreatedAt}</TableColumn>
                  <TableColumn>{t.tableActions}</TableColumn>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-default-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-primary">
                            <Folder className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{category.name}</div>
                            <div className="text-sm text-default-500 flex items-center gap-1">
                              <span>#{category.slug}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {category.description ? (
                            <p className="truncate text-default-700">{category.description}</p>
                          ) : (
                            <span className="text-default-400 italic">{t.noDesc}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={category.postCount && category.postCount > 0 ? "primary" : "default"}
                        >
                          {category.postCount || 0} {t.postUnit}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={category.isActive}
                            onValueChange={() => toggleCategoryStatus(category)}
                            color="success"
                            size="sm"
                          />
                          <span className="text-sm text-default-600">{category.isActive ? t.active : t.inactive}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-default-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(category.createdAt).toLocaleDateString(locale)}
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
                              onPress={() => router.push(`/${params.lang}/categories/manage/edit/${category.id}`)}
                            >
                              {t.edit}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => openDeleteModal(category)}
                            >
                              {t.del}
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

      {/* 删除确认模态框 */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} size="sm">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-danger" />
              {t.deleteConfirmTitle}
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p>{t.deleteConfirmDesc(selectedCategory?.name)}</p>
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-700 flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  {t.deleteWarning}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDeleteModalOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteCategory}
              isLoading={deleteLoading}
              startContent={!deleteLoading && <Trash2 className="w-4 h-4" />}
            >
              {deleteLoading ? t.deleting : t.del}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
