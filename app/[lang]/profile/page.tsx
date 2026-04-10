import { Suspense } from "react";
import { redirect } from "next/navigation";

import ProfileActivities from "@/components/profile/profile-activities";
import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import ProfileOverview from "@/components/profile/profile-overview";
import ProfileStats from "@/components/profile/profile-stats";
import { getDictionary } from "@/lib/dictionaries";
import { verifyToken } from "@/lib/utils/auth";

interface ProfilePageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  // 这里应该验证用户身份，暂时跳过
  // const token = await getToken();
  // if (!token) {
  //   redirect(`/${lang}/auth/login`);
  // }

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <div className="space-y-6">
        {/* 个人资料概览 */}
        <Suspense fallback={<ProfileLoading />}>
          <ProfileOverview lang={lang} />
        </Suspense>

        {/* 统计信息 */}
        <Suspense fallback={<ProfileLoading />}>
          <ProfileStats lang={lang} />
        </Suspense>

        {/* 最近活动 */}
        <Suspense fallback={<ProfileLoading />}>
          <ProfileActivities lang={lang} />
        </Suspense>
      </div>
    </ProfileLayout>
  );
}
