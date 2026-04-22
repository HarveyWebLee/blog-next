import { Suspense } from "react";

import ProfileFollowing from "@/components/profile/profile-following";
import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import { getDictionaryForLang } from "@/lib/dictionaries";

interface ProfileFollowingPageProps {
  params: Promise<{ lang: string }>;
}

/**
 * 个人中心 - 关注页
 * 当前先落地页面骨架与交互结构，后续直接对接关注关系接口。
 */
export default async function ProfileFollowingPage({ params }: ProfileFollowingPageProps) {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileFollowing lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
