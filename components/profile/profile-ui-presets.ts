/**
 * 个人中心与博客前台（BlogPageContent 等）共用的视觉预设，
 * 避免各子模块卡片样式漂移。
 */

/** 页面级背景：与博客列表一致 */
export const PROFILE_PAGE_BG = "min-h-screen bg-gradient-to-br from-background via-background to-primary/5";

/**
 * 玻璃拟态主卡片（筛选区、列表容器、设置表单等）
 * 与博客页 `Card className="border-0 bg-white/10 backdrop-blur-xl ..."` 对齐
 */
export const PROFILE_GLASS_CARD = "border-0 bg-white/10 backdrop-blur-xl animate-fade-in-up dark:bg-black/10";

/** 列表行卡片：略强调悬停反馈 */
export const PROFILE_GLASS_CARD_INTERACTIVE = `${PROFILE_GLASS_CARD} transition-colors hover:bg-white/[0.14] dark:hover:bg-black/[0.18]`;

/** 原生 select / input 与玻璃面板协调的样式 */
export const PROFILE_NATIVE_CONTROL =
  "rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder:text-default-400 focus:border-primary focus:outline-none dark:border-white/10 dark:bg-black/10";
