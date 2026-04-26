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
import { useCategories } from "@/lib/hooks/useCategories";
import { useTags } from "@/lib/hooks/useTags";
import { generateRandomUrlAlias, message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { Category, CreatePostRequest, PostStatus, PostVisibility, Tag } from "@/types/blog";

export default function CreateBlogPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/${lang}/auth/login`);
    }
  }, [isAuthLoading, isAuthenticated, router, lang]);
  const t =
    lang === "en-US"
      ? {
          back: "Back",
          createTitle: "Create New Post",
          createDesc: "Create great content and share your ideas with the world",
          createMode: "Create Mode",
          fillRequired: "Please fill title and content",
          passwordRequired: "Access password is required for password-protected posts",
          created: "Post created!",
          createFailed: "Create failed",
          creating: "Creating...",
          create: "Create Post",
          cancel: "Cancel",
          basicInfo: "Basic Information",
          basicInfoDesc: "Fill in the basic information of the post",
          title: "Title",
          titlePlaceholder: "Enter an engaging post title",
          titleHint: "Title is separate from the URL slug; you can edit the slug anytime",
          slug: "URL Slug",
          slugPlaceholder: "8-char code by default; edit as you like",
          slugHint: "Random A–Z / a–z / 0–9 code by default; used in post URLs",
          excerpt: "Excerpt",
          excerptPlaceholder: "Write an engaging excerpt to introduce your content...",
          excerptHint: "Shown in post list and search results",
          featuredImage: "Featured Image",
          featuredImageHint: "Upload JPG, PNG, GIF or WebP; recommended size 1200×630.",
          featuredImageEmptyDrop: "Click to choose or drag an image here",
          featuredImageBtnUpload: "Upload image",
          featuredImageBtnRemove: "Remove",
          featuredImageUploading: "Uploading...",
          featuredImageNeedLogin: "Please sign in to upload images",
          featuredImageUploadFailed: "Upload failed",
          categoryTag: "Category & Tags",
          categoryTagDesc: "Choose suitable category and tags",
          selectCategory: "Select Category",
          selectCategoryPlaceholder: "Choose a category",
          selectCategoryHint: "Help readers find your post",
          selectTags: "Select Tags",
          noTags: "No tags available",
          tagsHint: "Click tags to select, multiple selection supported",
          publishSettings: "Publish Settings",
          publishSettingsDesc: "Configure post status and visibility",
          publishStatus: "Publish Status",
          publishStatusPlaceholder: "Select publish status",
          statusDraft: "Draft",
          statusPublished: "Published",
          statusArchived: "Archived",
          publishStatusHint: "Draft is not public. Published posts are visible to readers.",
          visibility: "Visibility",
          visibilityPlaceholder: "Select visibility",
          visibilityPublic: "Public",
          visibilityPrivate: "Private",
          visibilityPassword: "Password Protected",
          visibilityHint: "Control who can access your post",
          password: "Access Password",
          passwordPlaceholder: "Set access password",
          passwordHint: "Visitors must enter the password to view the post",
          allowComments: "Allow Comments",
          allowCommentsHint: "Readers can comment on this post",
          actionHint: "You can edit and update it anytime after creation",
        }
      : lang === "ja-JP"
        ? {
            back: "戻る",
            createTitle: "新しい記事を作成",
            createDesc: "素晴らしいコンテンツを作り、世界にアイデアを共有しましょう",
            createMode: "作成モード",
            fillRequired: "タイトルと内容を入力してください",
            passwordRequired: "パスワード保護の記事ではアクセスパスワードが必須です",
            created: "記事を作成しました！",
            createFailed: "作成に失敗しました",
            creating: "作成中...",
            create: "記事作成",
            cancel: "キャンセル",
            basicInfo: "基本情報",
            basicInfoDesc: "記事の基本情報を入力してください",
            title: "タイトル",
            titlePlaceholder: "魅力的な記事タイトルを入力",
            titleHint: "タイトルとURLスラッグは独立しています。スラッグはいつでも編集できます",
            slug: "URLスラッグ",
            slugPlaceholder: "既定は8文字のランダムコード（編集可）",
            slugHint: "既定は英大文字・小文字・数字のランダム8文字。記事URLに使われます",
            excerpt: "概要",
            excerptPlaceholder: "読者に内容を伝える魅力的な概要を書いてください...",
            excerptHint: "記事一覧と検索結果に表示されます",
            featuredImage: "アイキャッチ画像",
            featuredImageHint: "JPG / PNG / GIF / WebP をアップロード。推奨サイズ 1200×630。",
            featuredImageEmptyDrop: "クリックで選ぶか、ここに画像をドラッグ",
            featuredImageBtnUpload: "画像をアップロード",
            featuredImageBtnRemove: "削除",
            featuredImageUploading: "アップロード中...",
            featuredImageNeedLogin: "アップロードするにはログインしてください",
            featuredImageUploadFailed: "アップロードに失敗しました",
            categoryTag: "カテゴリとタグ",
            categoryTagDesc: "適切なカテゴリとタグを選択",
            selectCategory: "カテゴリを選択",
            selectCategoryPlaceholder: "カテゴリを選択",
            selectCategoryHint: "読者が記事を見つけやすくなります",
            selectTags: "タグを選択",
            noTags: "利用可能なタグがありません",
            tagsHint: "タグをクリックして複数選択できます",
            publishSettings: "公開設定",
            publishSettingsDesc: "記事の公開状態と可視性を設定",
            publishStatus: "公開状態",
            publishStatusPlaceholder: "公開状態を選択",
            statusDraft: "下書き",
            statusPublished: "公開",
            statusArchived: "アーカイブ",
            publishStatusHint: "下書きは非公開です。公開後に読者が閲覧できます。",
            visibility: "可視性",
            visibilityPlaceholder: "可視性を選択",
            visibilityPublic: "公開",
            visibilityPrivate: "非公開",
            visibilityPassword: "パスワード保護",
            visibilityHint: "誰が記事を閲覧できるかを制御します",
            password: "アクセスパスワード",
            passwordPlaceholder: "アクセスパスワードを設定",
            passwordHint: "閲覧にはパスワード入力が必要です",
            allowComments: "コメントを許可",
            allowCommentsHint: "読者がこの記事にコメントできます",
            actionHint: "作成後いつでも編集できます",
          }
        : {
            back: "返回",
            createTitle: "创建新博客",
            createDesc: "创作您的精彩内容，与世界分享您的想法",
            createMode: "创作模式",
            fillRequired: "请填写标题和内容",
            passwordRequired: "当可见性为密码保护时，访问密码为必填项",
            created: "博客创建成功！",
            createFailed: "创建失败",
            creating: "创建中...",
            create: "创建博客",
            cancel: "取消",
            basicInfo: "基本信息",
            basicInfoDesc: "填写博客的基本信息",
            title: "标题",
            titlePlaceholder: "输入吸引人的博客标题",
            titleHint: "标题与 URL 别名独立，可随时修改别名",
            slug: "URL别名",
            slugPlaceholder: "默认 8 位随机码，可手动修改",
            slugHint: "默认随机生成 8 位英文大小写与数字，用于文章链接",
            excerpt: "摘要",
            excerptPlaceholder: "写一段吸引人的摘要，让读者了解文章内容...",
            excerptHint: "摘要将显示在博客列表和搜索结果中",
            featuredImage: "特色图片",
            featuredImageHint: "请上传 JPG、PNG、GIF 或 WebP；建议尺寸 1200×630。",
            featuredImageEmptyDrop: "点击选择或将图片拖拽到此处",
            featuredImageBtnUpload: "上传图片",
            featuredImageBtnRemove: "移除图片",
            featuredImageUploading: "上传中...",
            featuredImageNeedLogin: "请先登录后再上传图片",
            featuredImageUploadFailed: "上传失败",
            categoryTag: "分类和标签",
            categoryTagDesc: "为您的博客选择合适的分类和标签",
            selectCategory: "选择分类",
            selectCategoryPlaceholder: "选择一个分类",
            selectCategoryHint: "选择最适合的分类，帮助读者找到您的文章",
            selectTags: "选择标签",
            noTags: "暂无可用标签",
            tagsHint: "点击标签进行选择，可以多选",
            publishSettings: "发布设置",
            publishSettingsDesc: "配置博客的发布状态和可见性",
            publishStatus: "发布状态",
            publishStatusPlaceholder: "选择发布状态",
            statusDraft: "草稿",
            statusPublished: "发布",
            statusArchived: "归档",
            publishStatusHint: "草稿不会公开显示，发布后读者可以访问",
            visibility: "可见性",
            visibilityPlaceholder: "选择可见性",
            visibilityPublic: "公开",
            visibilityPrivate: "私有",
            visibilityPassword: "密码保护",
            visibilityHint: "控制谁可以访问您的博客",
            password: "访问密码",
            passwordPlaceholder: "设置访问密码",
            passwordHint: "设置密码后，访问者需要输入密码才能查看博客",
            allowComments: "允许评论",
            allowCommentsHint: "读者可以对此博客发表评论",
            actionHint: "创建后可以随时编辑和修改",
          };
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  /** 新建文章：默认生成 8 位随机 URL 别名（英大小写+数字），用户可在输入框中修改 */
  const [formData, setFormData] = useState<CreatePostRequest>(() => ({
    title: "",
    slug: generateRandomUrlAlias(8),
    excerpt: "",
    content: "",
    featuredImage: "",
    categoryId: undefined,
    status: "draft",
    visibility: "public",
    password: "",
    allowComments: true,
    tagIds: [],
  }));

  // 处理表单输入变化
  const handleInputChange = (field: keyof CreatePostRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

    if (!formData.title.trim() || !formData.content.trim()) {
      message.warning(t.fillRequired);
      return;
    }
    if (formData.visibility === "password" && !formData.password?.trim()) {
      message.warning(t.passwordRequired);
      return;
    }

    try {
      setLoading(true);

      const payload = await sealPasswordInRequestBody(
        { ...(formData as unknown as Record<string, unknown>) },
        formData.password || "",
        "password"
      );

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...clientBearerHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        message.success(t.created);
        router.push(`/${lang}/blog/manage`);
      } else {
        message.error(`${t.createFailed}: ${result.message}`);
      }
    } catch (error) {
      console.error("创建博客失败:", error);
      message.error(t.createFailed);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
              {t.createTitle}
            </h1>
            <p className="text-default-500 text-lg mt-2">{t.createDesc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Chip color="primary" variant="flat" size="lg" startContent={<Sparkles className="w-4 h-4" />}>
            {t.createMode}
          </Chip>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息（含分类、标签） */}
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
                  onValueChange={(title: string) => handleInputChange("title", title)}
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

            {/* 分类 + 标签：窄屏上下；md+ 同行且两列等宽 */}
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

        {/* 新建文章：编辑区不设占位提示，避免每次先删默认文案 */}
        <SimpleEditor
          value={formData.content}
          onChange={(content: string) => handleInputChange("content", content)}
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
                  <SelectItem key="draft" startContent={<FileText className="w-4 h-4" />}>
                    {t.statusDraft}
                  </SelectItem>
                  <SelectItem key="published" startContent={<Sparkles className="w-4 h-4" />}>
                    {t.statusPublished}
                  </SelectItem>
                  <SelectItem key="archived" startContent={<FileText className="w-4 h-4" />}>
                    {t.statusArchived}
                  </SelectItem>
                </Select>
                <p className="text-xs text-default-400">{t.publishStatusHint}</p>
              </div>

              <div className="space-y-2">
                <Select
                  label={t.visibility}
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
                  <SelectItem key="public" startContent={<Eye className="w-4 h-4" />}>
                    {t.visibilityPublic}
                  </SelectItem>
                  <SelectItem key="private" startContent={<EyeOff className="w-4 h-4" />}>
                    {t.visibilityPrivate}
                  </SelectItem>
                  <SelectItem key="password" startContent={<Lock className="w-4 h-4" />}>
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
                <FileText className="w-4 h-4" />
                <span>{t.actionHint}</span>
              </div>

              <div className="flex gap-4">
                <Button variant="bordered" size="lg" onPress={() => router.back()} className="min-w-24">
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={loading}
                  startContent={!loading && <Save className="w-5 h-5" />}
                  className="min-w-32 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? t.creating : t.create}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </form>
    </>
  );
}
