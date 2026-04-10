/**
 * 创建分类页面
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

import { message } from "@/lib/utils";
import { ApiResponse, Category, CreateCategoryRequest } from "@/types/blog";

export default function CreateCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: "",
    slug: "",
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

  // 自动生成slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // 处理名称变化
  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: formData.slug || generateSlug(value),
    });
  };

  // 创建分类
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      message.warning("分类名称是必填项");
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
          slug: formData.slug || generateSlug(formData.name),
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        message.success("分类创建成功");
        router.push("/categories/manage");
        router.refresh();
      } else {
        message.error(result.message || "创建分类失败");
      }
    } catch (error) {
      console.error("创建分类失败:", error);
      message.error("创建分类失败");
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
            创建分类
          </h1>
          <p className="text-default-600 mt-2 text-lg">创建新的博客分类</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 创建表单 */}
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
                    onValueChange={handleNameChange}
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
                    description="留空将自动生成"
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
                      {categories.map((category) => (
                        <SelectItem key={category.id.toString()}>{category.name}</SelectItem>
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
                    startContent={<Plus className="w-4 h-4" />}
                    isLoading={loading}
                    className="flex-1"
                  >
                    {loading ? "创建中..." : "创建分类"}
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

                <div className="space-y-2 text-sm text-default-500">
                  <p>• 分类名称: {formData.name || "未设置"}</p>
                  <p>• 分类标识: {formData.slug || "将自动生成"}</p>
                  <p>
                    • 父分类:{" "}
                    {formData.parentId ? categories.find((c) => c.id === formData.parentId)?.name || "未知" : "无"}
                  </p>
                  <p>• 排序顺序: {formData.sortOrder}</p>
                  <p>• 状态: {formData.isActive ? "激活" : "停用"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
