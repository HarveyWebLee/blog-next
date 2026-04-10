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
        alert("设置保存成功！");
      }, 1000);
    } catch (error) {
      console.error("保存设置失败:", error);
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "基本信息", icon: User },
    { id: "preferences", label: "偏好设置", icon: Palette },
    { id: "notifications", label: "通知设置", icon: Bell },
    { id: "privacy", label: "隐私设置", icon: Shield },
    { id: "social", label: "社交媒体", icon: Globe },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">账户设置</h1>
          <p className="text-gray-500 dark:text-gray-400">管理您的个人信息和偏好设置</p>
        </div>
        <Button color="primary" startContent={<Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存设置"}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="名字"
                    placeholder="请输入名字"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    startContent={<User className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="姓氏"
                    placeholder="请输入姓氏"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    startContent={<User className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="电话号码"
                    placeholder="请输入电话号码"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    startContent={<Phone className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="个人网站"
                    placeholder="请输入个人网站"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="所在地"
                    placeholder="请输入所在地"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">偏好设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="时区"
                    placeholder="选择时区"
                    selectedKeys={[formData.timezone]}
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                    startContent={<Clock className="w-4 h-4 text-gray-400" />}
                  >
                    <SelectItem key="Asia/Shanghai" value="Asia/Shanghai">
                      北京时间
                    </SelectItem>
                    <SelectItem key="America/New_York" value="America/New_York">
                      纽约时间
                    </SelectItem>
                    <SelectItem key="Europe/London" value="Europe/London">
                      伦敦时间
                    </SelectItem>
                    <SelectItem key="Asia/Tokyo" value="Asia/Tokyo">
                      东京时间
                    </SelectItem>
                  </Select>
                  <Select
                    label="语言"
                    placeholder="选择语言"
                    selectedKeys={[formData.language]}
                    onChange={(e) => handleInputChange("language", e.target.value)}
                  >
                    <SelectItem key="zh-CN" value="zh-CN">
                      简体中文
                    </SelectItem>
                    <SelectItem key="en-US" value="en-US">
                      English
                    </SelectItem>
                    <SelectItem key="ja-JP" value="ja-JP">
                      日本語
                    </SelectItem>
                  </Select>
                  <Select
                    label="日期格式"
                    placeholder="选择日期格式"
                    selectedKeys={[formData.dateFormat]}
                    onChange={(e) => handleInputChange("dateFormat", e.target.value)}
                  >
                    <SelectItem key="YYYY-MM-DD" value="YYYY-MM-DD">
                      2024-01-01
                    </SelectItem>
                    <SelectItem key="MM/DD/YYYY" value="MM/DD/YYYY">
                      01/01/2024
                    </SelectItem>
                    <SelectItem key="DD/MM/YYYY" value="DD/MM/YYYY">
                      01/01/2024
                    </SelectItem>
                  </Select>
                  <Select
                    label="时间格式"
                    placeholder="选择时间格式"
                    selectedKeys={[formData.timeFormat]}
                    onChange={(e) => handleInputChange("timeFormat", e.target.value)}
                  >
                    <SelectItem key="24h" value="24h">
                      24小时制
                    </SelectItem>
                    <SelectItem key="12h" value="12h">
                      12小时制
                    </SelectItem>
                  </Select>
                  <Select
                    label="主题"
                    placeholder="选择主题"
                    selectedKeys={[formData.theme]}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    startContent={<Palette className="w-4 h-4 text-gray-400" />}
                    className="md:col-span-2"
                  >
                    <SelectItem key="light" value="light">
                      浅色主题
                    </SelectItem>
                    <SelectItem key="dark" value="dark">
                      深色主题
                    </SelectItem>
                    <SelectItem key="system" value="system">
                      跟随系统
                    </SelectItem>
                  </Select>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 通知设置 */}
          {activeTab === "notifications" && (
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">通知设置</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">通知方式</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">邮件通知</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">通过邮件接收重要通知</p>
                        </div>
                        <Switch
                          isSelected={formData.emailNotifications}
                          onValueChange={(value) => handleInputChange("emailNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">推送通知</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">在浏览器中显示推送通知</p>
                        </div>
                        <Switch
                          isSelected={formData.pushNotifications}
                          onValueChange={(value) => handleInputChange("pushNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">短信通知</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">通过短信接收紧急通知</p>
                        </div>
                        <Switch
                          isSelected={formData.smsNotifications}
                          onValueChange={(value) => handleInputChange("smsNotifications", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">通知类型</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">评论通知</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">当有人评论您的文章时通知</p>
                        </div>
                        <Switch
                          isSelected={formData.commentNotifications}
                          onValueChange={(value) => handleInputChange("commentNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">点赞通知</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">当有人点赞您的文章时通知</p>
                        </div>
                        <Switch
                          isSelected={formData.likeNotifications}
                          onValueChange={(value) => handleInputChange("likeNotifications", value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">关注通知</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">当有人关注您时通知</p>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">隐私设置</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      个人资料可见性
                    </label>
                    <Select
                      placeholder="选择可见性"
                      selectedKeys={[formData.profileVisibility]}
                      onChange={(e) => handleInputChange("profileVisibility", e.target.value)}
                    >
                      <SelectItem key="public" value="public">
                        公开
                      </SelectItem>
                      <SelectItem key="private" value="private">
                        仅自己
                      </SelectItem>
                      <SelectItem key="friends" value="friends">
                        仅关注者
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">邮箱可见性</label>
                    <Select
                      placeholder="选择可见性"
                      selectedKeys={[formData.emailVisibility]}
                      onChange={(e) => handleInputChange("emailVisibility", e.target.value)}
                    >
                      <SelectItem key="public" value="public">
                        公开
                      </SelectItem>
                      <SelectItem key="private" value="private">
                        仅自己
                      </SelectItem>
                      <SelectItem key="friends" value="friends">
                        仅关注者
                      </SelectItem>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">活动可见性</label>
                    <Select
                      placeholder="选择可见性"
                      selectedKeys={[formData.activityVisibility]}
                      onChange={(e) => handleInputChange("activityVisibility", e.target.value)}
                    >
                      <SelectItem key="public" value="public">
                        公开
                      </SelectItem>
                      <SelectItem key="private" value="private">
                        仅自己
                      </SelectItem>
                      <SelectItem key="friends" value="friends">
                        仅关注者
                      </SelectItem>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">社交媒体链接</h3>
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
                    label="微博"
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
