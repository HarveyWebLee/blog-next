import { Suspense } from "react";

import ProfileFavorites from "@/components/profile/profile-favorites";
import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import { getDictionary } from "@/lib/dictionaries";

interface ProfileFavoritesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfileFavoritesPage({ params }: ProfileFavoritesPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileFavorites lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
