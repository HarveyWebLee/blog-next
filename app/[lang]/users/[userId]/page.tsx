import { Suspense } from "react";

import ProfileLoading from "@/components/profile/profile-loading";
import PublicUserProfile from "@/components/profile/public-user-profile";

interface PublicUserPageProps {
  params: Promise<{ lang: string; userId: string }>;
}

export default async function PublicUserPage({ params }: PublicUserPageProps) {
  const { lang, userId } = await params;
  const parsedId = Number.parseInt(userId, 10);
  return (
    <Suspense fallback={<ProfileLoading />}>
      <PublicUserProfile lang={lang} userId={Number.isInteger(parsedId) ? parsedId : 0} />
    </Suspense>
  );
}
