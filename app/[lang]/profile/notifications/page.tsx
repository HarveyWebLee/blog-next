import { Suspense } from "react";

import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import ProfileNotifications from "@/components/profile/profile-notifications";
import { getDictionaryForLang } from "@/lib/dictionaries";

interface ProfileNotificationsPageProps {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ status?: string }>;
}

export default async function ProfileNotificationsPage({ params, searchParams }: ProfileNotificationsPageProps) {
  const { lang } = await params;
  const qs = searchParams ? await searchParams : undefined;
  const dict = await getDictionaryForLang(lang);
  const initialStatus = qs?.status === "unread" || qs?.status === "read" ? qs.status : "all";

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileNotifications lang={lang} initialReadFilter={initialStatus} />
      </Suspense>
    </ProfileLayout>
  );
}
