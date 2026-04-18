import { Suspense } from "react";

import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLikes from "@/components/profile/profile-likes";
import ProfileLoading from "@/components/profile/profile-loading";
import { getDictionaryForLang } from "@/lib/dictionaries";

interface ProfileLikesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfileLikesPage({ params }: ProfileLikesPageProps) {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileLikes lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
