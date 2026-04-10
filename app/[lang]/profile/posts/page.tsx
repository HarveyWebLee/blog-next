import { Suspense } from "react";

import ProfileLayout from "@/components/profile/profile-layout";
import ProfileLoading from "@/components/profile/profile-loading";
import ProfilePosts from "@/components/profile/profile-posts";
import { getDictionary } from "@/lib/dictionaries";

interface ProfilePostsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfilePostsPage({ params }: ProfilePostsPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <Suspense fallback={<ProfileLoading />}>
        <ProfilePosts lang={lang} />
      </Suspense>
    </ProfileLayout>
  );
}
