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
