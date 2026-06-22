/**
 * 创建标签页面
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Switch, Textarea } from "@heroui/react";
import { ArrowLeft, Eye, FileText, Hash, Palette, Plus, Tag as TagIcon } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { generateRandomUrlAlias, message } from "@/lib/utils";
import { ApiResponse, CreateTagRequest } from "@/types/blog";

export default function CreateTagPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const dict = useClientDictionary(params.lang);
  const t = dict?.tag as Record<string, string> | undefined;
  const tc = (dict?.tag as { create?: Record<string, string> } | undefined)?.create;
  const c = dict?.common as Record<string, string> | undefined;
  const [loading, setLoading] = useState(false);
  /** 创建标签：默认生成 8 位英文数字随机标识，用户可手动修改 */
  const [formData, setFormData] = useState<CreateTagRequest>({
    name: "",
    slug: generateRandomUrlAlias(8),
    description: "",
    color: "#667eea",
    isActive: true,
  });

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace(`/${params.lang}/auth/login`);
    }
  }, [isAuthLoading, isAuthenticated, params.lang, router]);

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      message.warning(t!.nameRequired);
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
          slug: formData.slug?.trim() || generateRandomUrlAlias(8),
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        message.success(t!.tagCreated);
        router.push(`/${params.lang}/tags/manage`);
        router.refresh();
      } else {
        message.error(result.message || tc!.createFailed);
      }
    } catch (error) {
      console.error("创建标签失败:", error);
      message.error(tc!.createFailed);
    } finally {
      setLoading(false);
    }
  };

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

  if (!t || !tc || !c) return null;

  return (
    <div className="space-y-6">
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
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
                    startContent={<Hash className="w-4 h-4 text-default-400" />}
                    className="w-full"
                  />
                  <Input
                    label={tc.slugLabel}
                    placeholder={tc.slugPlaceholder}
                    value={formData.slug}
                    onValueChange={(value) => setFormData({ ...formData, slug: value })}
                    description={tc.slugAuto}
                    startContent={<TagIcon className="w-4 h-4 text-default-400" />}
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
                        <p className="text-sm text-default-600">{tc.presetColors}</p>
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
                          {formData.isActive ? tc.activeDesc : tc.inactiveDesc}
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
                    startContent={<Plus className="w-4 h-4" />}
                    isLoading={loading}
                    className="flex-1"
                  >
                    {loading ? tc.creating : t.createTag}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

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

                <div className="space-y-2 text-sm text-default-500">
                  <p>
                    • {t.name}: {formData.name || tc.notSet}
                  </p>
                  <p>
                    • {t.slug}: {formData.slug || t.autoSlugGenerate}
                  </p>
                  <p>
                    • {t.color}: {formData.color}
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
