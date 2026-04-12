"use client";

import { useEffect, useRef, useState } from "react";

/** 进入视口后触发的淡入动画，用于关于页各区块 */
export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  animation = "fadeInUp",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fadeInUp" | "fadeInLeft" | "fadeInRight" | "scaleIn" | "slideInUp";
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.08 }
    );

    const el = ref.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const base = "transition-all duration-700 ease-out";
  const hidden: Record<typeof animation, string> = {
    fadeInLeft: `${base} opacity-0 -translate-x-6`,
    fadeInRight: `${base} opacity-0 translate-x-6`,
    scaleIn: `${base} opacity-0 scale-95`,
    slideInUp: `${base} opacity-0 translate-y-10`,
    fadeInUp: `${base} opacity-0 translate-y-6`,
  };
  const visible: Record<typeof animation, string> = {
    fadeInLeft: `${base} opacity-100 translate-x-0`,
    fadeInRight: `${base} opacity-100 translate-x-0`,
    scaleIn: `${base} opacity-100 scale-100`,
    slideInUp: `${base} opacity-100 translate-y-0`,
    fadeInUp: `${base} opacity-100 translate-y-0`,
  };

  return (
    <div ref={ref} className={`${isVisible ? visible[animation] : hidden[animation]} ${className}`}>
      {children}
    </div>
  );
}

/** 轻量装饰粒子，避免喧宾夺主 */
export function ParticleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-primary/15 animate-pulse" />
      <div className="absolute top-1/3 right-1/3 h-1 w-1 rounded-full bg-primary/25 animate-ping" />
      <div className="absolute bottom-1/4 left-1/3 h-1.5 w-1.5 rounded-full bg-primary/20 animate-bounce" />
      <div className="absolute top-1/2 right-1/4 h-1 w-1 rounded-full bg-primary/15 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent blur-3xl" />
    </div>
  );
}
