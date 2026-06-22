/**
 * 编辑标签页面
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Spinner, Switch, Textarea } from "@heroui/react";
import { ArrowLeft, Calendar, Eye, FileText, Hash, Palette, Save, Tag as TagIcon } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { message } from "@/lib/utils";
import { Locale } from "@/types";
import { ApiResponse, Tag, UpdateTagRequest } from "@/types/blog";

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

export default function EditTagPage() {
  const router = useRouter();
  const params = useParams<{ id: string; lang: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [pageLang, setPageLang] = useState<Locale>("zh-CN");
  const dict = useClientDictionary(pageLang);
  const t = dict?.tag as Record<string, string> | undefined;
  const te = (dict?.tag as { edit?: Record<string, string> } | undefined)?.edit;
  const c = dict?.common as Record<string, string> | undefined;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tag, setTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<UpdateTagRequest>({
    name: "",
    slug: "",
    description: "",
    color: "#667eea",
    isActive: true,
  });

  const fetchTag = useCallback(
    async (tagId: string) => {
      try {
        const response = await fetch(`/api/tags/${tagId}`);
        const result: ApiResponse<Tag> = await response.json();

        if (result.success && result.data) {
          setTag(result.data);
          setFormData({
            name: result.data.name,
            slug: result.data.slug,
            description: result.data.description || "",
            color: result.data.color || "#667eea",
            isActive: result.data.isActive,
          });
        } else {
          message.error(result.message || te!.fetchFailed);
          router.back();
        }
      } catch (error) {
        console.error("获取标签信息失败:", error);
        message.error(te!.fetchFailed);
        router.back();
      } finally {
        setLoading(false);
      }
    },
    [router, te?.fetchFailed]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      message.warning(t!.nameRequired);
      return;
    }

    if (!tag) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/tags/${tag.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        message.success(t!.tagUpdated);
        router.push(`/${pageLang}/tags/manage`);
        router.refresh();
      } else {
        message.error(result.message || te!.updateFailed);
      }
    } catch (error) {
      console.error("更新标签失败:", error);
      message.error(te!.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace(`/${params.lang}/auth/login`);
      return;
    }
    setPageLang(resolveLocale(params.lang));
    fetchTag(params.id);
  }, [isAuthLoading, isAuthenticated, params.lang, params.id, fetchTag, router]);

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

  if (loading || !t || !te || !c) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="text-center py-12">
        <TagIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-default-600 mb-2">{te.notFound}</h3>
        <p className="text-default-500 mb-4">{te.notFoundDesc}</p>
        <Button color="primary" onPress={() => router.back()}>
          {te.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="light" isIconOnly onPress={() => router.back()} className="hover:bg-default-100">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {te.title}
          </h1>
          <p className="text-default-600 mt-2 text-lg">
            {te.editingPrefix}
            {tag.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                <span className="text-lg font-semibold">{te.info}</span>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t.name}
                    placeholder={te.namePlaceholder}
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                    isRequired
                    description={te.nameDesc}
                    startContent={<Hash className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                  <Input
                    label={te.slugLabel}
                    placeholder={te.slugPlaceholder}
                    value={formData.slug}
                    onValueChange={(value) => setFormData({ ...formData, slug: value })}
                    description={te.slugDesc}
                    startContent={<TagIcon className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                </div>

                <Textarea
                  label={t.description}
                  placeholder={te.descriptionPlaceholder}
                  value={formData.description}
                  onValueChange={(value) => setFormData({ ...formData, description: value })}
                  description={te.descriptionDesc}
                  minRows={3}
                  startContent={<FileText className="w-4 h-4 text-default-400" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">{t.color}</label>
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
                        <p className="text-sm text-default-600">{te.presetColors}</p>
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
                        <p className="text-sm text-default-500">
                          {formData.isActive ? te.activeDesc : te.inactiveDesc}
                        </p>
                      </div>
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
                    startContent={<Save className="w-4 h-4" />}
                    isLoading={saving}
                    className="flex-1"
                  >
                    {saving ? t.saving : te.save}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="text-lg font-semibold">{te.preview}</span>
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
                      <div className="font-semibold text-foreground">{formData.name || t.name}</div>
                      <div className="text-sm text-default-500">#{formData.slug || t.slug}</div>
                    </div>
                  </div>

                  {formData.description && <p className="text-sm text-default-600 mb-3">{formData.description}</p>}

                  <div className="flex items-center justify-center gap-2">
                    <Chip size="sm" color={formData.isActive ? "success" : "warning"} variant="flat">
                      {formData.isActive ? t.active : t.inactive}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-semibold">{te.details}</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-default-500">{te.tagId}</span>
                  <span className="font-medium">#{tag.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{te.createdAt}</span>
                  <span className="font-medium">{new Date(tag.createdAt).toLocaleDateString(pageLang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{te.updatedAt}</span>
                  <span className="font-medium">{new Date(tag.updatedAt).toLocaleDateString(pageLang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{t.postCount}</span>
                  <span className="font-medium">
                    {(tag as Tag & { postCount?: number }).postCount || 0} {te.postUnit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">{te.currentStatus}</span>
                  <Chip size="sm" color={tag.isActive ? "success" : "warning"} variant="flat">
                    {tag.isActive ? t.active : t.inactive}
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
