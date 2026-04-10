/**
 * 创建标签页面
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Switch, Textarea } from "@heroui/react";
import { ArrowLeft, Eye, FileText, Hash, Palette, Plus, Tag as TagIcon } from "lucide-react";

import { message } from "@/lib/utils";
import { ApiResponse, CreateTagRequest } from "@/types/blog";

export default function CreateTagPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTagRequest>({
    name: "",
    slug: "",
    description: "",
    color: "#667eea",
    isActive: true,
  });

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

  // 创建标签
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      message.warning("标签名称是必填项");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/tags", {
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
        router.push("/tags/manage");
        router.refresh();
      } else {
        message.error(result.message || "创建标签失败");
      }
    } catch (error) {
      console.error("创建标签失败:", error);
      message.error("创建标签失败");
    } finally {
      setLoading(false);
    }
  };

  // 预设颜色
  const presetColors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#38f9d7",
    "#ffecd2",
    "#fcb69f",
    "#a8edea",
    "#fed6e3",
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="light" isIconOnly onPress={() => router.back()} className="hover:bg-default-100">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            创建标签
          </h1>
          <p className="text-default-600 mt-2 text-lg">创建新的博客标签</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 创建表单 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                <span className="text-lg font-semibold">标签信息</span>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="标签名称"
                    placeholder="请输入标签名称"
                    value={formData.name}
                    onValueChange={handleNameChange}
                    isRequired
                    description="标签的显示名称"
                    startContent={<Hash className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                  <Input
                    label="标签标识 (Slug)"
                    placeholder="URL友好的标识符"
                    value={formData.slug}
                    onValueChange={(value) => setFormData({ ...formData, slug: value })}
                    description="留空将自动生成"
                    startContent={<TagIcon className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                </div>

                <Textarea
                  label="标签描述"
                  placeholder="请输入标签描述"
                  value={formData.description}
                  onValueChange={(value) => setFormData({ ...formData, description: value })}
                  description="可选的标签描述信息"
                  minRows={3}
                  startContent={<FileText className="w-4 h-4 text-default-400" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">标签颜色</label>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Input
                          type="color"
                          value={formData.color}
                          onValueChange={(value) => setFormData({ ...formData, color: value })}
                          className="w-16 h-10"
                        />
                        <Input
                          placeholder="#667eea"
                          value={formData.color}
                          onValueChange={(value) => setFormData({ ...formData, color: value })}
                          className="flex-1"
                          startContent={<Palette className="w-4 h-4 text-default-400" />}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-default-600">预设颜色</p>
                        <div className="flex flex-wrap gap-2">
                          {presetColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => setFormData({ ...formData, color })}
                            />
                          ))}
                        </div>
                      </div>
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
                          {formData.isActive ? "标签将显示在网站上" : "标签将隐藏"}
                        </p>
                      </div>
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
                    {loading ? "创建中..." : "创建标签"}
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
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: formData.color || "#667eea" }}
                    >
                      <Hash className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{formData.name || "标签名称"}</div>
                      <div className="text-sm text-default-500">#{formData.slug || "标签标识"}</div>
                    </div>
                  </div>

                  {formData.description && <p className="text-sm text-default-600 mb-3">{formData.description}</p>}

                  <div className="flex items-center justify-center gap-2">
                    <Chip size="sm" color={formData.isActive ? "success" : "warning"} variant="flat">
                      {formData.isActive ? "激活" : "停用"}
                    </Chip>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-default-500">
                  <p>• 标签名称: {formData.name || "未设置"}</p>
                  <p>• 标签标识: {formData.slug || "将自动生成"}</p>
                  <p>• 标签颜色: {formData.color}</p>
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
