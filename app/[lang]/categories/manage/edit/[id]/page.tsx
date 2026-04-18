/**
 * 编辑分类页面
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Spinner,
  Switch,
  Textarea,
} from "@heroui/react";
import { ArrowLeft, Calendar, Edit, Eye, FileText, Folder, Save } from "lucide-react";

import { CategoryTreeSelect } from "@/components/ui/category-tree-select";
import { message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { Locale } from "@/types";
import { ApiResponse, Category, UpdateCategoryRequest } from "@/types/blog";

interface EditCategoryPageProps {
  params: Promise<{ id: string; lang: string }>;
}

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

const EDIT_TEXT: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    requiredName: "分类名称是必填项",
    fetchFailed: "获取分类信息失败",
    updateSuccess: "分类更新成功",
    updateFailed: "更新分类失败",
    notFound: "分类不存在",
    notFoundDesc: "请检查分类ID是否正确",
    back: "返回",
    title: "编辑分类",
    editingPrefix: "编辑分类：",
    info: "分类信息",
    name: "分类名称",
    namePlaceholder: "请输入分类名称",
    nameDesc: "分类的显示名称",
    slug: "分类标识 (Slug)",
    slugPlaceholder: "URL友好的标识符",
    slugDesc: "URL中使用的标识符",
    description: "分类描述",
    descriptionPlaceholder: "请输入分类描述",
    descriptionDesc: "可选的分类描述信息",
    parent: "父分类",
    parentPlaceholder: "选择父分类（可选）",
    parentDesc: "选择父分类以创建层级结构",
    sortOrder: "排序顺序",
    sortDesc: "数字越小排序越靠前",
    status: "状态",
    active: "激活",
    inactive: "停用",
    activeDesc: "分类将显示在网站上",
    inactiveDesc: "分类将隐藏",
    cancel: "取消",
    saving: "保存中...",
    save: "保存更改",
    preview: "预览",
    details: "分类详情",
    categoryId: "分类ID",
    createdAt: "创建时间",
    updatedAt: "更新时间",
    postCount: "文章数量",
    currentStatus: "当前状态",
    none: "无",
    postUnit: "篇",
  },
  "en-US": {
    requiredName: "Category name is required",
    fetchFailed: "Failed to load category info",
    updateSuccess: "Category updated successfully",
    updateFailed: "Failed to update category",
    notFound: "Category not found",
    notFoundDesc: "Please check the category ID",
    back: "Back",
    title: "Edit Category",
    editingPrefix: "Editing: ",
    info: "Category Info",
    name: "Category Name",
    namePlaceholder: "Enter category name",
    nameDesc: "Display name of category",
    slug: "Category Slug",
    slugPlaceholder: "URL-friendly identifier",
    slugDesc: "Identifier used in URL",
    description: "Description",
    descriptionPlaceholder: "Enter category description",
    descriptionDesc: "Optional category description",
    parent: "Parent Category",
    parentPlaceholder: "Select parent (optional)",
    parentDesc: "Choose parent to create hierarchy",
    sortOrder: "Sort Order",
    sortDesc: "Smaller number appears first",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    activeDesc: "Category will be visible on site",
    inactiveDesc: "Category will be hidden",
    cancel: "Cancel",
    saving: "Saving...",
    save: "Save Changes",
    preview: "Preview",
    details: "Details",
    categoryId: "Category ID",
    createdAt: "Created At",
    updatedAt: "Updated At",
    postCount: "Posts",
    currentStatus: "Current Status",
    none: "None",
    postUnit: "posts",
  },
  "ja-JP": {
    requiredName: "カテゴリー名は必須です",
    fetchFailed: "カテゴリー情報の取得に失敗しました",
    updateSuccess: "カテゴリーを更新しました",
    updateFailed: "カテゴリー更新に失敗しました",
    notFound: "カテゴリーが存在しません",
    notFoundDesc: "カテゴリーIDを確認してください",
    back: "戻る",
    title: "カテゴリー編集",
    editingPrefix: "編集中：",
    info: "カテゴリー情報",
    name: "カテゴリー名",
    namePlaceholder: "カテゴリー名を入力",
    nameDesc: "表示用のカテゴリー名",
    slug: "カテゴリースラッグ",
    slugPlaceholder: "URL 用識別子",
    slugDesc: "URL で使用される識別子",
    description: "説明",
    descriptionPlaceholder: "カテゴリー説明を入力",
    descriptionDesc: "任意の説明",
    parent: "親カテゴリー",
    parentPlaceholder: "親カテゴリーを選択（任意）",
    parentDesc: "階層構造を作成します",
    sortOrder: "並び順",
    sortDesc: "小さい数字ほど先頭に表示",
    status: "状態",
    active: "有効",
    inactive: "無効",
    activeDesc: "サイト上に表示されます",
    inactiveDesc: "サイト上で非表示になります",
    cancel: "キャンセル",
    saving: "保存中...",
    save: "変更を保存",
    preview: "プレビュー",
    details: "詳細",
    categoryId: "カテゴリーID",
    createdAt: "作成日",
    updatedAt: "更新日",
    postCount: "記事数",
    currentStatus: "現在の状態",
    none: "なし",
    postUnit: "件",
  },
};

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<UpdateCategoryRequest>({
    name: "",
    slug: "",
    description: "",
    parentId: undefined,
    sortOrder: 0,
    isActive: true,
  });
  const [lang, setLang] = useState<Locale>("zh-CN");
  const t = EDIT_TEXT[lang];

  // 编辑页父分类禁用列表：当前分类及其后代不可选，避免循环层级
  const disabledParentIds = useMemo(() => {
    if (!category) return [];
    const blocked = new Set<number>([category.id]);
    const childrenMap = new Map<number, number[]>();
    for (const cat of categories) {
      if (cat.parentId == null) continue;
      const list = childrenMap.get(cat.parentId) || [];
      list.push(cat.id);
      childrenMap.set(cat.parentId, list);
    }
    const stack = [category.id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const children = childrenMap.get(current) || [];
      for (const childId of children) {
        if (blocked.has(childId)) continue;
        blocked.add(childId);
        stack.push(childId);
      }
    }
    return Array.from(blocked);
  }, [categories, category]);

  const fetchCategory = useCallback(
    async (categoryId: string) => {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          headers: { ...clientBearerHeaders() },
        });
        const result: ApiResponse<Category & { postCount: number }> = await response.json();

        if (result.success && result.data) {
          setCategory(result.data);
          setFormData({
            name: result.data.name,
            slug: result.data.slug,
            description: result.data.description || "",
            parentId: result.data.parentId || undefined,
            sortOrder: result.data.sortOrder || 0,
            isActive: result.data.isActive,
          });
        } else {
          message.error(result.message || t.fetchFailed);
          router.back();
        }
      } catch (error) {
        console.error("获取分类信息失败:", error);
        message.error(t.fetchFailed);
        router.back();
      } finally {
        setLoading(false);
      }
    },
    [router, t.fetchFailed]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?limit=100", {
        headers: { ...clientBearerHeaders() },
      });
      const result: ApiResponse<{ data: Category[]; pagination: any }> = await response.json();

      if (result.success && result.data) {
        const filteredCategories = result.data.data.filter((c) => c.id !== category?.id);
        setCategories(filteredCategories);
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
    }
  }, [category?.id]);

  // 更新分类
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      message.warning(t.requiredName);
      return;
    }

    if (!category) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...clientBearerHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        message.success(t.updateSuccess);
        router.push(`/${lang}/categories/manage`);
        router.refresh();
      } else {
        message.error(result.message || t.updateFailed);
      }
    } catch (error) {
      console.error("更新分类失败:", error);
      message.error(t.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params;
      setLang(resolveLocale(resolvedParams.lang));
      await fetchCategory(resolvedParams.id);
    };

    initPage();
  }, [params, fetchCategory]);

  useEffect(() => {
    if (category) {
      fetchCategories();
    }
  }, [category, fetchCategories]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <Folder className="w-16 h-16 text-default-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-default-600 mb-2">{t.notFound}</h3>
        <p className="text-default-500 mb-4">{t.notFoundDesc}</p>
        <Button color="primary" onPress={() => router.back()}>
          {t.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="light" isIconOnly onPress={() => router.back()} className="hover:bg-default-100">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-default-600 mt-2 text-lg">
            {t.editingPrefix}
            {category.name}
          </p>
        </div>
        <Badge content="ID" color="primary" variant="flat">
          <Chip size="sm" variant="flat">
            #{category.id}
          </Chip>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 编辑表单 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                <span className="text-lg font-semibold">{t.info}</span>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t.name}
                    placeholder={t.namePlaceholder}
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                    isRequired
                    description={t.nameDesc}
                    startContent={<Folder className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                  <Input
                    label={t.slug}
                    placeholder={t.slugPlaceholder}
                    value={formData.slug}
                    onValueChange={(value) => setFormData({ ...formData, slug: value })}
                    description={t.slugDesc}
                    startContent={<FileText className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                </div>

                <Textarea
                  label={t.description}
                  placeholder={t.descriptionPlaceholder}
                  value={formData.description}
                  onValueChange={(value) => setFormData({ ...formData, description: value })}
                  description={t.descriptionDesc}
                  minRows={3}
                  startContent={<FileText className="w-4 h-4 text-default-400" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <CategoryTreeSelect
                      label={t.parent}
                      placeholder={t.parentPlaceholder}
                      noneLabel={t.none}
                      categories={categories}
                      value={formData.parentId}
                      disabledIds={disabledParentIds}
                      onChange={(parentId) => setFormData({ ...formData, parentId })}
                    />
                    <p className="text-xs text-default-500">{t.parentDesc}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">{t.sortOrder}</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.sortOrder?.toString() || "0"}
                      onValueChange={(value) => setFormData({ ...formData, sortOrder: parseInt(value) || 0 })}
                      description={t.sortDesc}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">{t.status}</label>
                  <div className="flex items-center gap-3 p-4 bg-default-50 rounded-lg">
                    <Switch
                      isSelected={formData.isActive}
                      onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                      color="success"
                      size="lg"
                    />
                    <div>
                      <p className="font-medium text-foreground">{formData.isActive ? t.active : t.inactive}</p>
                      <p className="text-sm text-default-500">{formData.isActive ? t.activeDesc : t.inactiveDesc}</p>
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="flex gap-4 pt-4">
                  <Button variant="light" onPress={() => router.back()} className="flex-1">
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Save className="w-4 h-4" />}
                    isLoading={saving}
                    className="flex-1"
                  >
                    {saving ? t.saving : t.save}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* 预览和详情卡片 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 预览卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="text-lg font-semibold">{t.preview}</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-default-50 to-default-100 rounded-lg">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-primary">
                      <Folder className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{formData.name || t.name}</div>
                      <div className="text-sm text-default-500">#{formData.slug || t.slug}</div>
                    </div>
                  </div>

                  {formData.description && <p className="text-sm text-default-600 mb-3">{formData.description}</p>}

                  <div className="flex items-center justify-center gap-2">
                    <Chip size="sm" color={formData.isActive ? "success" : "warning"} variant="flat">
                      {formData.isActive ? t.active : t.inactive}
                    </Chip>
                    {formData.parentId && (
                      <Chip size="sm" color="primary" variant="flat">
                        {t.parent}
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 分类详情卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-semibold">{t.details}</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-default-500">{t.categoryId}</span>
                  <span className="font-medium">#{category.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{t.createdAt}</span>
                  <span className="font-medium">{new Date(category.createdAt).toLocaleDateString(lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{t.updatedAt}</span>
                  <span className="font-medium">{new Date(category.updatedAt).toLocaleDateString(lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{t.postCount}</span>
                  <span className="font-medium">
                    {(category as any).postCount || 0} {t.postUnit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{t.currentStatus}</span>
                  <Chip size="sm" color={category.isActive ? "success" : "warning"} variant="flat">
                    {category.isActive ? t.active : t.inactive}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
