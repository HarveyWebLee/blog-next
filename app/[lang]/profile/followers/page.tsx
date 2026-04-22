import { Suspense } from "react";

import ProfileFollowers from "@/components/profile/profile-followers";
import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import { getDictionaryForLang } from "@/lib/dictionaries";

interface ProfileFollowersPageProps {
  params: Promise<{ lang: string }>;
}

/**
 * 个人中心 - 粉丝页
 * 当前为前端 MVP 骨架页，用于打通统计入口与关系管理页面；
 * 后续接入真实关系接口时无需改路由层结构。
 */
export default async function ProfileFollowersPage({ params }: ProfileFollowersPageProps) {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileFollowers lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
