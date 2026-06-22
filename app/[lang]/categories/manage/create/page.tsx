/**
 * 创建分类页面
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Switch, Textarea } from "@heroui/react";
import { ArrowLeft, Eye, FileText, Folder, Plus } from "lucide-react";

import { CategoryTreeSelect } from "@/components/ui/category-tree-select";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { generateRandomUrlAlias, message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { ApiResponse, Category, CreateCategoryRequest } from "@/types/blog";

export default function CreateCategoryPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const dict = useClientDictionary(params.lang);
  const t = dict?.category as Record<string, string> | undefined;
  const tc = (dict?.category as { create?: Record<string, string> } | undefined)?.create;
  const c = dict?.common as Record<string, string> | undefined;
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
      const response = await fetch("/api/categories?limit=100", {
        headers: { ...clientBearerHeaders() },
      });
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
      message.warning(t!.nameRequired);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...clientBearerHeaders(),
        },
        body: JSON.stringify({
          ...formData,
          // 若用户手动清空，则提交前再自动补一个 8 位随机标识
          slug: formData.slug?.trim() || generateRandomUrlAlias(8),
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        message.success(t!.categoryCreated);
        router.push(`/${params.lang}/categories/manage`);
        router.refresh();
      } else {
        message.error(result.message || tc!.createFailed);
      }
    } catch (error) {
      console.error("创建分类失败:", error);
      message.error(tc!.createFailed);
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    fetchCategories();
  }, []);

  if (!t || !tc || !c) return null;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="light" isIconOnly onPress={() => router.back()} className="hover:bg-default-100">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {tc.title}
          </h1>
          <p className="text-default-600 mt-2 text-lg">{tc.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 创建表单 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                <span className="text-lg font-semibold">{tc.info}</span>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t.name}
                    placeholder={tc.namePlaceholder}
                    value={formData.name}
                    onValueChange={handleNameChange}
                    isRequired
                    description={tc.nameDesc}
                    startContent={<Folder className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                  <Input
                    label={tc.slugLabel}
                    placeholder={tc.slugPlaceholder}
                    value={formData.slug}
                    onValueChange={(value) => setFormData({ ...formData, slug: value })}
                    description={tc.slugAuto}
                    startContent={<FileText className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                </div>

                <Textarea
                  label={t.description}
                  placeholder={tc.descriptionPlaceholder}
                  value={formData.description}
                  onValueChange={(value) => setFormData({ ...formData, description: value })}
                  description={tc.descriptionDesc}
                  minRows={3}
                  startContent={<FileText className="w-4 h-4 text-default-400" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <CategoryTreeSelect
                      label={t.parentCategory}
                      placeholder={tc.parentPlaceholder}
                      noneLabel={tc.none}
                      categories={categories}
                      value={formData.parentId}
                      onChange={(parentId) => setFormData({ ...formData, parentId })}
                    />
                    <p className="text-xs text-default-500">{tc.parentDesc}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">{t.sortOrder}</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.sortOrder?.toString() || "0"}
                      onValueChange={(value) => setFormData({ ...formData, sortOrder: parseInt(value) || 0 })}
                      description={tc.sortDesc}
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
                      <p className="text-sm text-default-500">{formData.isActive ? tc.activeDesc : tc.inactiveDesc}</p>
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="flex gap-4 pt-4">
                  <Button variant="light" onPress={() => router.back()} className="flex-1">
                    {c.cancel}
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Plus className="w-4 h-4" />}
                    isLoading={loading}
                    className="flex-1"
                  >
                    {loading ? tc.creating : t.createCategory}
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
                <span className="text-lg font-semibold">{tc.preview}</span>
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
                        {tc.childCategory}
                      </Chip>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-default-500">
                  <p>
                    • {t.name}: {formData.name || tc.notSet}
                  </p>
                  <p>
                    • {t.slug}: {formData.slug || t.autoSlugGenerate}
                  </p>
                  <p>
                    • {t.parentCategory}:{" "}
                    {formData.parentId
                      ? categories.find((cat) => cat.id === formData.parentId)?.name || tc.unknown
                      : tc.none}
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
