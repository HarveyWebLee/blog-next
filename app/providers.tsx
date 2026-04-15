"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { Api401Bridge } from "@/components/auth/api-401-bridge";
import { AuthProvider } from "@/lib/contexts/auth-context";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider placement="top-center" toastOffset={150} />
      <NextThemesProvider {...themeProps}>
        <AuthProvider>
          <Api401Bridge />
          {children}
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
