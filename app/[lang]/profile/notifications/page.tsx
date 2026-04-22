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
  const n = (dict as any).profile?.notifications ?? {};

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfileNotifications
          lang={lang}
          initialReadFilter={initialStatus}
          text={{
            title: n.title ?? "",
            subtitle: n.subtitle ?? "",
            markAllRead: n.markAllRead ?? "",
            clearRead: n.clearRead ?? "",
            allTypes: n.allTypes ?? "",
            allStatus: n.allStatus ?? "",
            unread: n.unread ?? "",
            read: n.read ?? "",
            isNew: n.isNew ?? "",
            readAt: n.readAt ?? "",
            markAsRead: n.markAsRead ?? "",
            delete: n.delete ?? "",
            more: n.more ?? "",
            primaryActions: {
              comment: n.primaryActions?.comment ?? "",
              like: n.primaryActions?.like ?? "",
              follow: n.primaryActions?.follow ?? "",
              mention: n.primaryActions?.mention ?? "",
              system: n.primaryActions?.system ?? "",
            },
            followBackDone: n.followBackDone ?? "",
            emptyMatch: n.emptyMatch ?? "",
            empty: n.empty ?? "",
            emptyMatchDesc: n.emptyMatchDesc ?? "",
            emptyDesc: n.emptyDesc ?? "",
            refresh: n.refresh ?? "",
            followerMissing: n.followerMissing ?? "",
            followBackOk: n.followBackOk ?? "",
            followBackFail: n.followBackFail ?? "",
            labels: {
              comment: n.labels?.comment ?? "",
              like: n.labels?.like ?? "",
              follow: n.labels?.follow ?? "",
              mention: n.labels?.mention ?? "",
              system: n.labels?.system ?? "",
            },
            agoMin: n.agoMin ?? "",
            agoHour: n.agoHour ?? "",
            agoDay: n.agoDay ?? "",
            loadMore: n.loadMore ?? "",
            loadingMore: n.loadingMore ?? "",
          }}
        />
      </Suspense>
    </ProfileLayout>
  );
}
