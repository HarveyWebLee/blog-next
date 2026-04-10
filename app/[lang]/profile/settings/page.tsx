import { Suspense } from "react";

import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import ProfileSettings from "@/components/profile/profile-settings";
import { getDictionary } from "@/lib/dictionaries";

interface ProfileSettingsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfileSettingsPage({ params }: ProfileSettingsPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileSettings lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
