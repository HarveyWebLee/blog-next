"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
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
  Lock,
  MessageSquare,
  Save,
  Settings,
  Sparkles,
  Tag as TagIcon,
  Type,
} from "lucide-react";

import { FeaturedImageUpload } from "@/components/blog/featured-image-upload";
import SimpleEditor from "@/components/blog/simple-editor";
import { CategoryTreeSelect } from "@/components/ui/category-tree-select";
import { useAuth } from "@/lib/contexts/auth-context";
import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { useCategories } from "@/lib/hooks/useCategories";
import { useTags } from "@/lib/hooks/useTags";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import { message } from "@/lib/utils";
import { isInMemorySuperRootClientUser } from "@/lib/utils/authz";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import {
  Category,
  PostData,
  PostManageDetailData,
  PostStatus,
  PostVisibility,
  Tag,
  UpdatePostRequest,
} from "@/types/blog";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "zh-CN";
  const dict = useClientDictionary(lang);
  const t = pickText((dict as { blog?: { manageEdit?: Record<string, string> } })?.blog?.manageEdit);

  const postId = params.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [post, setPost] = useState<PostManageDetailData | null>(null);

  // 获取分类和标签数据
  const { categories } = useCategories({ autoFetch: true });
  const { tags, loading: tagsLoading, fetchTags } = useTags({ autoFetch: true });
  const selectableCategories = useMemo(() => categories.filter((category) => category.isActive), [categories]);

  // 标签颜色标准化：确保渲染时得到合法的 hex 颜色值
  const resolveTagColor = (tag: Tag) => {
    if (!tag.color) return "#64748b";
    const trimmed = tag.color.trim();
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  };

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

  // 获取博客数据：登录后拉取。普通用户需是作者本人；超级管理员允许管理任意文章。
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !user) {
      router.replace(`/${lang}/auth/login`);
      return;
    }
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setForbidden(false);
        const response = await fetch(`/api/posts/${postId}`);
        const result = await response.json();

        if (result.success) {
          const postData = result.data as PostManageDetailData;
          const isSuperAdmin = isInMemorySuperRootClientUser(user);
          if (!isSuperAdmin && postData.posts.authorId !== user.id) {
            setForbidden(true);
            setPost(null);
            return;
          }
          setPost(postData);
          setFormData({
            title: postData.posts.title || "",
            slug: postData.posts.slug || "",
            excerpt: postData.posts.excerpt || "",
            content: postData.posts.content || "",
            featuredImage: postData.posts.featuredImage || "",
            categoryId: postData.posts.categoryId ?? undefined,
            status: postData.posts.status || "draft",
            visibility: postData.posts.visibility || "public",
            password: postData.posts.password || "",
            allowComments: postData.posts.allowComments ?? true,
            tagIds: postData.tags?.map((tag: { id: number }) => tag.id) || [],
          });
        } else {
          message.error(t.fetchFailed);
          router.push(`/${lang}/blog/manage`);
        }
      } catch (error) {
        console.error("获取博客数据失败:", error);
        message.error(t.fetchFailed);
        router.push(`/${lang}/blog/manage`);
      } finally {
        setLoading(false);
      }
    };

    void fetchPost();
  }, [postId, router, lang, t.fetchFailed, isAuthLoading, isAuthenticated, user]);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchTags({
      page: 1,
      limit: 200,
      isActive: true,
      sortBy: "sortOrder",
      sortOrder: "asc",
    });
  }, [fetchTags, isAuthenticated]);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim() || !formData.content?.trim()) {
      message.warning(t.fillRequired);
      return;
    }
    if (formData.visibility === "password" && !formData.password?.trim()) {
      message.warning(t.passwordRequired);
      return;
    }

    try {
      setSaving(true);

      const payload = await sealPasswordInRequestBody(
        { ...(formData as unknown as Record<string, unknown>) },
        formData.password || "",
        "password"
      );

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...clientBearerHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        message.success(t.updateSuccess);
        router.push(`/${lang}/blog/manage`);
      } else {
        message.error(`${t.updateFailed}: ${result.message}`);
      }
    } catch (error) {
      console.error("更新博客失败:", error);
      message.error(t.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  if (isAuthLoading) {
    return (
      <Card className="shadow-lg border-0">
        <CardBody className="text-center py-16">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-default-500 text-lg">{t.loading}</p>
        </CardBody>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardBody className="text-center py-16">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-default-500 text-lg">{t.loading}</p>
        </CardBody>
      </Card>
    );
  }

  if (forbidden) {
    return (
      <Card className="shadow-lg border-0">
        <CardBody className="text-center py-16">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-warning-100">
            <Lock className="h-12 w-12 text-warning" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">{t.noPermission}</h3>
          <p className="mb-6 text-default-500">{t.noPermissionDesc}</p>
          <Button
            onPress={() => router.push(`/${lang}/blog/manage`)}
            color="primary"
            size="lg"
            startContent={<ArrowLeft className="h-4 w-4" />}
          >
            {t.backManage}
          </Button>
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
          <h3 className="text-xl font-semibold mb-2">{t.notFound}</h3>
          <p className="text-default-500 mb-6">{t.notFoundDesc}</p>
          <Button
            onPress={() => router.push(`/${lang}/blog/manage`)}
            color="primary"
            size="lg"
            startContent={<ArrowLeft className="w-4 h-4" />}
          >
            {t.backManage}
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
            {t.back}
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t.editTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Chip color="secondary" variant="flat" size="lg" startContent={<Edit3 className="w-4 h-4" />}>
            {t.editMode}
          </Chip>
          <Chip color="default" variant="flat" size="lg" startContent={<Clock className="w-4 h-4" />}>
            {t.lastUpdated} {new Date(post.posts.updatedAt).toLocaleDateString(lang)}
          </Chip>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息（含分类、标签，单卡片更紧凑） */}
        <Card className="shadow-md border border-default-200/70 bg-default-50/75 backdrop-blur-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-white/[0.05] dark:via-white/[0.02] dark:to-primary-500/[0.07]">
          <CardHeader className="gap-0 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-tight">{t.basicInfo}</h3>
                <p className="text-default-500 text-xs">{t.basicInfoDesc}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="gap-0 space-y-4 pt-0">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1">
                <Input
                  label={t.title}
                  placeholder={t.titlePlaceholder}
                  value={formData.title}
                  onValueChange={handleTitleChange}
                  variant="bordered"
                  size="md"
                  isRequired
                  startContent={<Type className="h-4 w-4 text-default-400" />}
                  className="w-full"
                />
                <p className="text-xs text-default-400">{t.titleHint}</p>
              </div>

              <div className="space-y-1">
                <Input
                  label={t.slug}
                  placeholder={t.slugPlaceholder}
                  value={formData.slug}
                  onValueChange={(value: string) => handleInputChange("slug", value)}
                  variant="bordered"
                  size="md"
                  className="w-full"
                />
                <p className="text-xs text-default-400">{t.slugHint}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Textarea
                label={t.excerpt}
                placeholder={t.excerptPlaceholder}
                value={formData.excerpt}
                onValueChange={(value: string) => handleInputChange("excerpt", value)}
                variant="bordered"
                size="md"
                minRows={3}
                className="w-full"
              />
              <p className="text-xs text-default-400">{t.excerptHint}</p>
            </div>

            <FeaturedImageUpload
              scope="article"
              value={formData.featuredImage ?? ""}
              onChange={(url) => handleInputChange("featuredImage", url)}
              labels={{
                title: t.featuredImage,
                hint: t.featuredImageHint,
                emptyDropHint: t.featuredImageEmptyDrop,
                uploadButton: t.featuredImageBtnUpload,
                removeButton: t.featuredImageBtnRemove,
                uploading: t.featuredImageUploading,
                needLogin: t.featuredImageNeedLogin,
                uploadFailed: t.featuredImageUploadFailed,
              }}
            />

            <Divider className="my-1" />

            {/* 分类 + 标签：窄屏上下；md+ 同行且两列等宽（grid 1fr 1fr） */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Folder className="h-4 w-4 shrink-0 text-success" />
                <span className="text-sm font-medium text-foreground">{t.categoryTag}</span>
                <span className="text-xs text-default-400">{t.categoryTagDesc}</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start md:gap-x-0">
                <div className="min-w-0 space-y-1 md:border-r md:border-default-200 md:pr-5 lg:pr-6 dark:md:border-default-100/15">
                  <CategoryTreeSelect
                    label={t.selectCategory}
                    placeholder={t.selectCategoryPlaceholder}
                    noneLabel={t.selectCategoryPlaceholder}
                    categories={selectableCategories}
                    value={formData.categoryId}
                    onChange={(categoryId) => handleInputChange("categoryId", categoryId)}
                  />
                  <p className="text-xs text-default-400">{t.selectCategoryHint}</p>
                </div>

                <div className="min-w-0 space-y-2 border-t border-default-200 pt-3 md:border-t-0 md:pl-5 md:pt-0 lg:pl-6 dark:border-default-100/15">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 shrink-0 text-default-400" />
                    <span className="text-sm font-medium">{t.selectTags}</span>
                    {tagsLoading && <Spinner size="sm" />}
                  </div>

                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Chip
                          key={tag.id}
                          size="sm"
                          variant={formData.tagIds?.includes(tag.id) ? "solid" : "bordered"}
                          className="cursor-pointer border transition-transform hover:scale-[1.02]"
                          style={{
                            borderColor: resolveTagColor(tag),
                            backgroundColor: formData.tagIds?.includes(tag.id)
                              ? `${resolveTagColor(tag)}22`
                              : "transparent",
                            color: resolveTagColor(tag),
                          }}
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-default-400">{t.noTags}</p>
                  )}
                  <p className="text-xs text-default-400">{t.tagsHint}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <SimpleEditor
          value={formData.content}
          onChange={(content: string) => handleInputChange("content", content)}
          placeholder={t.editorPlaceholder}
          height="520px"
        />

        {/* 发布设置 */}
        <Card className="shadow-md border border-default-200/70 bg-gradient-to-r from-warning-50/95 to-success-50/95 backdrop-blur-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-white/[0.045] dark:via-amber-500/[0.035] dark:to-emerald-500/[0.06]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Settings className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t.publishSettings}</h3>
                <p className="text-default-500">{t.publishSettingsDesc}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Select
                  label={t.publishStatus}
                  aria-label={t.publishStatus || t.publishStatusPlaceholder || "publish status"}
                  labelPlacement="outside"
                  placeholder={t.publishStatusPlaceholder}
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
                  <SelectItem
                    key="draft"
                    textValue={t.statusDraft ?? "draft"}
                    startContent={<FileText className="w-4 h-4" />}
                  >
                    {t.statusDraft}
                  </SelectItem>
                  <SelectItem
                    key="published"
                    textValue={t.statusPublished ?? "published"}
                    startContent={<Sparkles className="w-4 h-4" />}
                  >
                    {t.statusPublished}
                  </SelectItem>
                  <SelectItem
                    key="archived"
                    textValue={t.statusArchived ?? "archived"}
                    startContent={<FileText className="w-4 h-4" />}
                  >
                    {t.statusArchived}
                  </SelectItem>
                </Select>
                <p className="text-xs text-default-400">{t.publishStatusHint}</p>
              </div>

              <div className="space-y-2">
                <Select
                  label={t.visibility}
                  aria-label={t.visibility || t.visibilityPlaceholder || "visibility"}
                  labelPlacement="outside"
                  placeholder={t.visibilityPlaceholder}
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
                  <SelectItem
                    key="public"
                    textValue={t.visibilityPublic ?? "public"}
                    startContent={<Eye className="w-4 h-4" />}
                  >
                    {t.visibilityPublic}
                  </SelectItem>
                  <SelectItem
                    key="private"
                    textValue={t.visibilityPrivate ?? "private"}
                    startContent={<EyeOff className="w-4 h-4" />}
                  >
                    {t.visibilityPrivate}
                  </SelectItem>
                  <SelectItem
                    key="password"
                    textValue={t.visibilityPassword ?? "password"}
                    startContent={<Lock className="w-4 h-4" />}
                  >
                    {t.visibilityPassword}
                  </SelectItem>
                </Select>
                <p className="text-xs text-default-400">{t.visibilityHint}</p>
              </div>
            </div>

            {formData.visibility === "password" && (
              <div className="space-y-2">
                <Input
                  label={t.password}
                  placeholder={t.passwordPlaceholder}
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
                <p className="text-xs text-default-400">{t.passwordHint}</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg bg-default-50 p-4 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-default-500" />
                <div>
                  <p className="font-medium">{t.allowComments}</p>
                  <p className="text-sm text-default-500">{t.allowCommentsHint}</p>
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
                <span>
                  {t.savedAt} {new Date().toLocaleTimeString(lang)}
                </span>
              </div>

              <div className="flex gap-4">
                <Button variant="bordered" size="lg" onPress={() => router.back()} className="min-w-24">
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={saving}
                  startContent={!saving && <Save className="w-5 h-5" />}
                  className="min-w-32 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {saving ? t.saving : t.save}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </form>
    </>
  );
}
