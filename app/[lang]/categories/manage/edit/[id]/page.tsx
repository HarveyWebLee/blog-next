/**
 * 编辑分类页面
 */

"use client";

import { useCallback, useEffect, useState } from "react";
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
  Select,
  SelectItem,
  Spinner,
  Switch,
  Textarea,
} from "@heroui/react";
import { ArrowLeft, Calendar, Edit, Eye, FileText, Folder, Save } from "lucide-react";

import { message } from "@/lib/utils";
import { ApiResponse, Category, UpdateCategoryRequest } from "@/types/blog";

interface EditCategoryPageProps {
  params: Promise<{ id: string; lang: string }>;
}

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

  const fetchCategory = useCallback(
    async (categoryId: string) => {
      try {
        const response = await fetch(`/api/categories/${categoryId}`);
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
          message.error(result.message || "获取分类信息失败");
          router.back();
        }
      } catch (error) {
        console.error("获取分类信息失败:", error);
        message.error("获取分类信息失败");
        router.back();
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?limit=100");
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
      message.warning("分类名称是必填项");
      return;
    }

    if (!category) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        message.success("分类更新成功");
        router.push("/categories/manage");
        router.refresh();
      } else {
        message.error(result.message || "更新分类失败");
      }
    } catch (error) {
      console.error("更新分类失败:", error);
      message.error("更新分类失败");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params;
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
        <h3 className="text-lg font-semibold text-default-600 mb-2">分类不存在</h3>
        <p className="text-default-500 mb-4">请检查分类ID是否正确</p>
        <Button color="primary" onPress={() => router.back()}>
          返回
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
            编辑分类
          </h1>
          <p className="text-default-600 mt-2 text-lg">编辑分类：{category.name}</p>
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
                <span className="text-lg font-semibold">分类信息</span>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="分类名称"
                    placeholder="请输入分类名称"
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                    isRequired
                    description="分类的显示名称"
                    startContent={<Folder className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                  <Input
                    label="分类标识 (Slug)"
                    placeholder="URL友好的标识符"
                    value={formData.slug}
                    onValueChange={(value) => setFormData({ ...formData, slug: value })}
                    description="URL中使用的标识符"
                    startContent={<FileText className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                </div>

                <Textarea
                  label="分类描述"
                  placeholder="请输入分类描述"
                  value={formData.description}
                  onValueChange={(value) => setFormData({ ...formData, description: value })}
                  description="可选的分类描述信息"
                  minRows={3}
                  startContent={<FileText className="w-4 h-4 text-default-400" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">父分类</label>
                    <Select
                      placeholder="选择父分类（可选）"
                      selectedKeys={formData.parentId ? [formData.parentId.toString()] : []}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setFormData({
                          ...formData,
                          parentId: selectedKey ? parseInt(selectedKey) : undefined,
                        });
                      }}
                    >
                      {categories.map((cat) => (
                        <SelectItem key={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </Select>
                    <p className="text-xs text-default-500">选择父分类以创建层级结构</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">排序顺序</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.sortOrder?.toString() || "0"}
                      onValueChange={(value) => setFormData({ ...formData, sortOrder: parseInt(value) || 0 })}
                      description="数字越小排序越靠前"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">状态</label>
                  <div className="flex items-center gap-3 p-4 bg-default-50 rounded-lg">
                    <Switch
                      isSelected={formData.isActive}
                      onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                      color="success"
                      size="lg"
                    />
                    <div>
                      <p className="font-medium text-foreground">{formData.isActive ? "激活" : "停用"}</p>
                      <p className="text-sm text-default-500">
                        {formData.isActive ? "分类将显示在网站上" : "分类将隐藏"}
                      </p>
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="flex gap-4 pt-4">
                  <Button variant="light" onPress={() => router.back()} className="flex-1">
                    取消
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Save className="w-4 h-4" />}
                    isLoading={saving}
                    className="flex-1"
                  >
                    {saving ? "保存中..." : "保存更改"}
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
                <span className="text-lg font-semibold">预览</span>
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
                      <div className="font-semibold text-foreground">{formData.name || "分类名称"}</div>
                      <div className="text-sm text-default-500">#{formData.slug || "分类标识"}</div>
                    </div>
                  </div>

                  {formData.description && <p className="text-sm text-default-600 mb-3">{formData.description}</p>}

                  <div className="flex items-center justify-center gap-2">
                    <Chip size="sm" color={formData.isActive ? "success" : "warning"} variant="flat">
                      {formData.isActive ? "激活" : "停用"}
                    </Chip>
                    {formData.parentId && (
                      <Chip size="sm" color="primary" variant="flat">
                        子分类
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
                <span className="text-lg font-semibold">分类详情</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-default-500">分类ID</span>
                  <span className="font-medium">#{category.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">创建时间</span>
                  <span className="font-medium">{new Date(category.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">更新时间</span>
                  <span className="font-medium">{new Date(category.updatedAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">文章数量</span>
                  <span className="font-medium">{(category as any).postCount || 0} 篇</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">当前状态</span>
                  <Chip size="sm" color={category.isActive ? "success" : "warning"} variant="flat">
                    {category.isActive ? "激活" : "停用"}
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
