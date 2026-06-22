"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, CardBody, Input, Select, SelectItem, Switch } from "@heroui/react";
import { Bell, Github, Globe, Mail, MapPin, Phone, Save, Shield, User } from "lucide-react";

import { FeaturedImageUpload } from "@/components/blog/featured-image-upload";
import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
import { useProfileDict } from "@/lib/contexts/profile-dict-context";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import { message } from "@/lib/utils";
import { isValidEmailFormat } from "@/lib/utils/email-format";
import type { ApiResponse, UpdateProfileRequest, UserProfile } from "@/types/blog";

interface ProfileSettingsProps {
  lang: string;
}

/** 从接口拉取的个人资料 JSON 中安全读取对象字段 */
function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

/** 组装写入后端的 social_links，仅保留当前产品支持的键 */
function buildSocialLinksPayload(form: {
  github: string;
  wechatQr: string;
  douyin: string;
  bilibili: string;
}): Record<string, string> {
  return {
    github: form.github.trim(),
    wechatQr: form.wechatQr.trim(),
    douyin: form.douyin.trim(),
    bilibili: form.bilibili.trim(),
  };
}

/** 兼容历史 social_links 键名（wechat_qr / wechat 等） */
function readSocialString(sl: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = sl[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

export default function ProfileSettings({ lang }: ProfileSettingsProps) {
  // settings 词典含 profile/social/tabs 等嵌套结构，此处用宽松类型避免逐字段声明
  const t = pickText(useProfileDict("settings") as Record<string, unknown> | null) as Record<string, any>;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [sendingEmailCode, setSendingEmailCode] = useState(false);

  const [formData, setFormData] = useState({
    // 基本信息
    avatar: "",
    displayName: "",
    email: "",
    emailVerificationCode: "",
    firstName: "",
    lastName: "",
    phone: "",
    website: "",
    location: "",

    // 通知设置
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    commentNotifications: true,
    likeNotifications: true,
    followNotifications: true,

    // 隐私设置
    profileVisibility: "public",
    emailVisibility: "private",
    activityVisibility: "public",
    githubVisibility: "public",
    wechatQrVisibility: "private",
    statsVisibility: "public",
    recentActivityVisibility: "public",

    // 社交媒体（social_links JSON：github / wechatQr / douyin / bilibili）
    github: "",
    wechatQr: "",
    douyin: "",
    bilibili: "",
  });

  const { isAuthenticated, isLoading: authLoading, patchUser } = useAuth();

  /** 微信二维码上传组件文案（与 FeaturedImageUpload 约定一致） */
  const wechatQrUploadLabels = useMemo(() => {
    const u = t.uploadWechat ?? {};
    return {
      title: t.social?.wechatQr ?? "",
      hint: u.hint ?? "",
      emptyDropHint: u.emptyDropHint ?? "",
      uploadButton: u.uploadButton ?? "",
      removeButton: u.removeButton ?? "",
      uploading: u.uploading ?? "",
      needLogin: u.needLogin ?? "",
      uploadFailed: u.uploadFailed ?? "",
    };
  }, [t.social?.wechatQr, t.uploadWechat]);

  const applyProfileToForm = useCallback((data: UserProfile) => {
    const n = asRecord(data.notifications);
    const p = asRecord(data.privacy);
    const sl = asRecord(data.socialLinks);
    setFormData({
      email: data.email ?? "",
      avatar: data.avatar ?? "",
      displayName: data.displayName ?? "",
      emailVerificationCode: "",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      phone: data.phone ?? "",
      website: data.website ?? "",
      location: data.location ?? "",
      emailNotifications: Boolean(n.email ?? true),
      pushNotifications: Boolean(n.push ?? true),
      smsNotifications: Boolean(n.sms ?? false),
      commentNotifications: Boolean(n.comment ?? true),
      likeNotifications: Boolean(n.like ?? true),
      followNotifications: Boolean(n.follow ?? true),
      profileVisibility: String(p.profileVisibility ?? "public"),
      emailVisibility: String(p.emailVisibility ?? "private"),
      activityVisibility: String(p.activityVisibility ?? "public"),
      githubVisibility: String(p.githubVisibility ?? "public"),
      wechatQrVisibility: String(p.wechatQrVisibility ?? "private"),
      statsVisibility: String(p.statsVisibility ?? "public"),
      recentActivityVisibility: String(p.recentActivityVisibility ?? "public"),
      github: readSocialString(sl, ["github"]),
      wechatQr: readSocialString(sl, ["wechatQr", "wechat_qr", "wechatQR", "wechat"]),
      douyin: readSocialString(sl, ["douyin"]),
      bilibili: readSocialString(sl, ["bilibili"]),
    });
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        setProfile(null);
        setFetchFailed(false);
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        setLoading(false);
        setProfile(null);
        setFetchFailed(false);
        return;
      }

      setLoading(true);
      setFetchFailed(false);
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as ApiResponse<UserProfile>;
        if (!json.success || !json.data) {
          message.error(json.message || t.loadFailed);
          setProfile(null);
          setFetchFailed(true);
          return;
        }
        setProfile(json.data);
        applyProfileToForm(json.data);
      } catch (e) {
        console.error(e);
        message.error(t.loadFailed);
        setProfile(null);
        setFetchFailed(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authLoading, isAuthenticated, applyProfileToForm, t.loadFailed]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      if (field === "email") {
        // 邮箱变化后，已输入验证码可能不再对应，主动清空避免误用
        return {
          ...prev,
          email: value,
          emailVerificationCode: "",
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSave = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token || !isAuthenticated) {
      message.warning(t.needLogin);
      return;
    }

    const oldEmail = (profile?.email || "").trim().toLowerCase();
    const newEmail = formData.email.trim().toLowerCase();
    const isEmailChanged = !!newEmail && newEmail !== oldEmail;
    if (!isValidEmailFormat(formData.email)) {
      message.error(t.profile.emailFormatError);
      return;
    }
    if (isEmailChanged && !formData.emailVerificationCode.trim()) {
      message.warning(t.profile.needEmailCode);
      return;
    }

    const body: UpdateProfileRequest = {
      avatar: formData.avatar.trim() || undefined,
      displayName: formData.displayName.trim(),
      email: formData.email.trim(),
      emailVerificationCode: isEmailChanged ? formData.emailVerificationCode.trim() : undefined,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      website: formData.website.trim(),
      location: formData.location.trim(),
      notifications: {
        email: formData.emailNotifications,
        push: formData.pushNotifications,
        sms: formData.smsNotifications,
        comment: formData.commentNotifications,
        like: formData.likeNotifications,
        follow: formData.followNotifications,
      },
      privacy: {
        profileVisibility: formData.profileVisibility,
        emailVisibility: formData.emailVisibility,
        activityVisibility: formData.activityVisibility,
        githubVisibility: formData.githubVisibility,
        wechatQrVisibility: formData.wechatQrVisibility,
        statsVisibility: formData.statsVisibility,
        recentActivityVisibility: formData.recentActivityVisibility,
      },
      socialLinks: buildSocialLinksPayload(formData),
    };

    setSaving(true);
    try {
      // GET 在无 user_profiles 行时 id 为 0，需 POST 创建后再用 PUT 更新
      const isNew = !profile || profile.id === 0;
      const res = await fetch("/api/profile", {
        method: isNew ? "POST" : "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) {
        message.error(json.message || "Error");
        return;
      }
      message.success(json.message || t.saveSuccess);

      const refresh = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshed = (await refresh.json()) as ApiResponse<UserProfile>;
      if (refreshed.success && refreshed.data) {
        setProfile(refreshed.data);
        applyProfileToForm(refreshed.data);
        const sl = asRecord(refreshed.data.socialLinks);
        const avatarFromSocial = typeof sl.avatar === "string" ? sl.avatar.trim() : "";
        const nextAvatar =
          (typeof refreshed.data.avatar === "string" && refreshed.data.avatar.trim()) ||
          (body.avatar && body.avatar.trim()) ||
          avatarFromSocial ||
          undefined;
        patchUser({
          displayName: refreshed.data.displayName ?? body.displayName ?? undefined,
          email: refreshed.data.email ?? body.email ?? undefined,
          avatar: nextAvatar,
        });
      }
    } catch (error) {
      console.error("保存设置失败:", error);
      message.error(t.loadFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailCode = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token || !isAuthenticated) {
      message.warning(t.needLogin);
      return;
    }

    const email = formData.email.trim().toLowerCase();
    if (!isValidEmailFormat(email)) {
      message.error(t.profile.emailFormatError);
      return;
    }

    setSendingEmailCode(true);
    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, type: "change_email" }),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) {
        message.error(json.message || "Error");
        return;
      }
      message.success(json.message || (t.emailCodeSent ?? ""));
    } catch (error) {
      console.error("发送邮箱验证码失败:", error);
      message.error(t.loadFailed);
    } finally {
      setSendingEmailCode(false);
    }
  };

  const tabs = [
    { id: "profile", label: t.tabs.profile, icon: User },
    { id: "notifications", label: t.tabs.notifications, icon: Bell },
    { id: "privacy", label: t.tabs.privacy, icon: Shield },
    { id: "social", label: t.tabs.social, icon: Globe },
  ];

  if (!authLoading && !isAuthenticated) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-default-600">{t.needLogin}</p>
          <Button color="primary" as={Link} href={`/${lang}/auth/login`}>
            {t.login}
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!loading && isAuthenticated && fetchFailed) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-default-600">{t.loadFailed}</p>
          <Button color="primary" variant="flat" onPress={() => window.location.reload()}>
            {t.retry ?? "重试"}
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-1/4 rounded-lg bg-default-200" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 rounded-lg bg-default-200" />
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-default-500">{t.subtitle}</p>
        </div>
        <Button
          color="primary"
          variant="flat"
          className="shrink-0 border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
          startContent={<Save className="h-4 w-4" />}
          onPress={handleSave}
          isDisabled={saving}
        >
          {saving ? t.saving : t.save}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* 侧边栏导航 */}
        <div className="lg:col-span-1">
          <Card className={PROFILE_GLASS_CARD}>
            <CardBody className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary/15 text-primary"
                          : "text-default-600 hover:bg-white/10 hover:text-foreground dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate text-left">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardBody>
          </Card>
        </div>

        {/* 主要内容区域 */}
        <div className="lg:col-span-3">
          {/* 基本信息 */}
          {activeTab === "profile" && (
            <Card className={PROFILE_GLASS_CARD}>
              <CardBody className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">{t.profile.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-sm font-medium text-foreground">{t.profile.avatar}</p>
                    <p className="text-xs text-default-500">{t.profile.avatarDetail}</p>
                    <FeaturedImageUpload
                      scope="profile"
                      value={formData.avatar}
                      onChange={(url) => handleInputChange("avatar", url)}
                      labels={{
                        title: t.profile?.avatar ?? "",
                        hint: t.uploadWechat?.hint ?? "",
                        emptyDropHint: t.uploadWechat?.emptyDropHint ?? "",
                        uploadButton: t.uploadWechat?.uploadButton ?? "",
                        removeButton: t.uploadWechat?.removeButton ?? "",
                        uploading: t.uploadWechat?.uploading ?? "",
                        needLogin: t.uploadWechat?.needLogin ?? "",
                        uploadFailed: t.uploadWechat?.uploadFailed ?? "",
                      }}
                    />
                  </div>
                  <Input
                    label={t.profile.displayName}
                    placeholder={t.profile.displayNamePlaceholder}
                    value={formData.displayName}
                    onChange={(e) => handleInputChange("displayName", e.target.value)}
                    startContent={<User className="h-4 w-4 text-default-400" />}
                    className="md:col-span-2"
                  />
                  <Input
                    type="email"
                    label={t.profile.email}
                    placeholder={t.profile.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    startContent={<Mail className="h-4 w-4 text-default-400" />}
                    className="md:col-span-2"
                  />
                  <div className="md:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                    <Input
                      label={t.profile.emailCode}
                      placeholder={t.profile.emailCodePlaceholder}
                      value={formData.emailVerificationCode}
                      onChange={(e) => handleInputChange("emailVerificationCode", e.target.value)}
                      startContent={<Shield className="h-4 w-4 text-default-400" />}
                    />
                    <Button
                      color="primary"
                      variant="flat"
                      className="h-14 sm:self-end"
                      isDisabled={sendingEmailCode}
                      onPress={handleSendEmailCode}
                    >
                      {sendingEmailCode ? t.profile.sendingEmailCode : t.profile.sendEmailCode}
                    </Button>
                  </div>
                  <Input
                    label={t.profile.firstName}
                    placeholder={t.profile.firstNamePlaceholder}
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    startContent={<User className="h-4 w-4 text-default-400" />}
                  />
                  <Input
                    label={t.profile.lastName}
                    placeholder={t.profile.lastNamePlaceholder}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    startContent={<User className="h-4 w-4 text-default-400" />}
                  />
                  <Input
                    label={t.profile.phone}
                    placeholder={t.profile.phonePlaceholder}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    startContent={<Phone className="h-4 w-4 text-default-400" />}
                  />
                  <Input
                    label={t.profile.website}
                    placeholder={t.profile.websitePlaceholder}
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    startContent={<Globe className="h-4 w-4 text-default-400" />}
                  />
                  <Input
                    label={t.profile.location}
                    placeholder={t.profile.locationPlaceholder}
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    startContent={<MapPin className="h-4 w-4 text-default-400" />}
                    className="md:col-span-2"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* 通知设置 */}
          {activeTab === "notifications" && (
            <Card className={PROFILE_GLASS_CARD}>
              <CardBody className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">{t.notifications.title}</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-4">{t.notifications.methods}</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.notifications.email}</p>
                          <p className="text-xs text-default-500">{t.notifications.emailDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.emailNotifications}
                          onValueChange={(value) => handleInputChange("emailNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.notifications.push}</p>
                          <p className="text-xs text-default-500">{t.notifications.pushDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.pushNotifications}
                          onValueChange={(value) => handleInputChange("pushNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.notifications.sms}</p>
                          <p className="text-xs text-default-500">{t.notifications.smsDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.smsNotifications}
                          onValueChange={(value) => handleInputChange("smsNotifications", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-4">{t.notifications.types}</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.notifications.comment}</p>
                          <p className="text-xs text-default-500">{t.notifications.commentDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.commentNotifications}
                          onValueChange={(value) => handleInputChange("commentNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.notifications.like}</p>
                          <p className="text-xs text-default-500">{t.notifications.likeDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.likeNotifications}
                          onValueChange={(value) => handleInputChange("likeNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.notifications.follow}</p>
                          <p className="text-xs text-default-500">{t.notifications.followDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.followNotifications}
                          onValueChange={(value) => handleInputChange("followNotifications", value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 隐私设置 */}
          {activeTab === "privacy" && (
            <Card className={PROFILE_GLASS_CARD}>
              <CardBody className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">{t.privacy.title}</h3>
                <div className="space-y-6">
                  <div>
                    <Select
                      label={t.privacy.profileVisibility}
                      aria-label={t.privacy.profileVisibility || "profile visibility"}
                      labelPlacement="outside"
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.profileVisibility]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("profileVisibility", selected);
                      }}
                    >
                      <SelectItem key="public" textValue={t.privacy.public}>
                        {t.privacy.public}
                      </SelectItem>
                      <SelectItem key="private" textValue={t.privacy.private}>
                        {t.privacy.private}
                      </SelectItem>
                      <SelectItem key="friends" textValue={t.privacy.friends}>
                        {t.privacy.friends}
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Select
                      label={t.privacy.emailVisibility}
                      aria-label={t.privacy.emailVisibility || "email visibility"}
                      labelPlacement="outside"
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.emailVisibility]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("emailVisibility", selected);
                      }}
                    >
                      <SelectItem key="public" textValue={t.privacy.public}>
                        {t.privacy.public}
                      </SelectItem>
                      <SelectItem key="private" textValue={t.privacy.private}>
                        {t.privacy.private}
                      </SelectItem>
                      <SelectItem key="friends" textValue={t.privacy.friends}>
                        {t.privacy.friends}
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Select
                      label={t.privacy.activityVisibility}
                      aria-label={t.privacy.activityVisibility || "activity visibility"}
                      labelPlacement="outside"
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.activityVisibility]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("activityVisibility", selected);
                      }}
                    >
                      <SelectItem key="public" textValue={t.privacy.public}>
                        {t.privacy.public}
                      </SelectItem>
                      <SelectItem key="private" textValue={t.privacy.private}>
                        {t.privacy.private}
                      </SelectItem>
                      <SelectItem key="friends" textValue={t.privacy.friends}>
                        {t.privacy.friends}
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Select
                      label={t.privacy.githubVisibility}
                      aria-label={t.privacy.githubVisibility || "github visibility"}
                      labelPlacement="outside"
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.githubVisibility]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("githubVisibility", selected);
                      }}
                    >
                      <SelectItem key="public" textValue={t.privacy.public}>
                        {t.privacy.public}
                      </SelectItem>
                      <SelectItem key="private" textValue={t.privacy.private}>
                        {t.privacy.private}
                      </SelectItem>
                      <SelectItem key="friends" textValue={t.privacy.friends}>
                        {t.privacy.friends}
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Select
                      label={t.privacy.wechatQrVisibility}
                      aria-label={t.privacy.wechatQrVisibility || "wechat qr visibility"}
                      labelPlacement="outside"
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.wechatQrVisibility]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("wechatQrVisibility", selected);
                      }}
                    >
                      <SelectItem key="public" textValue={t.privacy.public}>
                        {t.privacy.public}
                      </SelectItem>
                      <SelectItem key="private" textValue={t.privacy.private}>
                        {t.privacy.private}
                      </SelectItem>
                      <SelectItem key="friends" textValue={t.privacy.friends}>
                        {t.privacy.friends}
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Select
                      label={t.privacy.statsVisibility}
                      aria-label={t.privacy.statsVisibility || "stats visibility"}
                      labelPlacement="outside"
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.statsVisibility]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("statsVisibility", selected);
                      }}
                    >
                      <SelectItem key="public" textValue={t.privacy.public}>
                        {t.privacy.public}
                      </SelectItem>
                      <SelectItem key="private" textValue={t.privacy.private}>
                        {t.privacy.private}
                      </SelectItem>
                      <SelectItem key="friends" textValue={t.privacy.friends}>
                        {t.privacy.friends}
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Select
                      label={t.privacy.recentActivityVisibility}
                      aria-label={t.privacy.recentActivityVisibility || "recent activity visibility"}
                      labelPlacement="outside"
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.recentActivityVisibility]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("recentActivityVisibility", selected);
                      }}
                    >
                      <SelectItem key="public" textValue={t.privacy.public}>
                        {t.privacy.public}
                      </SelectItem>
                      <SelectItem key="private" textValue={t.privacy.private}>
                        {t.privacy.private}
                      </SelectItem>
                      <SelectItem key="friends" textValue={t.privacy.friends}>
                        {t.privacy.friends}
                      </SelectItem>
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 社交媒体：GitHub 链接 + 微信二维码上传 + 抖音 / B 站账号 */}
          {activeTab === "social" && (
            <Card className={PROFILE_GLASS_CARD}>
              <CardBody className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">{t.social.title}</h3>
                <div className="space-y-6">
                  <Input
                    label={t.social.github}
                    placeholder="https://github.com/username"
                    value={formData.github}
                    onChange={(e) => handleInputChange("github", e.target.value)}
                    startContent={<Github className="h-4 w-4 text-default-400" />}
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{t.social.wechatQr}</p>
                    <p className="text-xs text-default-500">{t.social.wechatQrDetail}</p>
                    <FeaturedImageUpload
                      scope="profile"
                      value={formData.wechatQr}
                      onChange={(url) => handleInputChange("wechatQr", url)}
                      labels={wechatQrUploadLabels}
                    />
                  </div>
                  <Input
                    label={t.social.douyin}
                    placeholder={t.social.douyinPlaceholder}
                    value={formData.douyin}
                    onChange={(e) => handleInputChange("douyin", e.target.value)}
                    startContent={<Globe className="h-4 w-4 text-default-400" />}
                  />
                  <Input
                    label={t.social.bilibili}
                    placeholder={t.social.bilibiliPlaceholder}
                    value={formData.bilibili}
                    onChange={(e) => handleInputChange("bilibili", e.target.value)}
                    startContent={<Globe className="h-4 w-4 text-default-400" />}
                  />
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
