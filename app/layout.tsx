import clsx from "clsx";

import { Providers } from "./providers";

// 生成静态参数
export async function generateStaticParams() {
  return [{ lang: "zh-CN" }, { lang: "en-US" }, { lang: "ja-JP" }];
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={clsx("font-sans")} suppressHydrationWarning>
        <Providers
          themeProps={{
            enableSystem: true,
            disableTransitionOnChange: false,
            defaultTheme: "dark",
            attribute: "class",
            value: {
              dark: "dark",
              light: "light",
            },
          }}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
