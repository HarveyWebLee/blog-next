"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody, Input, Select, SelectItem, Switch, Textarea } from "@heroui/react";
import { Bell, Clock, Eye, EyeOff, Globe, Mail, MapPin, Palette, Phone, Save, Shield, User } from "lucide-react";

interface ProfileSettingsProps {
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
}

export default function ProfileSettings({ lang }: ProfileSettingsProps) {
  const t =
    lang === "en-US"
      ? {
          saveSuccess: "Settings saved successfully!",
          title: "Account Settings",
          subtitle: "Manage your personal info and preferences",
          saving: "Saving...",
          save: "Save Settings",
          tabs: {
            profile: "Basic Info",
            preferences: "Preferences",
            notifications: "Notifications",
            privacy: "Privacy",
            social: "Social",
          },
          profile: {
            title: "Basic Info",
            firstName: "First Name",
            firstNamePlaceholder: "Enter first name",
            lastName: "Last Name",
            lastNamePlaceholder: "Enter last name",
            phone: "Phone",
            phonePlaceholder: "Enter phone number",
            website: "Website",
            websitePlaceholder: "Enter website URL",
            location: "Location",
            locationPlaceholder: "Enter location",
          },
          preferences: {
            title: "Preferences",
            timezone: "Timezone",
            timezonePlaceholder: "Select timezone",
            language: "Language",
            languagePlaceholder: "Select language",
            dateFormat: "Date Format",
            dateFormatPlaceholder: "Select date format",
            timeFormat: "Time Format",
            timeFormatPlaceholder: "Select time format",
            theme: "Theme",
            themePlaceholder: "Select theme",
            tzBeijing: "Beijing",
            tzNewYork: "New York",
            tzLondon: "London",
            tzTokyo: "Tokyo",
            langZh: "Simplified Chinese",
            langEn: "English",
            langJa: "Japanese",
            tf24: "24-hour",
            tf12: "12-hour",
            themeLight: "Light",
            themeDark: "Dark",
            themeSystem: "System",
          },
          notifications: {
            title: "Notification Settings",
            methods: "Notification Methods",
            types: "Notification Types",
            email: "Email Notifications",
            emailDesc: "Receive important notifications by email",
            push: "Push Notifications",
            pushDesc: "Show browser push notifications",
            sms: "SMS Notifications",
            smsDesc: "Receive urgent notifications by SMS",
            comment: "Comment Notifications",
            commentDesc: "Notify when someone comments your post",
            like: "Like Notifications",
            likeDesc: "Notify when someone likes your post",
            follow: "Follow Notifications",
            followDesc: "Notify when someone follows you",
          },
          privacy: {
            title: "Privacy Settings",
            profileVisibility: "Profile Visibility",
            emailVisibility: "Email Visibility",
            activityVisibility: "Activity Visibility",
            visibilityPlaceholder: "Select visibility",
            public: "Public",
            private: "Private",
            friends: "Followers only",
          },
          social: {
            title: "Social Links",
            weibo: "Weibo",
          },
        }
      : lang === "ja-JP"
        ? {
            saveSuccess: "設定を保存しました！",
            title: "アカウント設定",
            subtitle: "個人情報と設定を管理",
            saving: "保存中...",
            save: "設定を保存",
            tabs: {
              profile: "基本情報",
              preferences: "環境設定",
              notifications: "通知設定",
              privacy: "プライバシー",
              social: "ソーシャル",
            },
            profile: {
              title: "基本情報",
              firstName: "名",
              firstNamePlaceholder: "名を入力",
              lastName: "姓",
              lastNamePlaceholder: "姓を入力",
              phone: "電話番号",
              phonePlaceholder: "電話番号を入力",
              website: "ウェブサイト",
              websitePlaceholder: "ウェブサイトURLを入力",
              location: "所在地",
              locationPlaceholder: "所在地を入力",
            },
            preferences: {
              title: "環境設定",
              timezone: "タイムゾーン",
              timezonePlaceholder: "タイムゾーンを選択",
              language: "言語",
              languagePlaceholder: "言語を選択",
              dateFormat: "日付形式",
              dateFormatPlaceholder: "日付形式を選択",
              timeFormat: "時間形式",
              timeFormatPlaceholder: "時間形式を選択",
              theme: "テーマ",
              themePlaceholder: "テーマを選択",
              tzBeijing: "北京",
              tzNewYork: "ニューヨーク",
              tzLondon: "ロンドン",
              tzTokyo: "東京",
              langZh: "簡体字中国語",
              langEn: "英語",
              langJa: "日本語",
              tf24: "24時間",
              tf12: "12時間",
              themeLight: "ライト",
              themeDark: "ダーク",
              themeSystem: "システムに従う",
            },
            notifications: {
              title: "通知設定",
              methods: "通知方法",
              types: "通知タイプ",
              email: "メール通知",
              emailDesc: "重要通知をメールで受信",
              push: "プッシュ通知",
              pushDesc: "ブラウザで通知を表示",
              sms: "SMS通知",
              smsDesc: "緊急通知をSMSで受信",
              comment: "コメント通知",
              commentDesc: "コメント時に通知",
              like: "いいね通知",
              likeDesc: "いいね時に通知",
              follow: "フォロー通知",
              followDesc: "フォロー時に通知",
            },
            privacy: {
              title: "プライバシー設定",
              profileVisibility: "プロフィール公開範囲",
              emailVisibility: "メール公開範囲",
              activityVisibility: "アクティビティ公開範囲",
              visibilityPlaceholder: "公開範囲を選択",
              public: "公開",
              private: "非公開",
              friends: "フォロワーのみ",
            },
            social: {
              title: "ソーシャルリンク",
              weibo: "微博",
            },
          }
        : {
            saveSuccess: "设置保存成功！",
            title: "账户设置",
            subtitle: "管理您的个人信息和偏好设置",
            saving: "保存中...",
            save: "保存设置",
            tabs: {
              profile: "基本信息",
              preferences: "偏好设置",
              notifications: "通知设置",
              privacy: "隐私设置",
              social: "社交媒体",
            },
            profile: {
              title: "基本信息",
              firstName: "名字",
              firstNamePlaceholder: "请输入名字",
              lastName: "姓氏",
              lastNamePlaceholder: "请输入姓氏",
              phone: "电话号码",
              phonePlaceholder: "请输入电话号码",
              website: "个人网站",
              websitePlaceholder: "请输入个人网站",
              location: "所在地",
              locationPlaceholder: "请输入所在地",
            },
            preferences: {
              title: "偏好设置",
              timezone: "时区",
              timezonePlaceholder: "选择时区",
              language: "语言",
              languagePlaceholder: "选择语言",
              dateFormat: "日期格式",
              dateFormatPlaceholder: "选择日期格式",
              timeFormat: "时间格式",
              timeFormatPlaceholder: "选择时间格式",
              theme: "主题",
              themePlaceholder: "选择主题",
              tzBeijing: "北京时间",
              tzNewYork: "纽约时间",
              tzLondon: "伦敦时间",
              tzTokyo: "东京时间",
              langZh: "简体中文",
              langEn: "English",
              langJa: "日本語",
              tf24: "24小时制",
              tf12: "12小时制",
              themeLight: "浅色主题",
              themeDark: "深色主题",
              themeSystem: "跟随系统",
            },
            notifications: {
              title: "通知设置",
              methods: "通知方式",
              types: "通知类型",
              email: "邮件通知",
              emailDesc: "通过邮件接收重要通知",
              push: "推送通知",
              pushDesc: "在浏览器中显示推送通知",
              sms: "短信通知",
              smsDesc: "通过短信接收紧急通知",
              comment: "评论通知",
              commentDesc: "当有人评论您的文章时通知",
              like: "点赞通知",
              likeDesc: "当有人点赞您的文章时通知",
              follow: "关注通知",
              followDesc: "当有人关注您时通知",
            },
            privacy: {
              title: "隐私设置",
              profileVisibility: "个人资料可见性",
              emailVisibility: "邮箱可见性",
              activityVisibility: "活动可见性",
              visibilityPlaceholder: "选择可见性",
              public: "公开",
              private: "仅自己",
              friends: "仅关注者",
            },
            social: {
              title: "社交媒体链接",
              weibo: "微博",
            },
          };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    // 基本信息
    firstName: "",
    lastName: "",
    phone: "",
    website: "",
    location: "",

    // 偏好设置
    timezone: "Asia/Shanghai",
    language: "zh-CN",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    theme: "system",

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

    // 社交媒体
    github: "",
    twitter: "",
    linkedin: "",
    weibo: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // 这里应该调用真实的API
        // const response = await fetch('/api/profile');
        // const data = await response.json();

        // 模拟数据
        setTimeout(() => {
          const mockProfile: UserProfile = {
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
              comment: true,
              like: true,
              follow: true,
            },
            privacy: {
              profileVisibility: "public",
              emailVisibility: "private",
              activityVisibility: "public",
            },
            socialLinks: {
              github: "https://github.com/username",
              twitter: "https://twitter.com/username",
              linkedin: "https://linkedin.com/in/username",
              weibo: "https://weibo.com/username",
            },
          };

          setProfile(mockProfile);
          setFormData({
            firstName: mockProfile.firstName || "",
            lastName: mockProfile.lastName || "",
            phone: mockProfile.phone || "",
            website: mockProfile.website || "",
            location: mockProfile.location || "",
            timezone: mockProfile.timezone || "Asia/Shanghai",
            language: mockProfile.language || "zh-CN",
            dateFormat: mockProfile.dateFormat || "YYYY-MM-DD",
            timeFormat: mockProfile.timeFormat || "24h",
            theme: mockProfile.theme || "system",
            emailNotifications: mockProfile.notifications?.email || true,
            pushNotifications: mockProfile.notifications?.push || true,
            smsNotifications: mockProfile.notifications?.sms || false,
            commentNotifications: mockProfile.notifications?.comment || true,
            likeNotifications: mockProfile.notifications?.like || true,
            followNotifications: mockProfile.notifications?.follow || true,
            profileVisibility: mockProfile.privacy?.profileVisibility || "public",
            emailVisibility: mockProfile.privacy?.emailVisibility || "private",
            activityVisibility: mockProfile.privacy?.activityVisibility || "public",
            github: mockProfile.socialLinks?.github || "",
            twitter: mockProfile.socialLinks?.twitter || "",
            linkedin: mockProfile.socialLinks?.linkedin || "",
            weibo: mockProfile.socialLinks?.weibo || "",
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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 这里应该调用真实的API
      // await fetch('/api/profile', {
      //   method: 'PUT',
      //   body: JSON.stringify(formData)
      // });

      // 模拟保存
      setTimeout(() => {
        setSaving(false);
        alert(t.saveSuccess);
      }, 1000);
    } catch (error) {
      console.error("保存设置失败:", error);
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: t.tabs.profile, icon: User },
    { id: "preferences", label: t.tabs.preferences, icon: Palette },
    { id: "notifications", label: t.tabs.notifications, icon: Bell },
    { id: "privacy", label: t.tabs.privacy, icon: Shield },
    { id: "social", label: t.tabs.social, icon: Globe },
  ];

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t.subtitle}</p>
        </div>
        <Button color="primary" startContent={<Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
          {saving ? t.saving : t.save}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 侧边栏导航 */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
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
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t.profile.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t.profile.firstName}
                    placeholder={t.profile.firstNamePlaceholder}
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    startContent={<User className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label={t.profile.lastName}
                    placeholder={t.profile.lastNamePlaceholder}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    startContent={<User className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label={t.profile.phone}
                    placeholder={t.profile.phonePlaceholder}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    startContent={<Phone className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label={t.profile.website}
                    placeholder={t.profile.websitePlaceholder}
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label={t.profile.location}
                    placeholder={t.profile.locationPlaceholder}
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    startContent={<MapPin className="w-4 h-4 text-gray-400" />}
                    className="md:col-span-2"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* 偏好设置 */}
          {activeTab === "preferences" && (
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t.preferences.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label={t.preferences.timezone}
                    placeholder={t.preferences.timezonePlaceholder}
                    selectedKeys={[formData.timezone]}
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                    startContent={<Clock className="w-4 h-4 text-gray-400" />}
                  >
                    <SelectItem key="Asia/Shanghai">{t.preferences.tzBeijing}</SelectItem>
                    <SelectItem key="America/New_York">{t.preferences.tzNewYork}</SelectItem>
                    <SelectItem key="Europe/London">{t.preferences.tzLondon}</SelectItem>
                    <SelectItem key="Asia/Tokyo">{t.preferences.tzTokyo}</SelectItem>
                  </Select>
                  <Select
                    label={t.preferences.language}
                    placeholder={t.preferences.languagePlaceholder}
                    selectedKeys={[formData.language]}
                    onChange={(e) => handleInputChange("language", e.target.value)}
                  >
                    <SelectItem key="zh-CN">{t.preferences.langZh}</SelectItem>
                    <SelectItem key="en-US">{t.preferences.langEn}</SelectItem>
                    <SelectItem key="ja-JP">{t.preferences.langJa}</SelectItem>
                  </Select>
                  <Select
                    label={t.preferences.dateFormat}
                    placeholder={t.preferences.dateFormatPlaceholder}
                    selectedKeys={[formData.dateFormat]}
                    onChange={(e) => handleInputChange("dateFormat", e.target.value)}
                  >
                    <SelectItem key="YYYY-MM-DD">2024-01-01</SelectItem>
                    <SelectItem key="MM/DD/YYYY">01/01/2024</SelectItem>
                    <SelectItem key="DD/MM/YYYY">01/01/2024</SelectItem>
                  </Select>
                  <Select
                    label={t.preferences.timeFormat}
                    placeholder={t.preferences.timeFormatPlaceholder}
                    selectedKeys={[formData.timeFormat]}
                    onChange={(e) => handleInputChange("timeFormat", e.target.value)}
                  >
                    <SelectItem key="24h">{t.preferences.tf24}</SelectItem>
                    <SelectItem key="12h">{t.preferences.tf12}</SelectItem>
                  </Select>
                  <Select
                    label={t.preferences.theme}
                    placeholder={t.preferences.themePlaceholder}
                    selectedKeys={[formData.theme]}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    startContent={<Palette className="w-4 h-4 text-gray-400" />}
                    className="md:col-span-2"
                  >
                    <SelectItem key="light">{t.preferences.themeLight}</SelectItem>
                    <SelectItem key="dark">{t.preferences.themeDark}</SelectItem>
                    <SelectItem key="system">{t.preferences.themeSystem}</SelectItem>
                  </Select>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 通知设置 */}
          {activeTab === "notifications" && (
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t.notifications.title}</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      {t.notifications.methods}
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.notifications.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.notifications.emailDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.emailNotifications}
                          onValueChange={(value) => handleInputChange("emailNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.notifications.push}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.notifications.pushDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.pushNotifications}
                          onValueChange={(value) => handleInputChange("pushNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.notifications.sms}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.notifications.smsDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.smsNotifications}
                          onValueChange={(value) => handleInputChange("smsNotifications", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t.notifications.types}</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.notifications.comment}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.notifications.commentDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.commentNotifications}
                          onValueChange={(value) => handleInputChange("commentNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.notifications.like}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.notifications.likeDesc}</p>
                        </div>
                        <Switch
                          isSelected={formData.likeNotifications}
                          onValueChange={(value) => handleInputChange("likeNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.notifications.follow}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.notifications.followDesc}</p>
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
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t.privacy.title}</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t.privacy.profileVisibility}
                    </label>
                    <Select
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.profileVisibility]}
                      onChange={(e) => handleInputChange("profileVisibility", e.target.value)}
                    >
                      <SelectItem key="public">{t.privacy.public}</SelectItem>
                      <SelectItem key="private">{t.privacy.private}</SelectItem>
                      <SelectItem key="friends">{t.privacy.friends}</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t.privacy.emailVisibility}
                    </label>
                    <Select
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.emailVisibility]}
                      onChange={(e) => handleInputChange("emailVisibility", e.target.value)}
                    >
                      <SelectItem key="public">{t.privacy.public}</SelectItem>
                      <SelectItem key="private">{t.privacy.private}</SelectItem>
                      <SelectItem key="friends">{t.privacy.friends}</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t.privacy.activityVisibility}
                    </label>
                    <Select
                      placeholder={t.privacy.visibilityPlaceholder}
                      selectedKeys={[formData.activityVisibility]}
                      onChange={(e) => handleInputChange("activityVisibility", e.target.value)}
                    >
                      <SelectItem key="public">{t.privacy.public}</SelectItem>
                      <SelectItem key="private">{t.privacy.private}</SelectItem>
                      <SelectItem key="friends">{t.privacy.friends}</SelectItem>
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 社交媒体 */}
          {activeTab === "social" && (
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t.social.title}</h3>
                <div className="space-y-6">
                  <Input
                    label="GitHub"
                    placeholder="https://github.com/username"
                    value={formData.github}
                    onChange={(e) => handleInputChange("github", e.target.value)}
                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="Twitter"
                    placeholder="https://twitter.com/username"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange("twitter", e.target.value)}
                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="LinkedIn"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange("linkedin", e.target.value)}
                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label={t.social.weibo}
                    placeholder="https://weibo.com/username"
                    value={formData.weibo}
                    onChange={(e) => handleInputChange("weibo", e.target.value)}
                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
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
