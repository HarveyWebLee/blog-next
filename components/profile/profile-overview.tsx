"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Card, CardBody } from "@heroui/react";
import { Edit, Globe, Mail, MapPin, Phone } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";

interface ProfileOverviewProps {
  lang: string;
}

interface UserProfile {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  website?: string;
  location?: string;
  timezone?: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  theme: string;
  notifications?: Record<string, any>;
  privacy?: Record<string, any>;
  socialLinks?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
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
          };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟获取用户资料
    const fetchProfile = async () => {
      try {
        // 这里应该调用真实的API
        // const response = await fetch('/api/profile');
        // const data = await response.json();

        // 模拟数据
        setTimeout(() => {
          setProfile({
            id: 1,
            userId: 1,
            firstName: "张",
            lastName: "三",
            phone: "+86 138 0013 8000",
            website: "https://example.com",
            location: "北京市",
            timezone: "Asia/Shanghai",
            language: "zh-CN",
            dateFormat: "YYYY-MM-DD",
            timeFormat: "24h",
            theme: "system",
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
            privacy: {
              profileVisibility: "public",
              emailVisibility: "private",
            },
            socialLinks: {
              github: "https://github.com/username",
              twitter: "https://twitter.com/username",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("获取个人资料失败:", error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  if (!profile) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6 text-center">
          <p className="text-default-500">{t.loadFailed}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={PROFILE_GLASS_CARD}>
      <CardBody className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src="/images/avatar.jpeg"
              name={`${profile.firstName}${profile.lastName}`}
              size="lg"
              className="h-16 w-16"
            />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-default-500">{t.username}</p>
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
          >
            {t.edit}
          </Button>
        </div>

        {/* 联系信息 */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{t.contact}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-default-600">
                <Mail className="h-4 w-4 shrink-0 text-default-400" />
                <span>user@example.com</span>
              </div>
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

        {/* 社交媒体链接 */}
        {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-foreground">{t.social}</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(profile.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
