import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";

type NeteasePlaylistTrack = {
  id: number;
  name: string;
  fee: number;
  noCopyrightRcmd?: unknown;
  ar?: Array<{ name?: string }>;
  al?: { picUrl?: string };
};

type NeteaseSongUrl = {
  id: number;
  url: string | null;
  freeTrialInfo?: unknown;
};

type NeteaseTrackDto = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  externalUrl: string;
  previewAudioUrl: string;
};

const DEFAULT_PLAYLIST_ID = "3778678";
const DEFAULT_BASE_URL = "https://netease-cloud-music-api-five-roan.vercel.app";

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function handleNeteaseFreeTracksGET(_request: NextRequest) {
  const baseUrl = (process.env.NETEASE_OPEN_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const playlistId = process.env.NETEASE_PLAYLIST_ID || DEFAULT_PLAYLIST_ID;
  const limit = Number(process.env.NETEASE_PLAYLIST_LIMIT || "12");

  try {
    const timeoutA = withTimeout(8000);
    const playlistRes = await fetch(
      `${baseUrl}/playlist/track/all?id=${encodeURIComponent(playlistId)}&limit=${Math.max(1, limit)}`,
      { cache: "no-store", signal: timeoutA.signal }
    );
    timeoutA.clear();
    if (!playlistRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "网易云歌单拉取失败",
          tracks: [] as NeteaseTrackDto[],
        },
        { status: 502 }
      );
    }

    const playlistJson = (await playlistRes.json()) as { songs?: NeteasePlaylistTrack[] };
    const songs = Array.isArray(playlistJson.songs) ? playlistJson.songs : [];
    if (songs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "歌单为空",
        tracks: [] as NeteaseTrackDto[],
      });
    }

    // fee=1 通常表示 VIP 付费曲目；过滤后仅保留可免费播放候选。
    const freeCandidates = songs.filter((song) => song.fee !== 1 && !song.noCopyrightRcmd).slice(0, Math.max(1, limit));
    const songIds = freeCandidates.map((song) => song.id);

    if (songIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "未找到可免费播放曲目",
        tracks: [] as NeteaseTrackDto[],
      });
    }

    const timeoutB = withTimeout(8000);
    const urlRes = await fetch(`${baseUrl}/song/url/v1?id=${songIds.join(",")}&level=standard`, {
      cache: "no-store",
      signal: timeoutB.signal,
    });
    timeoutB.clear();
    if (!urlRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "网易云歌曲地址拉取失败",
          tracks: [] as NeteaseTrackDto[],
        },
        { status: 502 }
      );
    }

    const urlJson = (await urlRes.json()) as { data?: NeteaseSongUrl[] };
    const urlMap = new Map<number, NeteaseSongUrl>();
    for (const row of urlJson.data || []) {
      urlMap.set(row.id, row);
    }

    const tracks: NeteaseTrackDto[] = freeCandidates
      .map((song) => {
        const stream = urlMap.get(song.id);
        if (!stream?.url || stream.freeTrialInfo) return null;
        return {
          id: `netease-${song.id}`,
          title: song.name || `Song ${song.id}`,
          artist:
            song.ar
              ?.map((a) => a.name)
              .filter(Boolean)
              .join(" / ") || "Netease Cloud Music",
          coverUrl: song.al?.picUrl || "",
          externalUrl: `https://music.163.com/#/song?id=${song.id}`,
          previewAudioUrl: stream.url,
        };
      })
      .filter((item): item is NeteaseTrackDto => Boolean(item?.previewAudioUrl));

    return NextResponse.json({
      success: true,
      message: "网易云可播放曲目获取成功",
      tracks,
    });
  } catch (error) {
    throw error;
  }
}

export const { GET } = defineApiHandlers({ GET: handleNeteaseFreeTracksGET });
