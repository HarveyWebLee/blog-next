"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  Code,
  Cpu,
  Database,
  Github,
  Globe,
  Heart,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Rocket,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Twitter,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 技术栈数据 - 增强版
const techStack = [
  {
    name: "Next.js 15",
    description: "React 全栈框架",
    icon: <Rocket className="h-6 w-6" />,
    color: "bg-gradient-to-br from-black to-gray-800 text-white",
    delay: "delay-0",
    glow: "shadow-[0_0_20px_rgba(0,0,0,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]",
  },
  {
    name: "Drizzle ORM",
    description: "现代化 TypeScript ORM",
    icon: <Database className="h-6 w-6" />,
    color: "bg-gradient-to-br from-blue-600 to-blue-700 text-white",
    delay: "delay-100",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
  },
  {
    name: "Tailwind CSS",
    description: "实用优先的 CSS 框架",
    icon: <Palette className="h-6 w-6" />,
    color: "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white",
    delay: "delay-200",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
  },
  {
    name: "TypeScript",
    description: "类型安全的 JavaScript",
    icon: <Code className="h-6 w-6" />,
    color: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    delay: "delay-300",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
  },
  {
    name: "PostgreSQL",
    description: "强大的关系型数据库",
    icon: <Database className="h-6 w-6" />,
    color: "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white",
    delay: "delay-400",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]",
  },
  {
    name: "Vercel",
    description: "现代化部署平台",
    icon: <Globe className="h-6 w-6" />,
    color: "bg-gradient-to-br from-black to-gray-800 text-white",
    delay: "delay-500",
    glow: "shadow-[0_0_20px_rgba(0,0,0,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]",
  },
];

// 项目特色 - 增强版
const features = [
  {
    title: "现代化设计",
    description: "采用最新的设计趋势，提供优雅的用户体验",
    icon: <Palette className="h-8 w-8" />,
    gradient: "from-purple-500 to-pink-500",
    features: ["Material Design 3", "微交互设计", "视觉层次优化"],
    animation: "hover:rotate-12 hover:scale-110",
  },
  {
    title: "高性能",
    description: "基于 Next.js 15 的 SSR/SSG，确保极快的加载速度",
    icon: <Zap className="h-8 w-8" />,
    gradient: "from-yellow-500 to-orange-500",
    features: ["SSR/SSG 优化", "代码分割", "图片优化"],
    animation: "hover:rotate-12 hover:scale-110",
  },
  {
    title: "类型安全",
    description: "全栈 TypeScript 支持，减少运行时错误",
    icon: <Shield className="h-8 w-8" />,
    gradient: "from-green-500 to-emerald-500",
    features: ["类型检查", "智能提示", "重构安全"],
    animation: "hover:rotate-12 hover:scale-110",
  },
  {
    title: "响应式设计",
    description: "完美适配各种设备尺寸，提供一致的用户体验",
    icon: <Globe className="h-8 w-8" />,
    gradient: "from-blue-500 to-cyan-500",
    features: ["移动优先", "断点适配", "触摸友好"],
    animation: "hover:rotate-12 hover:scale-110",
  },
];

// 统计数据 - 增强版
const stats = [
  {
    label: "项目开发时间",
    value: "3个月",
    icon: <Code className="h-5 w-5" />,
    color: "text-blue-500",
    gradient: "from-blue-500 to-blue-600",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
    description: "持续迭代优化",
  },
  {
    label: "技术栈数量",
    value: "6+",
    icon: <Rocket className="h-5 w-5" />,
    color: "text-purple-500",
    gradient: "from-purple-500 to-purple-600",
    glow: "shadow-[0_0_20px_rgba(147,51,234,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
    description: "现代化技术组合",
  },
  {
    label: "代码行数",
    value: "10k+",
    icon: <Code className="h-5 w-5" />,
    color: "text-green-500",
    gradient: "from-green-500 to-green-600",
    glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]",
    description: "高质量代码",
  },
  {
    label: "组件数量",
    value: "20+",
    icon: <Star className="h-5 w-5" />,
    color: "text-orange-500",
    gradient: "from-orange-500 to-orange-600",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    hoverGlow: "group-hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]",
    description: "可复用组件库",
  },
];

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

// 鼠标跟随效果组件
const MouseFollower = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className={`fixed pointer-events-none z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        left: mousePosition.x - 20,
        top: mousePosition.y - 20,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="w-10 h-10 bg-primary/20 rounded-full animate-ping"></div>
      <div className="absolute inset-0 w-10 h-10 bg-primary/10 rounded-full animate-pulse"></div>
    </div>
  );
};

// 数字计数动画组件
const CountUpAnimation = ({
  end,
  duration = 2000,
  className = "",
}: {
  end: number;
  duration?: number;
  className?: string;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className={className}>
      {count}
    </span>
  );
};

// 增强版粒子背景组件
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

// 打字机效果组件
const TypewriterText = ({
  text,
  speed = 100,
  className = "",
}: {
  text: string;
  speed?: number;
  className?: string;
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
        </div>
      </div>
    );
  }

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

      {/* Hero 区域 - 增强版 */}
      <section className="relative py-20 bg-gradient-to-br from-background via-background/95 to-primary/5 overflow-hidden">
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

        {/* 动态背景网格 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection delay={0} animation="fadeInUp">
            <div className="max-w-4xl mx-auto text-center">
              <div className="relative mb-8 group">
                {/* 头像容器 */}
                <div className="relative w-32 h-32 mx-auto">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl group-hover:shadow-primary/25 transition-all duration-500 group-hover:scale-105 relative z-10">
                    <Image
                      src="/images/logo.png"
                      alt="荒野博客"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* 多层光环效果 */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse animation-delay-1000"></div>

                  {/* 在线状态指示器 */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                  </div>

                  {/* 浮动装饰元素 */}
                  <div className="absolute -top-4 -left-4 w-4 h-4 bg-primary/20 rounded-full animate-bounce animation-delay-2000"></div>
                  <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-primary/30 rounded-full animate-ping animation-delay-3000"></div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                <TypewriterText text="关于 荒野博客" speed={150} className="inline-block" />
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                在数字荒野中探索技术，在思考森林中寻找真理。这是一个基于 Next.js 15 构建的现代化博客系统，
                致力于分享技术见解、开发经验和生活感悟。
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <AnimatedSection delay={100} animation="fadeInLeft">
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 hover:scale-105 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    中国 · 北京
                  </Badge>
                </AnimatedSection>
                <AnimatedSection delay={200} animation="fadeInUp">
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 hover:scale-105 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                  >
                    <Heart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    全栈开发
                  </Badge>
                </AnimatedSection>
                <AnimatedSection delay={300} animation="fadeInRight">
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 hover:scale-105 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                  >
                    <Users className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    开源爱好者
                  </Badge>
                </AnimatedSection>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AnimatedSection delay={400} animation="scaleIn">
                  <Button
                    size="lg"
                    asChild
                    className="group hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                  >
                    <Link href="/blog" className="flex items-center">
                      浏览文章
                      <Rocket className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:rotate-12 transition-transform" />
                    </Link>
                  </Button>
                </AnimatedSection>
                <AnimatedSection delay={500} animation="scaleIn">
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="group hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 border-primary/50 hover:border-primary hover:bg-primary/5"
                  >
                    <Link href="#contact" className="flex items-center">
                      联系我
                      <MessageCircle className="ml-2 h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    </Link>
                  </Button>
                </AnimatedSection>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 统计数据 - 增强版 */}
      <section className="py-16 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <AnimatedSection key={index} delay={index * 150} animation="scaleIn">
                <div className="text-center group cursor-pointer">
                  <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div
                      className={`p-4 rounded-full bg-gradient-to-br ${stat.gradient} text-white group-hover:shadow-xl transition-all duration-300 ${stat.glow} group-hover:${stat.hoverGlow}`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                  <div
                    className={`text-3xl font-bold mb-2 ${stat.color} group-hover:scale-105 transition-transform duration-300`}
                  >
                    {stat.value.includes("+") ? (
                      <>
                        <CountUpAnimation end={parseInt(stat.value.replace("+", ""))} className="inline-block" />+
                      </>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-muted-foreground group-hover:text-foreground transition-colors duration-300 font-medium">
                    {stat.label}
                  </div>
                  <div className="text-sm text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-300 mt-1">
                    {stat.description}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 项目介绍 - 增强版 */}
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
                  <Sparkles className="inline-block h-8 w-8 mr-2 text-primary animate-pulse" />
                  项目介绍
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  荒野博客是一个现代化的个人博客系统，采用最新的 Web 技术栈构建，
                  旨在提供一个优雅、高效的内容创作和分享平台。
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {features.map((feature, index) => (
                <AnimatedSection key={index} delay={index * 200} animation="fadeInUp">
                  <Card className="p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group border-0 bg-gradient-to-br from-background to-muted/20 hover:from-primary/5 hover:to-primary/10 cursor-pointer relative overflow-hidden">
                    {/* 悬停时的光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-4 rounded-xl bg-gradient-to-br ${feature.gradient} text-white group-hover:scale-110 transition-all duration-300 group-hover:rotate-6 shadow-lg group-hover:shadow-xl ${feature.animation}`}
                        >
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                            {feature.title}
                          </h3>
                          <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 mb-3">
                            {feature.description}
                          </p>

                          {/* 特性标签 */}
                          <div className="flex flex-wrap gap-2">
                            {feature.features.map((feat, featIndex) => (
                              <Badge
                                key={featIndex}
                                variant="outline"
                                className="text-xs group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors duration-300"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {feat}
                              </Badge>
                            ))}
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

      {/* 技术栈 - 增强版 */}
      <section className="py-20 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"></div>

        {/* 浮动几何图形 */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-primary/10 rounded-full animate-spin animation-duration-20000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-primary/5 rounded-full animate-pulse animation-delay-2000"></div>

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection delay={0} animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                <Cpu className="inline-block h-8 w-8 mr-2 text-primary animate-pulse" />
                技术栈
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                采用现代化的技术栈，确保系统的高性能、可维护性和扩展性
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <AnimatedSection key={index} delay={index * 150} animation="scaleIn">
                <Card
                  className={`p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group border-0 bg-gradient-to-br from-background to-muted/10 hover:from-primary/5 hover:to-primary/10 cursor-pointer relative overflow-hidden ${tech.delay}`}
                >
                  {/* 悬停时的光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-4 rounded-xl ${tech.color} group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-xl ${tech.glow} group-hover:${tech.hoverGlow}`}
                      >
                        {tech.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors duration-300">
                          {tech.name}
                        </h3>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                          {tech.description}
                        </p>
                      </div>
                    </div>

                    {/* 技术标签 */}
                    <div className="mt-4 flex justify-end">
                      <Badge
                        variant="outline"
                        className="text-xs group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors duration-300"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        现代化
                      </Badge>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 开发历程 - 增强版 */}
      <section className="py-20 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/8 via-primary/4 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-primary/5 via-primary/2 to-transparent rounded-full blur-2xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto">
            <AnimatedSection delay={0} animation="fadeInUp">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  <Layers className="inline-block h-8 w-8 mr-2 text-primary animate-pulse" />
                  开发历程
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">从概念到实现，记录项目的成长轨迹</p>
              </div>
            </AnimatedSection>

            <div className="space-y-8 relative">
              {/* 增强时间线 */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/70 to-primary/30 rounded-full shadow-lg"></div>
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-primary/5 rounded-full animate-pulse"></div>

              {[
                {
                  step: 1,
                  title: "项目规划",
                  description: "确定技术栈选择，设计系统架构，制定开发计划",
                  date: "2024年1月",
                  color: "from-blue-500 to-blue-600",
                  icon: <Code className="h-4 w-4" />,
                  features: ["技术选型", "架构设计", "需求分析"],
                },
                {
                  step: 2,
                  title: "核心开发",
                  description: "实现用户认证、文章管理、分类标签等核心功能",
                  date: "2024年2月",
                  color: "from-green-500 to-green-600",
                  icon: <Rocket className="h-4 w-4" />,
                  features: ["用户系统", "内容管理", "数据库设计"],
                },
                {
                  step: 3,
                  title: "UI/UX 优化",
                  description: "完善用户界面设计，优化用户体验，添加响应式支持",
                  date: "2024年3月",
                  color: "from-purple-500 to-purple-600",
                  icon: <Palette className="h-4 w-4" />,
                  features: ["界面设计", "交互优化", "响应式适配"],
                },
                {
                  step: 4,
                  title: "测试部署",
                  description: "全面测试系统功能，部署到生产环境，持续优化",
                  date: "2024年4月",
                  color: "from-orange-500 to-orange-600",
                  icon: <Shield className="h-4 w-4" />,
                  features: ["功能测试", "性能优化", "生产部署"],
                },
              ].map((item, index) => (
                <AnimatedSection key={index} delay={index * 250} animation="fadeInLeft">
                  <div className="flex items-start space-x-6 group cursor-pointer">
                    {/* 步骤指示器 */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl relative z-10`}
                      >
                        {item.step}
                      </div>
                      {/* 连接线装饰 */}
                      <div className="absolute top-12 left-1/2 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent transform -translate-x-1/2"></div>
                      {/* 脉冲效果 */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-full animate-ping opacity-20`}
                      ></div>
                    </div>

                    {/* 内容区域 */}
                    <div className="flex-1 group-hover:translate-x-3 transition-transform duration-300">
                      <div className="bg-gradient-to-br from-background to-muted/10 rounded-xl p-6 border border-primary/10 group-hover:border-primary/20 group-hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`p-2 rounded-lg bg-gradient-to-r ${item.color} text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                          >
                            {item.icon}
                          </div>
                          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                            {item.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
                          >
                            {item.date}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-4 group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed">
                          {item.description}
                        </p>

                        {/* 特性标签 */}
                        <div className="flex flex-wrap gap-2">
                          {item.features.map((feature, featIndex) => (
                            <Badge
                              key={featIndex}
                              variant="outline"
                              className="text-xs group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors duration-300"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 联系方式 - 增强版 */}
      <section
        id="contact"
        className="py-20 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30 relative overflow-hidden"
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"></div>

        {/* 浮动装饰元素 */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-primary/20 rounded-full animate-spin animation-duration-30000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-primary/10 rounded-full animate-pulse animation-delay-2000"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto text-center">
            <AnimatedSection delay={0} animation="fadeInUp">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                <MessageCircle className="inline-block h-8 w-8 mr-2 text-primary animate-pulse" />
                联系我
              </h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">有任何问题或建议，欢迎随时联系我</p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: <Mail className="h-8 w-8 mx-auto mb-4 text-primary" />,
                  title: "邮箱联系",
                  description: "contact@huangye.cn",
                  button: (
                    <Button
                      variant="outline"
                      size="sm"
                      className="group hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    >
                      <Mail className="h-4 w-4 mr-2 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                      发送邮件
                    </Button>
                  ),
                  gradient: "from-blue-500 to-blue-600",
                  glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
                },
                {
                  icon: <MessageCircle className="h-8 w-8 mx-auto mb-4 text-primary" />,
                  title: "社交媒体",
                  description: "关注我的动态",
                  button: (
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="group hover:scale-105 transition-all duration-300 hover:shadow-lg"
                      >
                        <Twitter className="h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="group hover:scale-105 transition-all duration-300 hover:shadow-lg"
                      >
                        <Github className="h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                      </Button>
                    </div>
                  ),
                  gradient: "from-purple-500 to-purple-600",
                  glow: "shadow-[0_0_20px_rgba(147,51,234,0.3)]",
                },
                {
                  icon: <MapPin className="h-8 w-8 mx-auto mb-4 text-primary" />,
                  title: "地理位置",
                  description: "中国 · 北京",
                  button: (
                    <Button
                      variant="outline"
                      size="sm"
                      className="group hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    >
                      <MapPin className="h-4 w-4 mr-2 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                      查看位置
                    </Button>
                  ),
                  gradient: "from-green-500 to-green-600",
                  glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
                },
              ].map((contact, index) => (
                <AnimatedSection key={index} delay={index * 200} animation="scaleIn">
                  <Card
                    className={`p-6 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group border-0 bg-gradient-to-br from-background to-muted/20 hover:from-primary/5 hover:to-primary/10 cursor-pointer relative overflow-hidden`}
                  >
                    {/* 悬停光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10">
                      <div
                        className={`p-4 rounded-full bg-gradient-to-r ${contact.gradient} text-white w-fit mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-xl ${contact.glow}`}
                      >
                        {contact.icon}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                        {contact.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 group-hover:text-foreground/80 transition-colors duration-300">
                        {contact.description}
                      </p>
                      {contact.button}
                    </div>
                  </Card>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={400} animation="fadeInUp">
              <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl p-8 border border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-radial from-primary/5 via-primary/2 to-transparent rounded-full blur-xl"></div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    <Heart className="inline-block h-6 w-6 mr-2 text-primary animate-pulse" />
                    感谢访问
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    感谢您访问荒野博客！如果您觉得这个项目有趣或有任何建议，
                    欢迎通过上述方式与我联系。让我们一起在技术的道路上探索前行！
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      asChild
                      className="group hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                    >
                      <Link href="/blog" className="flex items-center">
                        开始阅读文章
                        <Rocket className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:rotate-12 transition-transform" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="group hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 border-primary/50 hover:border-primary hover:bg-primary/5"
                    >
                      <Link href="/" className="flex items-center">
                        返回首页
                        <Globe className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
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
