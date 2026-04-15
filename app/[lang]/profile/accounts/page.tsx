import { Suspense } from "react";

import ProfileAccountsAdmin from "@/components/profile/profile-accounts-admin";
import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import { getDictionaryForLang } from "@/lib/dictionaries";

interface Props {
  params: Promise<{ lang: string }>;
}

/**
 * 超级管理员专用：管理平台注册用户（角色、启用/停用；非 active 不可登录）
 */
export default async function ProfileAccountsPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileAccountsAdmin lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
