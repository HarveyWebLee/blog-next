import { Suspense } from "react";

import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import ProfileNotifications from "@/components/profile/profile-notifications";
import { getDictionary } from "@/lib/dictionaries";

interface ProfileNotificationsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfileNotificationsPage({ params }: ProfileNotificationsPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileNotifications lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
