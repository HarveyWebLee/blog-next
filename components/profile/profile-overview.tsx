"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, Button, Card, CardBody } from "@heroui/react";
import { Edit, Globe, Mail, MapPin, Phone } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
import { message } from "@/lib/utils";
import type { ApiResponse, UserProfile } from "@/types/blog";

interface ProfileOverviewProps {
  lang: string;
}

/** 展示用：支持的社交键（与设置页写入的 social_links 一致） */
const SOCIAL_KEYS = ["github", "wechatQr", "douyin", "bilibili"] as const;

function isHttpUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

export default function ProfileOverview({ lang }: ProfileOverviewProps) {
  const t =
    lang === "en-US"
      ? {
          loadFailed: "Unable to load profile",
          username: "Username",
          website: "Website",
          edit: "Edit Profile",
          contact: "Contact",
          preferences: "Preferences",
          language: "Language",
          timezone: "Timezone",
          theme: "Theme",
          social: "Social",
          github: "GitHub",
          wechatQr: "WeChat QR",
          douyin: "Douyin",
          bilibili: "Bilibili",
          needLogin: "Please sign in to view your profile.",
          login: "Sign in",
        }
      : lang === "ja-JP"
        ? {
            loadFailed: "プロフィールを読み込めません",
            username: "ユーザー名",
            website: "ウェブサイト",
            edit: "プロフィール編集",
            contact: "連絡先情報",
            preferences: "環境設定",
            language: "言語",
            timezone: "タイムゾーン",
            theme: "テーマ",
            social: "ソーシャル",
            github: "GitHub",
            wechatQr: "WeChat QR",
            douyin: "抖音",
            bilibili: "bilibili",
            needLogin: "プロフィールを表示するにはログインしてください。",
            login: "ログイン",
          }
        : {
            loadFailed: "无法加载个人资料",
            username: "用户名",
            website: "个人网站",
            edit: "编辑资料",
            contact: "联系信息",
            preferences: "偏好设置",
            language: "语言",
            timezone: "时区",
            theme: "主题",
            social: "社交媒体",
            github: "GitHub",
            wechatQr: "微信二维码",
            douyin: "抖音",
            bilibili: "哔哩哔哩",
            needLogin: "请先登录后查看个人资料。",
            login: "去登录",
          };

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      setFailed(false);
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setProfile(null);
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as ApiResponse<UserProfile>;
      if (!json.success || !json.data) {
        message.error(json.message || t.loadFailed);
        setProfile(null);
        setFailed(true);
        return;
      }
      setProfile(json.data);
    } catch (e) {
      console.error(e);
      message.error(t.loadFailed);
      setProfile(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t.loadFailed]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  if (!authLoading && !isAuthenticated) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-default-500">{t.needLogin}</p>
          <Button color="primary" as={Link} href={`/${lang}/auth/login`}>
            {t.login}
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
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-default-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded-lg bg-default-200" />
                <div className="h-3 w-1/2 rounded-lg bg-default-200" />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (failed || !profile) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6 text-center">
          <p className="text-default-500">{t.loadFailed}</p>
        </CardBody>
      </Card>
    );
  }

  const labelForKey = (k: string) => {
    if (k === "github") return t.github;
    if (k === "wechatQr") return t.wechatQr;
    if (k === "douyin") return t.douyin;
    if (k === "bilibili") return t.bilibili;
    return k;
  };

  const socialLinks = profile.socialLinks || {};
  const socialEntries = SOCIAL_KEYS.map((k) => {
    const v = socialLinks[k];
    return typeof v === "string" && v.trim() ? ([k, v.trim()] as const) : null;
  }).filter(Boolean) as [string, string][];

  return (
    <Card className={PROFILE_GLASS_CARD}>
      <CardBody className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatar || "/images/avatar.jpeg"}
              name={`${profile.firstName ?? ""}${profile.lastName ?? ""}`.trim() || user?.username || "?"}
              size="lg"
              className="h-16 w-16"
            />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || user?.displayName || user?.username}
              </h2>
              <p className="text-default-500">{user?.username ?? t.username}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-default-500">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            color="primary"
            variant="flat"
            className="shrink-0 border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
            startContent={<Edit className="h-4 w-4" />}
            as={Link}
            href={`/${lang}/profile/settings`}
          >
            {t.edit}
          </Button>
        </div>

        {/* 联系信息 */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{t.contact}</h3>
            <div className="space-y-2">
              {user?.email && (
                <div className="flex items-center gap-2 text-sm text-default-600">
                  <Mail className="h-4 w-4 shrink-0 text-default-400" />
                  <span>{user.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-default-600">
                  <Phone className="h-4 w-4 shrink-0 text-default-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{t.preferences}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-default-500">{t.language}</span>
                <span className="text-foreground">{profile.language}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-default-500">{t.timezone}</span>
                <span className="text-foreground">{profile.timezone}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-default-500">{t.theme}</span>
                <span className="text-foreground capitalize">{profile.theme}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 社交媒体：二维码图片 + 可点击链接或纯文本 */}
        {socialEntries.length > 0 ? (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-foreground">{t.social}</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              {socialEntries.map(([key, val]) =>
                key === "wechatQr" ? (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs text-default-500">{labelForKey(key)}</span>
                    <Image
                      src={val}
                      alt=""
                      width={112}
                      height={112}
                      unoptimized
                      className="h-28 w-28 rounded-lg border border-default-200 object-cover dark:border-white/10"
                    />
                  </div>
                ) : isHttpUrl(val) ? (
                  <a
                    key={key}
                    href={val}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {labelForKey(key)}
                  </a>
                ) : (
                  <div key={key} className="text-sm text-default-700">
                    <span className="font-medium text-foreground">{labelForKey(key)}</span>
                    <span className="mx-1.5 text-default-400">·</span>
                    <span>{val}</span>
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
