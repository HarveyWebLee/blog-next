"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { useTheme } from "next-themes";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import styles from "./index.module.scss";

const darkThemeColors = {
  "--not-found-noise-text-color": "rgba(128, 255, 128, 0.8)",
  "--not-found-noise-text-shadow-color-1": "rgba(51, 255, 51, 0.4)",
  "--not-found-noise-text-shadow-color-2": "rgba(255, 255, 255, 0.8)",
};

const lightThemeColors = {
  "--not-found-noise-text-color": "rgba(51, 51, 51, 0.8)",
  "--not-found-noise-text-shadow-color-1": "rgba(80, 80, 80, 0.4)",
  "--not-found-noise-text-shadow-color-2": "rgba(167, 232, 230, 0.8)",
};

export default function NotFoundNoise({ lang = "zh-CN" }: { lang?: string }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dict = useClientDictionary(lang);
  const t = (dict as { notFound?: Record<string, string> })?.notFound;

  // 确保组件在客户端挂载后再应用主题样式
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在服务器端和客户端首次渲染时使用默认样式

  const textThemeStyles = useMemo(() => {
    const themeColors = mounted && theme === "dark" ? darkThemeColors : lightThemeColors;

    return {
      color: themeColors["--not-found-noise-text-color"],
      textShadow: `0 0 1px ${themeColors["--not-found-noise-text-shadow-color-1"]}, 0 0 2px ${themeColors["--not-found-noise-text-shadow-color-2"]}`,
    };
  }, [theme, mounted]);

  const textClasses = clsx(styles.output, "text-2xl", "transition-all");

  if (!t) {
    return null;
  }

  return (
    <div className={clsx(styles.container, "absolute inset-0")}>
      <div className={styles.noise}></div>
      <div className={styles.overlay}></div>
      <div className={styles.terminal}>
        <h1 className="mb-[24px] text-4xl font-bold">
          {t.heading} <span className={styles.errorcode}>{t.code}</span>
        </h1>
        <p style={textThemeStyles} className={textClasses}>
          {t.description}
        </p>
        <p style={textThemeStyles} className={textClasses}>
          {t.homePromptBefore}{" "}
          <Link href={`/${lang}`} underline="hover" color="primary" className="text-2xl">
            {t.homeLink}
          </Link>
          {t.homePromptAfter}
        </p>
        <p style={textThemeStyles} className={textClasses}>
          {t.footer}
        </p>
      </div>
    </div>
  );
}
