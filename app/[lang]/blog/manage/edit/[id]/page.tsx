"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Save,
  Settings,
  Sparkles,
  Tag as TagIcon,
  Type,
} from "lucide-react";

import SimpleEditor from "@/components/blog/simple-editor";
import { useCategories } from "@/lib/hooks/useCategories";
import { useTags } from "@/lib/hooks/useTags";
import { message } from "@/lib/utils";
import { Category, PostData, PostStatus, PostVisibility, Tag, UpdatePostRequest } from "@/types/blog";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [post, setPost] = useState<PostData | null>(null);

  // 获取分类和标签数据
  const { categories, loading: categoriesLoading } = useCategories({ autoFetch: true });
  const { tags, loading: tagsLoading, fetchTags } = useTags({ autoFetch: true });

  const [formData, setFormData] = useState<UpdatePostRequest>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    categoryId: undefined,
    status: "draft",
    visibility: "public",
    password: "",
    allowComments: true,
    tagIds: [],
  });

  // 获取博客数据
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}`);
        const result = await response.json();

        if (result.success) {
          const postData = result.data;
          setPost(postData);
          setFormData({
            title: postData.posts.title || "",
            slug: postData.posts.slug || "",
            excerpt: postData.posts.excerpt || "",
            content: postData.posts.content || "",
            featuredImage: postData.posts.featuredImage || "",
            categoryId: postData.posts.categoryId,
            status: postData.posts.status || "draft",
            visibility: postData.posts.visibility || "public",
            password: postData.posts.password || "",
            allowComments: postData.posts.allowComments ?? true,
            tagIds: postData.tags?.map((tag: any) => tag.id) || [],
          });
        } else {
          message.error("获取博客数据失败");
          router.push("/blog/manage");
        }
      } catch (error) {
        console.error("获取博客数据失败:", error);
        message.error("获取博客数据失败");
        router.push("/blog/manage");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, router]);

  // 处理表单输入变化
  const handleInputChange = (field: keyof UpdatePostRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 自动生成slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // 处理标题变化时自动生成slug
  const handleTitleChange = (title: string) => {
    handleInputChange("title", title);
    if (!formData.slug) {
      handleInputChange("slug", generateSlug(title));
    }
  };

  // 处理标签选择
  const handleTagToggle = (tagId: number) => {
    setFormData((prev) => {
      const currentTagIds = prev.tagIds || [];
      const newTagIds = currentTagIds.includes(tagId)
        ? currentTagIds.filter((id) => id !== tagId)
        : [...currentTagIds, tagId];
      return { ...prev, tagIds: newTagIds };
    });
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim() || !formData.content?.trim()) {
      message.warning("请填写标题和内容");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        message.success("博客更新成功！");
        router.push("/blog/manage");
      } else {
        message.error(`更新失败: ${result.message}`);
      }
    } catch (error) {
      console.error("更新博客失败:", error);
      message.error("更新博客失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardBody className="text-center py-16">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-default-500 text-lg">加载博客数据中...</p>
        </CardBody>
      </Card>
    );
  }

  if (!post) {
    return (
      <Card className="shadow-lg border-0">
        <CardBody className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-danger-100 flex items-center justify-center">
            <FileText className="w-12 h-12 text-danger" />
          </div>
          <h3 className="text-xl font-semibold mb-2">博客不存在</h3>
          <p className="text-default-500 mb-6">您要编辑的博客可能已被删除或不存在</p>
          <Button
            onPress={() => router.push("/blog/manage")}
            color="primary"
            size="lg"
            startContent={<ArrowLeft className="w-4 h-4" />}
          >
            返回管理页面
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* 页面标题和返回按钮 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="bordered"
            size="lg"
            onPress={() => router.back()}
            startContent={<ArrowLeft className="w-5 h-5" />}
            className="shadow-sm hover:shadow-md transition-all duration-300"
          >
            返回
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              编辑博客
            </h1>
            <p className="text-default-500 text-lg mt-2">编辑: {post.posts.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Chip color="secondary" variant="flat" size="lg" startContent={<Edit3 className="w-4 h-4" />}>
            编辑模式
          </Chip>
          <Chip color="default" variant="flat" size="lg" startContent={<Clock className="w-4 h-4" />}>
            最后更新: {new Date(post.posts.updatedAt).toLocaleDateString()}
          </Chip>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">基本信息</h3>
                <p className="text-default-500">编辑博客的基本信息</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Input
                  label="标题"
                  placeholder="输入吸引人的博客标题"
                  value={formData.title}
                  onValueChange={handleTitleChange}
                  variant="bordered"
                  size="lg"
                  isRequired
                  startContent={<Type className="w-4 h-4 text-default-400" />}
                  className="w-full"
                />
                <p className="text-xs text-default-400">标题将自动生成URL别名</p>
              </div>

              <div className="space-y-2">
                <Input
                  label="URL别名"
                  placeholder="自动生成或手动输入"
                  value={formData.slug}
                  onValueChange={(value: string) => handleInputChange("slug", value)}
                  variant="bordered"
                  size="lg"
                  className="w-full"
                />
                <p className="text-xs text-default-400">用于生成博客链接</p>
              </div>
            </div>

            <div className="space-y-2">
              <Textarea
                label="摘要"
                placeholder="写一段吸引人的摘要，让读者了解文章内容..."
                value={formData.excerpt}
                onValueChange={(value: string) => handleInputChange("excerpt", value)}
                variant="bordered"
                size="lg"
                minRows={4}
                className="w-full"
              />
              <p className="text-xs text-default-400">摘要将显示在博客列表和搜索结果中</p>
            </div>

            <div className="space-y-2">
              <Input
                label="特色图片"
                placeholder="输入图片链接地址"
                value={formData.featuredImage}
                onValueChange={(value: string) => handleInputChange("featuredImage", value)}
                variant="bordered"
                size="lg"
                type="url"
                startContent={<ImageIcon className="w-4 h-4 text-default-400" />}
                className="w-full"
              />
              <p className="text-xs text-default-400">建议使用高质量图片，尺寸推荐 1200x630</p>
            </div>
          </CardBody>
        </Card>

        {/* 分类和标签 */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-success-50 to-info-50 dark:from-success-900/20 dark:to-info-900/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Folder className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">分类和标签</h3>
                <p className="text-default-500">为您的博客选择合适的分类和标签</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-6">
            <div className="space-y-2">
              <Select
                label="选择分类"
                placeholder="选择一个分类"
                selectedKeys={formData.categoryId ? new Set([formData.categoryId.toString()]) : new Set()}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("categoryId", selectedKey ? parseInt(selectedKey) : undefined);
                }}
                variant="bordered"
                size="lg"
                startContent={<Folder className="w-4 h-4 text-default-400" />}
                className="w-full"
                isLoading={categoriesLoading}
              >
                {categories.map((category) => (
                  <SelectItem key={category.id.toString()}>{category.name}</SelectItem>
                ))}
              </Select>
              <p className="text-xs text-default-400">选择最适合的分类，帮助读者找到您的文章</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-default-400" />
                <span className="text-sm font-medium">选择标签</span>
                {tagsLoading && <Spinner size="sm" />}
              </div>

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      color={formData.tagIds?.includes(tag.id) ? "primary" : "default"}
                      variant={formData.tagIds?.includes(tag.id) ? "solid" : "bordered"}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-default-400">暂无可用标签</p>
              )}
              <p className="text-xs text-default-400">点击标签进行选择，可以多选</p>
            </div>
          </CardBody>
        </Card>

        {/* 内容编辑 - 使用高级编辑器 */}
        <SimpleEditor
          value={formData.content}
          onChange={(content: string) => handleInputChange("content", content)}
          placeholder="开始编写您的博客内容...支持Markdown格式"
          height="600px"
          onSave={() => {
            // 自动保存逻辑
            console.log("自动保存内容");
          }}
          autoSave={true}
          autoSaveInterval={30000}
        />

        {/* 发布设置 */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-warning-50 to-success-50 dark:from-warning-900/20 dark:to-success-900/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Settings className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">发布设置</h3>
                <p className="text-default-500">配置博客的发布状态和可见性</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Select
                  label="发布状态"
                  placeholder="选择发布状态"
                  selectedKeys={formData.status ? new Set([formData.status]) : new Set()}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleInputChange("status", selectedKey as PostStatus);
                  }}
                  variant="bordered"
                  size="lg"
                  startContent={<Calendar className="w-4 h-4 text-default-400" />}
                  className="w-full"
                >
                  <SelectItem key="draft" startContent={<FileText className="w-4 h-4" />}>
                    草稿
                  </SelectItem>
                  <SelectItem key="published" startContent={<Sparkles className="w-4 h-4" />}>
                    发布
                  </SelectItem>
                  <SelectItem key="archived" startContent={<FileText className="w-4 h-4" />}>
                    归档
                  </SelectItem>
                </Select>
                <p className="text-xs text-default-400">草稿不会公开显示，发布后读者可以访问</p>
              </div>

              <div className="space-y-2">
                <Select
                  label="可见性"
                  placeholder="选择可见性"
                  selectedKeys={formData.visibility ? new Set([formData.visibility]) : new Set()}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleInputChange("visibility", selectedKey as PostVisibility);
                  }}
                  variant="bordered"
                  size="lg"
                  startContent={<Lock className="w-4 h-4 text-default-400" />}
                  className="w-full"
                >
                  <SelectItem key="public" startContent={<Eye className="w-4 h-4" />}>
                    公开
                  </SelectItem>
                  <SelectItem key="private" startContent={<EyeOff className="w-4 h-4" />}>
                    私有
                  </SelectItem>
                  <SelectItem key="password" startContent={<Lock className="w-4 h-4" />}>
                    密码保护
                  </SelectItem>
                </Select>
                <p className="text-xs text-default-400">控制谁可以访问您的博客</p>
              </div>
            </div>

            {formData.visibility === "password" && (
              <div className="space-y-2">
                <Input
                  label="访问密码"
                  placeholder="设置访问密码"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onValueChange={(value: string) => handleInputChange("password", value)}
                  variant="bordered"
                  size="lg"
                  startContent={<Lock className="w-4 h-4 text-default-400" />}
                  endContent={
                    <Button isIconOnly variant="light" size="sm" onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  }
                  className="w-full"
                />
                <p className="text-xs text-default-400">设置密码后，访问者需要输入密码才能查看博客</p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-default-500" />
                <div>
                  <p className="font-medium">允许评论</p>
                  <p className="text-sm text-default-500">读者可以对此博客发表评论</p>
                </div>
              </div>
              <Switch
                isSelected={formData.allowComments}
                onValueChange={(checked) => handleInputChange("allowComments", checked)}
                size="lg"
              />
            </div>
          </CardBody>
        </Card>

        {/* 操作按钮 */}
        <Card className="shadow-lg border-0">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-default-500">
                <Clock className="w-4 h-4" />
                <span>最后保存: {new Date().toLocaleTimeString()}</span>
              </div>

              <div className="flex gap-4">
                <Button variant="bordered" size="lg" onPress={() => router.back()} className="min-w-24">
                  取消
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={saving}
                  startContent={!saving && <Save className="w-5 h-5" />}
                  className="min-w-32 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {saving ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </form>
    </>
  );
}
