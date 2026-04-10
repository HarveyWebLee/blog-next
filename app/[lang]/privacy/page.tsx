"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Database,
  Eye,
  FileText,
  Globe,
  Heart,
  Home,
  Lock,
  Mail,
  Scale,
  Shield,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/dictionaries";

// 增强版动画组件
const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  animation = "fadeInUp",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fadeInUp" | "fadeInLeft" | "fadeInRight" | "scaleIn" | "slideInUp";
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-1000 ease-out";

    if (!isVisible) {
      switch (animation) {
        case "fadeInLeft":
          return `${baseClasses} opacity-0 -translate-x-8`;
        case "fadeInRight":
          return `${baseClasses} opacity-0 translate-x-8`;
        case "scaleIn":
          return `${baseClasses} opacity-0 scale-95`;
        case "slideInUp":
          return `${baseClasses} opacity-0 translate-y-12`;
        default:
          return `${baseClasses} opacity-0 translate-y-8`;
      }
    } else {
      switch (animation) {
        case "fadeInLeft":
          return `${baseClasses} opacity-100 translate-x-0`;
        case "fadeInRight":
          return `${baseClasses} opacity-100 translate-x-0`;
        case "scaleIn":
          return `${baseClasses} opacity-100 scale-100`;
        case "slideInUp":
          return `${baseClasses} opacity-100 translate-y-0`;
        default:
          return `${baseClasses} opacity-100 translate-y-0`;
      }
    }
  };

  return (
    <div ref={ref} className={`${getAnimationClasses()} ${className}`}>
      {children}
    </div>
  );
};

// 粒子背景组件
const ParticleBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 静态粒子 */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/30 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary/25 rounded-full animate-bounce"></div>
      <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-primary/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-primary/15 rounded-full animate-ping"></div>

      {/* 动态粒子 */}
      <div className="absolute top-1/6 left-1/6 w-1 h-1 bg-gradient-to-r from-primary/40 to-primary/20 rounded-full animate-ping animation-delay-1000"></div>
      <div className="absolute top-2/3 left-1/5 w-1.5 h-1.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-full animate-bounce animation-delay-2000"></div>
      <div className="absolute bottom-1/6 right-1/6 w-1 h-1 bg-gradient-to-r from-primary/35 to-primary/15 rounded-full animate-pulse animation-delay-3000"></div>

      {/* 浮动几何图形 */}
      <div className="absolute top-1/5 right-1/5 w-3 h-3 border border-primary/20 rotate-45 animate-spin animation-duration-20000"></div>
      <div className="absolute bottom-1/5 left-1/5 w-2 h-2 bg-primary/10 rounded-full animate-ping animation-delay-4000"></div>

      {/* 渐变光晕 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-primary/5 via-primary/2 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-radial from-primary/3 via-primary/1 to-transparent rounded-full blur-2xl animate-pulse animation-delay-1000"></div>
    </div>
  );
};

// 隐私政策图标映射
const getSectionIcon = (sectionKey: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    introduction: <BookOpen className="h-6 w-6" />,
    informationCollection: <Database className="h-6 w-6" />,
    informationUsage: <Zap className="h-6 w-6" />,
    informationSharing: <Users className="h-6 w-6" />,
    dataSecurity: <Shield className="h-6 w-6" />,
    cookies: <Eye className="h-6 w-6" />,
    dataRetention: <Lock className="h-6 w-6" />,
    userRights: <Scale className="h-6 w-6" />,
    childrenPrivacy: <Heart className="h-6 w-6" />,
    internationalTransfer: <Globe className="h-6 w-6" />,
    policyChanges: <FileText className="h-6 w-6" />,
    contact: <Mail className="h-6 w-6" />,
  };
  return iconMap[sectionKey] || <FileText className="h-6 w-6" />;
};

// 隐私政策颜色映射
const getSectionColor = (index: number) => {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
    "from-cyan-500 to-cyan-600",
    "from-emerald-500 to-emerald-600",
    "from-violet-500 to-violet-600",
    "from-rose-500 to-rose-600",
    "from-amber-500 to-amber-600",
    "from-teal-500 to-teal-600",
  ];
  return colors[index % colors.length];
};

interface PrivacyPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dict, setDict] = useState<any>(null);

  // 使用 React.use() 解包 params Promise
  const resolvedParams = use(params);

  useEffect(() => {
    setMounted(true);
    // 加载字典
    const loadDictionary = async () => {
      const dictionary = await getDictionary(resolvedParams.lang as "zh-CN" | "en-US" | "ja-JP");
      setDict(dictionary);
    };
    loadDictionary();
  }, [resolvedParams.lang]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!mounted || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
        </div>
      </div>
    );
  }

  const sections = Object.entries(dict.privacy.sections);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 鼠标跟随效果 */}
      <div
        className="fixed pointer-events-none z-10 w-6 h-6 bg-primary/10 rounded-full blur-sm transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* 粒子背景 */}
      <ParticleBackground />

      {/* Hero 区域 */}
      <section className="relative py-4 bg-gradient-to-br from-background via-background/95 to-primary/5 overflow-hidden">
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

        {/* 动态背景网格 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection delay={0} animation="fadeInUp">
            <div className="mx-auto text-center">
              {/* 返回按钮 */}
              <div className="flex justify-start mb-8">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 border-primary/50 hover:border-primary hover:bg-primary/5"
                >
                  <Link href="/auth/login" className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    返回登录页
                  </Link>
                </Button>
              </div>

              {/* 标题区域 */}
              <div className="relative mb-8 group">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-xl">
                    <Shield className="h-8 w-8" />
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {dict.privacy.title}
              </h1>

              <p className="text-xl text-muted-foreground mb-8 mx-auto leading-relaxed">{dict.privacy.subtitle}</p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <AnimatedSection delay={100} animation="fadeInLeft">
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 hover:scale-105 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                  >
                    <FileText className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    {dict.privacy.lastUpdated}: 2024年12月
                  </Badge>
                </AnimatedSection>
                <AnimatedSection delay={200} animation="fadeInUp">
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 hover:scale-105 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                  >
                    <Shield className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    隐私保护
                  </Badge>
                </AnimatedSection>
                <AnimatedSection delay={300} animation="fadeInRight">
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 hover:scale-105 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                  >
                    <Lock className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    数据安全
                  </Badge>
                </AnimatedSection>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 隐私政策内容 */}
      <section className="py-20 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-primary/5 via-primary/2 to-transparent rounded-full blur-2xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto">
            <AnimatedSection delay={0} animation="fadeInUp">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  <BookOpen className="inline-block h-8 w-8 mr-2 text-primary animate-pulse" />
                  详细政策
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  请仔细阅读以下隐私政策，了解我们如何保护您的个人信息
                </p>
              </div>
            </AnimatedSection>

            <div className="space-y-8">
              {sections.map(([key, section]: [string, any], index) => (
                <AnimatedSection key={key} delay={index * 150} animation="fadeInUp">
                  <Card className="p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group border-0 bg-gradient-to-br from-background to-muted/20 hover:from-primary/5 hover:to-primary/10 cursor-pointer relative overflow-hidden">
                    {/* 悬停时的光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10">
                      <div className="flex items-start space-x-6">
                        {/* 图标区域 */}
                        <div
                          className={`p-4 rounded-xl bg-gradient-to-br ${getSectionColor(index)} text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-xl flex-shrink-0`}
                        >
                          {getSectionIcon(key)}
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                            {section.title}
                          </h3>
                          <div className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed whitespace-pre-line">
                            {section.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 同意确认区域 */}
      <section className="py-20 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto text-center">
            <AnimatedSection delay={0} animation="fadeInUp">
              <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl p-8 border border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-radial from-primary/5 via-primary/2 to-transparent rounded-full blur-xl"></div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    <Heart className="inline-block h-6 w-6 mr-2 text-primary animate-pulse" />
                    感谢您的信任
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    我们承诺保护您的隐私权，确保您的个人信息安全。如果您对本隐私政策有任何疑问，
                    欢迎随时联系我们。您的信任是我们前进的动力！
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      asChild
                      className="group hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                    >
                      <Link href="/" className="flex items-center">
                        <Home className="ml-2 h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                        {dict.privacy.backToHome}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="group hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 border-primary/50 hover:border-primary hover:bg-primary/5"
                    >
                      <Link href="/blog" className="flex items-center">
                        <BookOpen className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                        浏览博客
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
