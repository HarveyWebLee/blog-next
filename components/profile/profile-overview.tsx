"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Card, CardBody } from "@heroui/react";
import { Calendar, Edit, Globe, Mail, MapPin, Phone } from "lucide-react";

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
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardBody className="p-6 text-center">
          <p className="text-gray-500">无法加载个人资料</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar
              src="/images/avatar.jpeg"
              name={`${profile.firstName}${profile.lastName}`}
              size="lg"
              className="w-16 h-16"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">用户名</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center space-x-1">
                    <Globe className="w-4 h-4" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">
                      个人网站
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button color="primary" variant="flat" startContent={<Edit className="w-4 h-4" />}>
            编辑资料
          </Button>
        </div>

        {/* 联系信息 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">联系信息</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span>user@example.com</span>
              </div>
              {profile.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">偏好设置</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">语言</span>
                <span className="text-gray-900 dark:text-white">{profile.language}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">时区</span>
                <span className="text-gray-900 dark:text-white">{profile.timezone}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">主题</span>
                <span className="text-gray-900 dark:text-white capitalize">{profile.theme}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 社交媒体链接 */}
        {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">社交媒体</h3>
            <div className="flex space-x-4">
              {Object.entries(profile.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-sm"
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
