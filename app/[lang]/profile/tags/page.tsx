import ProfileLayout from "@/components/profile/profile-layout";
import { getDictionaryForLang } from "@/lib/dictionaries";
// 与 profile/categories 一致：`@/app/[lang]/...` 在 tsc 下不稳定，改用相对路径
import TagsManagePage from "../../tags/manage/page";

interface ProfileTagsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfileTagsPage({ params }: ProfileTagsPageProps) {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <TagsManagePage />
    </ProfileLayout>
  );
}
