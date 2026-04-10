import React from "react";

import { cn } from "@/lib/utils";

interface LoadingProps {
  variant?: "spinner" | "dots" | "pulse" | "skeleton" | "wave" | "shimmer";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ variant = "spinner", size = "md", text = "加载中...", className }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const renderSpinner = () => (
    <div
      className={cn(
        "animate-spin-slow rounded-full border-2 border-muted blog-border-x-box-shadow-primary",
        sizeClasses[size],
        className
      )}
    />
  );

  const renderDots = () => (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-primary animate-bounce-dots",
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={cn("rounded-full bg-primary animate-pulse-glow", sizeClasses[size], className)} />
  );

  const renderSkeleton = () => (
    <div className={cn("space-y-3", className)}>
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 animate-shimmer"></div>
        <div className="space-y-2 mt-2">
          <div className="h-3 bg-muted rounded animate-shimmer"></div>
          <div className="h-3 bg-muted rounded w-5/6 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );

  const renderWave = () => (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-primary rounded-sm animate-wave",
            size === "sm" ? "w-1 h-4" : size === "md" ? "w-1 h-6" : "w-1 h-8"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: "1.2s",
          }}
        />
      ))}
    </div>
  );

  const renderShimmer = () => (
    <div className={cn("space-y-3", className)}>
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-full animate-shimmer"></div>
        <div className="space-y-2 mt-3">
          <div className="h-4 bg-muted rounded animate-shimmer"></div>
          <div className="h-4 bg-muted rounded w-4/5 animate-shimmer"></div>
          <div className="h-4 bg-muted rounded w-3/5 animate-shimmer"></div>
        </div>
        <div className="flex space-x-2 mt-4">
          <div className="h-8 bg-muted rounded w-20 animate-shimmer"></div>
          <div className="h-8 bg-muted rounded w-16 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );

  const renderLoadingAnimation = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      case "wave":
        return renderWave();
      case "shimmer":
        return renderShimmer();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      {renderLoadingAnimation()}
      {text && <p className={cn("text-muted-foreground font-medium animate-pulse", textSizeClasses[size])}>{text}</p>}
    </div>
  );
};

// 页面级加载组件
export const PageLoading: React.FC<{ text?: string }> = ({ text = "页面加载中..." }) => (
  <div className="min-h-screen flex items-center justify-center">
    <Loading variant="spinner" size="lg" text={text} />
  </div>
);

// 卡片级加载组件
export const CardLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6", className)}>
    <Loading variant="skeleton" />
  </div>
);

// 按钮级加载组件
export const ButtonLoading: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "sm" }) => (
  <Loading variant="spinner" size={size} text="" />
);

// 内容加载组件
export const ContentLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-4", className)}>
    <Loading variant="shimmer" />
  </div>
);

export default Loading;
