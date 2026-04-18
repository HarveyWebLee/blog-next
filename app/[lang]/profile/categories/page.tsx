import ProfileLayout from "@/components/profile/profile-layout";
import { getDictionaryForLang } from "@/lib/dictionaries";
// 动态路由目录名含 `[lang]`，别名 `@/app/[lang]/...` 在 tsc 下解析失败，使用相对路径导入管理页
import CategoriesManagePage from "../../categories/manage/page";

interface ProfileCategoriesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfileCategoriesPage({ params }: ProfileCategoriesPageProps) {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);

  return (
    <ProfileLayout lang={lang} dict={dict}>
      <CategoriesManagePage />
    </ProfileLayout>
  );
}
