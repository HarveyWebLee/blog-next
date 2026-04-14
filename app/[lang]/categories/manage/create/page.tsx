/**
 * 创建分类页面
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@heroui/react";
import { ArrowLeft, Eye, FileText, Folder, Plus } from "lucide-react";

import { generateRandomUrlAlias, message } from "@/lib/utils";
import { Locale } from "@/types";
import { ApiResponse, Category, CreateCategoryRequest } from "@/types/blog";

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

const CREATE_TEXT: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    title: "创建分类",
    subtitle: "创建新的博客分类",
    info: "分类信息",
    name: "分类名称",
    namePlaceholder: "请输入分类名称",
    nameDesc: "分类的显示名称",
    slug: "分类标识 (Slug)",
    slugPlaceholder: "默认 8 位随机码，可手动修改",
    slugAuto: "默认自动生成 8 位英文数字随机码",
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
    creating: "创建中...",
    create: "创建分类",
    preview: "预览",
    notSet: "未设置",
    autoGenerate: "将自动生成",
    unknown: "未知",
    none: "无",
    childCategory: "子分类",
    requiredName: "分类名称是必填项",
    createSuccess: "分类创建成功",
    createFailed: "创建分类失败",
  },
  "en-US": {
    title: "Create Category",
    subtitle: "Create a new blog category",
    info: "Category Info",
    name: "Category Name",
    namePlaceholder: "Enter category name",
    nameDesc: "Display name of category",
    slug: "Category Slug",
    slugPlaceholder: "8-char random code by default; editable",
    slugAuto: "Auto-generated 8-char alphanumeric code",
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
    creating: "Creating...",
    create: "Create Category",
    preview: "Preview",
    notSet: "Not set",
    autoGenerate: "Will be auto-generated",
    unknown: "Unknown",
    none: "None",
    childCategory: "Child",
    requiredName: "Category name is required",
    createSuccess: "Category created successfully",
    createFailed: "Failed to create category",
  },
  "ja-JP": {
    title: "カテゴリー作成",
    subtitle: "新しいブログカテゴリーを作成",
    info: "カテゴリー情報",
    name: "カテゴリー名",
    namePlaceholder: "カテゴリー名を入力",
    nameDesc: "表示用のカテゴリー名",
    slug: "カテゴリースラッグ",
    slugPlaceholder: "既定は8文字のランダムコード（編集可）",
    slugAuto: "英数字8文字のランダムコードを自動生成",
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
    creating: "作成中...",
    create: "カテゴリー作成",
    preview: "プレビュー",
    notSet: "未設定",
    autoGenerate: "自動生成されます",
    unknown: "不明",
    none: "なし",
    childCategory: "子カテゴリー",
    requiredName: "カテゴリー名は必須です",
    createSuccess: "カテゴリーを作成しました",
    createFailed: "カテゴリー作成に失敗しました",
  },
};

export default function CreateCategoryPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const locale = resolveLocale(params.lang);
  const t = CREATE_TEXT[locale];
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  /** 创建分类：默认生成 8 位英文数字随机标识，用户可手动修改 */
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: "",
    slug: generateRandomUrlAlias(8),
    description: "",
    parentId: undefined,
    sortOrder: 0,
    isActive: true,
  });

  // 获取分类列表（用于选择父分类）
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?limit=100");
      const result: ApiResponse<{ data: Category[]; pagination: any }> = await response.json();

      if (result.success && result.data) {
        setCategories(result.data.data);
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
    }
  };

  // 处理名称变化
  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
    });
  };

  // 创建分类
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      message.warning(t.requiredName);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // 若用户手动清空，则提交前再自动补一个 8 位随机标识
          slug: formData.slug?.trim() || generateRandomUrlAlias(8),
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        message.success(t.createSuccess);
        router.push(`/${params.lang}/categories/manage`);
        router.refresh();
      } else {
        message.error(result.message || t.createFailed);
      }
    } catch (error) {
      console.error("创建分类失败:", error);
      message.error(t.createFailed);
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="light" isIconOnly onPress={() => router.back()} className="hover:bg-default-100">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-default-600 mt-2 text-lg">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 创建表单 */}
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
                    onValueChange={handleNameChange}
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
                    description={t.slugAuto}
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
                    <label className="text-sm font-medium text-foreground">{t.parent}</label>
                    <Select
                      placeholder={t.parentPlaceholder}
                      selectedKeys={formData.parentId ? [formData.parentId.toString()] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setFormData({
                          ...formData,
                          parentId: selectedKey ? parseInt(selectedKey) : undefined,
                        });
                      }}
                    >
                      {categories.map((category) => (
                        <SelectItem key={category.id.toString()}>{category.name}</SelectItem>
                      ))}
                    </Select>
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
                    startContent={<Plus className="w-4 h-4" />}
                    isLoading={loading}
                    className="flex-1"
                  >
                    {loading ? t.creating : t.create}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* 预览卡片 */}
        <div className="lg:col-span-1">
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
                        {t.childCategory}
                      </Chip>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-default-500">
                  <p>
                    • {t.name}: {formData.name || t.notSet}
                  </p>
                  <p>
                    • {t.slug}: {formData.slug || t.autoGenerate}
                  </p>
                  <p>
                    • {t.parent}:{" "}
                    {formData.parentId ? categories.find((c) => c.id === formData.parentId)?.name || t.unknown : t.none}
                  </p>
                  <p>
                    • {t.sortOrder}: {formData.sortOrder}
                  </p>
                  <p>
                    • {t.status}: {formData.isActive ? t.active : t.inactive}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
