/**
 * 「关于」页背景音乐配置。
 *
 * 说明（产品向）：
 * - 默认通过服务端 API 拉取网易云歌单中的可免费播放曲目（见 /api/music/netease/free-tracks）。
 * - 当接口不可用时会回退到本文件中的静态曲目，保证播放器始终可用。
 * - 请将外链替换成你希望打开的网易云歌曲页面。
 * - 封面图需为 next/image 允许的域名，或使用 /public 下本地图片路径。
 */
export const ABOUT_PLAYLIST_CONFIG = [
  {
    /** 与 dictionaries 中 aboutPage.tracks 的键一致 */
    id: "desk-jazz",
    /** 兜底外链：网易云歌曲页 */
    externalUrl: "https://music.163.com/#/song?id=447925558",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=480&h=480&fit=crop",
    /**
     * 兜底试听：当网易云接口不可用时，仍可播放。
     * 如需完全依赖网易云接口，可删除该字段。
     */
    previewAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    /** 可选：用于和网易云开放接口返回结果做映射匹配 */
    neteaseSongId: 447925558,
  },
  {
    id: "night-drive",
    externalUrl: "https://music.163.com/#/song?id=1300728316",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop",
    previewAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    neteaseSongId: 1300728316,
  },
  {
    id: "rain-notes",
    externalUrl: "https://music.163.com/#/song?id=1824045033",
    coverUrl: "https://images.unsplash.com/photo-1461783436728-0a9217714694?w=480&h=480&fit=crop",
    previewAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    neteaseSongId: 1824045033,
  },
] as const;

export type AboutPlaylistConfigItem = (typeof ABOUT_PLAYLIST_CONFIG)[number];
