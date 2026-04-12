/**
 * 「关于」页背景音乐配置。
 *
 * 说明（产品向）：
 * - QQ 音乐未向第三方站点开放「全曲 Web 流媒体」公开 API；站内播放器使用 HTML5 Audio 播放
 *   你自有或可直链的试听资源（previewAudioUrl），完整收听仍跳转 QQ 音乐（qqMusicUrl）。
 * - 请在 QQ 音乐客户端对歌曲/歌单使用「分享 → 复制链接」，替换下面的 qqMusicUrl。
 * - 封面图需为 next/image 允许的域名，或使用 /public 下本地图片路径。
 */
export const ABOUT_PLAYLIST_CONFIG = [
  {
    /** 与 dictionaries 中 aboutPage.tracks 的键一致 */
    id: "desk-jazz",
    /** 示例：QQ 音乐巅峰榜入口，发布前请换成你的歌单/单曲分享链接 */
    qqMusicUrl: "https://y.qq.com/n/ryqq/toplist/62",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=480&h=480&fit=crop",
    /** 演示用短音频；生产环境可改为 /audio/xxx.mp3 等你持有的试听文件 */
    previewAudioUrl: "https://www.w3schools.com/html/horse.mp3",
  },
  {
    id: "night-drive",
    qqMusicUrl: "https://y.qq.com/n/ryqq/toplist/26",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop",
  },
] as const;

export type AboutPlaylistConfigItem = (typeof ABOUT_PLAYLIST_CONFIG)[number];
