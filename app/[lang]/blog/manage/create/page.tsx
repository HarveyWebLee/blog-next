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
import { Category, CreatePostRequest, PostStatus, PostVisibility, Tag } from "@/types/blog";

export default function CreateBlogPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          back: "Back",
          createTitle: "Create New Post",
          createDesc: "Create great content and share your ideas with the world",
          createMode: "Create Mode",
          fillRequired: "Please fill title and content",
          created: "Post created!",
          createFailed: "Create failed",
          creating: "Creating...",
          create: "Create Post",
          cancel: "Cancel",
          basicInfo: "Basic Information",
          basicInfoDesc: "Fill in the basic information of the post",
          title: "Title",
          titlePlaceholder: "Enter an engaging post title",
          titleHint: "The title will auto-generate a URL slug",
          slug: "URL Slug",
          slugPlaceholder: "Auto-generate or enter manually",
          slugHint: "Used to build post links",
          excerpt: "Excerpt",
          excerptPlaceholder: "Write an engaging excerpt to introduce your content...",
          excerptHint: "Shown in post list and search results",
          featuredImage: "Featured Image",
          featuredImagePlaceholder: "Enter image URL",
          featuredImageHint: "Recommended size: 1200x630",
          categoryTag: "Category & Tags",
          categoryTagDesc: "Choose suitable category and tags",
          selectCategory: "Select Category",
          selectCategoryPlaceholder: "Choose a category",
          selectCategoryHint: "Help readers find your post",
          selectTags: "Select Tags",
          noTags: "No tags available",
          tagsHint: "Click tags to select, multiple selection supported",
          editorPlaceholder: "Start writing your post... Markdown is supported",
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
            created: "記事を作成しました！",
            createFailed: "作成に失敗しました",
            creating: "作成中...",
            create: "記事作成",
            cancel: "キャンセル",
            basicInfo: "基本情報",
            basicInfoDesc: "記事の基本情報を入力してください",
            title: "タイトル",
            titlePlaceholder: "魅力的な記事タイトルを入力",
            titleHint: "タイトルからURLスラッグを自動生成します",
            slug: "URLスラッグ",
            slugPlaceholder: "自動生成または手動入力",
            slugHint: "記事リンクの生成に使用します",
            excerpt: "概要",
            excerptPlaceholder: "読者に内容を伝える魅力的な概要を書いてください...",
            excerptHint: "記事一覧と検索結果に表示されます",
            featuredImage: "アイキャッチ画像",
            featuredImagePlaceholder: "画像URLを入力",
            featuredImageHint: "推奨サイズ: 1200x630",
            categoryTag: "カテゴリとタグ",
            categoryTagDesc: "適切なカテゴリとタグを選択",
            selectCategory: "カテゴリを選択",
            selectCategoryPlaceholder: "カテゴリを選択",
            selectCategoryHint: "読者が記事を見つけやすくなります",
            selectTags: "タグを選択",
            noTags: "利用可能なタグがありません",
            tagsHint: "タグをクリックして複数選択できます",
            editorPlaceholder: "記事を書き始めましょう... Markdown対応",
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
            created: "博客创建成功！",
            createFailed: "创建失败",
            creating: "创建中...",
            create: "创建博客",
            cancel: "取消",
            basicInfo: "基本信息",
            basicInfoDesc: "填写博客的基本信息",
            title: "标题",
            titlePlaceholder: "输入吸引人的博客标题",
            titleHint: "标题将自动生成URL别名",
            slug: "URL别名",
            slugPlaceholder: "自动生成或手动输入",
            slugHint: "用于生成博客链接",
            excerpt: "摘要",
            excerptPlaceholder: "写一段吸引人的摘要，让读者了解文章内容...",
            excerptHint: "摘要将显示在博客列表和搜索结果中",
            featuredImage: "特色图片",
            featuredImagePlaceholder: "输入图片链接地址",
            featuredImageHint: "建议尺寸：1200x630",
            categoryTag: "分类和标签",
            categoryTagDesc: "为您的博客选择合适的分类和标签",
            selectCategory: "选择分类",
            selectCategoryPlaceholder: "选择一个分类",
            selectCategoryHint: "选择最适合的分类，帮助读者找到您的文章",
            selectTags: "选择标签",
            noTags: "暂无可用标签",
            tagsHint: "点击标签进行选择，可以多选",
            editorPlaceholder: "开始编写您的博客内容...支持Markdown格式",
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
  const { categories, loading: categoriesLoading } = useCategories({ autoFetch: true });
  const { tags, loading: tagsLoading, fetchTags } = useTags({ autoFetch: true });

  const [formData, setFormData] = useState<CreatePostRequest>({
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

  // 处理表单输入变化
  const handleInputChange = (field: keyof CreatePostRequest, value: any) => {
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

    if (!formData.title.trim() || !formData.content.trim()) {
      message.warning(t.fillRequired);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t.basicInfo}</h3>
                <p className="text-default-500">{t.basicInfoDesc}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Input
                  label={t.title}
                  placeholder={t.titlePlaceholder}
                  value={formData.title}
                  onValueChange={handleTitleChange}
                  variant="bordered"
                  size="lg"
                  isRequired
                  startContent={<Type className="w-4 h-4 text-default-400" />}
                  className="w-full"
                />
                <p className="text-xs text-default-400">{t.titleHint}</p>
              </div>

              <div className="space-y-2">
                <Input
                  label={t.slug}
                  placeholder={t.slugPlaceholder}
                  value={formData.slug}
                  onValueChange={(value: string) => handleInputChange("slug", value)}
                  variant="bordered"
                  size="lg"
                  className="w-full"
                />
                <p className="text-xs text-default-400">{t.slugHint}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Textarea
                label={t.excerpt}
                placeholder={t.excerptPlaceholder}
                value={formData.excerpt}
                onValueChange={(value: string) => handleInputChange("excerpt", value)}
                variant="bordered"
                size="lg"
                minRows={4}
                className="w-full"
              />
              <p className="text-xs text-default-400">{t.excerptHint}</p>
            </div>

            <div className="space-y-2">
              <Input
                label={t.featuredImage}
                placeholder={t.featuredImagePlaceholder}
                value={formData.featuredImage}
                onValueChange={(value: string) => handleInputChange("featuredImage", value)}
                variant="bordered"
                size="lg"
                type="url"
                startContent={<ImageIcon className="w-4 h-4 text-default-400" />}
                className="w-full"
              />
              <p className="text-xs text-default-400">{t.featuredImageHint}</p>
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
                <h3 className="text-xl font-semibold">{t.categoryTag}</h3>
                <p className="text-default-500">{t.categoryTagDesc}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0 space-y-6">
            <div className="space-y-2">
              <Select
                label={t.selectCategory}
                placeholder={t.selectCategoryPlaceholder}
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
              <p className="text-xs text-default-400">{t.selectCategoryHint}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-default-400" />
                <span className="text-sm font-medium">{t.selectTags}</span>
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
                <p className="text-sm text-default-400">{t.noTags}</p>
              )}
              <p className="text-xs text-default-400">{t.tagsHint}</p>
            </div>
          </CardBody>
        </Card>

        {/* 内容编辑 - 使用高级编辑器 */}
        <SimpleEditor
          value={formData.content}
          onChange={(content: string) => handleInputChange("content", content)}
          placeholder={t.editorPlaceholder}
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

            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
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
