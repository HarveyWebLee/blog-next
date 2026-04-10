"use client";

import { useEffect, useState } from "react";
import { Switch } from "@heroui/switch";
import { useIsSSR } from "@react-aria/ssr";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();
  const [mounted, setMounted] = useState(false);

  // 确保组件在客户端挂载后才渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在服务端渲染或未挂载时，不渲染开关
  if (!mounted || isSSR) {
    return <div className="w-[60px] h-[32px] bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />;
  }

  return (
    <Switch
      onValueChange={(value) => setTheme(value ? "dark" : "light")}
      isSelected={theme === "dark"}
      color="success"
      endContent={<MoonIcon width="1em" height="1em" className="text-base" />}
      size="lg"
      startContent={<SunIcon width="1em" height="1em" className="text-base" />}
    />
  );
}
