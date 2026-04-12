"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ABOUT_PLAYLIST_CONFIG } from "@/lib/about/playlist";
import { cn } from "@/lib/utils";

/** 词典中关于页音乐区块 + 各曲目标题 */
export type AboutMusicCopy = {
  musicTitle: string;
  musicLead: string;
  musicPlaylist: string;
  musicNoPreview: string;
  musicPrev: string;
  musicNext: string;
  musicPlay: string;
  musicPause: string;
  musicMute: string;
  musicUnmute: string;
  tracks: Record<string, { title: string; artist: string }>;
};

export type AboutMusicPlayerTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  qqMusicUrl: string;
  previewAudioUrl?: string;
};

type Props = {
  copy: AboutMusicCopy;
};

export function AboutMusicPlayer({ copy }: Props) {
  const tracks: AboutMusicPlayerTrack[] = useMemo(
    () =>
      ABOUT_PLAYLIST_CONFIG.map((row) => {
        const labels = copy.tracks[row.id] ?? { title: row.id, artist: "—" };
        const preview = "previewAudioUrl" in row ? row.previewAudioUrl : undefined;
        return {
          id: row.id,
          title: labels.title,
          artist: labels.artist,
          coverUrl: row.coverUrl,
          qqMusicUrl: row.qqMusicUrl,
          previewAudioUrl: preview,
        };
      }),
    [copy.tracks]
  );

  const [index, setIndex] = useState(0);
  const current = tracks[index] ?? tracks[0];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const hasPreview = Boolean(current?.previewAudioUrl);

  /** 切换曲目时重置音频状态 */
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      a.load();
    }
  }, [index, current?.previewAudioUrl]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (!a.duration || !Number.isFinite(a.duration)) return;
      setProgress(a.currentTime / a.duration);
      setDuration(a.duration);
    };
    const onMeta = () => {
      if (a.duration && Number.isFinite(a.duration)) setDuration(a.duration);
    };
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
    };
  }, [index, hasPreview, current?.id]);

  const togglePlay = useCallback(async () => {
    if (!current || !hasPreview) return;
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }, [current, hasPreview, playing]);

  const seek = useCallback(
    (ratio: number) => {
      const a = audioRef.current;
      if (!a || !hasPreview || !a.duration) return;
      const next = Math.min(1, Math.max(0, ratio)) * a.duration;
      a.currentTime = next;
      setProgress(next / a.duration);
    },
    [hasPreview]
  );

  const formatTime = (t: number) => {
    if (!Number.isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentTimeSec = duration * progress;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 bg-gradient-to-br from-background/95 to-muted/30 shadow-xl",
        "transition-[transform,box-shadow] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/[0.1] dark:hover:shadow-black/40",
        "motion-reduce:transition-shadow motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-xl"
      )}
    >
      {current?.previewAudioUrl ? (
        <audio key={current.id} ref={audioRef} src={current.previewAudioUrl} muted={muted} preload="metadata" />
      ) : null}

      {/* 背景：当前封面模糊叠底 */}
      {current ? (
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <Image src={current.coverUrl} alt="" fill className="scale-110 object-cover blur-2xl" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-stretch md:gap-8">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
          <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-primary/15 md:mx-0 md:h-44 md:w-44">
            {current ? (
              <Image src={current.coverUrl} alt="" fill className="object-cover" sizes="176px" priority={index === 0} />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-3 text-center md:text-left">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary/80">{copy.musicPlaylist}</p>
              <h3 className="truncate text-xl font-semibold md:text-2xl">{current?.title}</h3>
              <p className="truncate text-sm text-muted-foreground">{current?.artist}</p>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{copy.musicLead}</p>

            {/* 进度条：仅在有试听源时可用 */}
            <div className="space-y-1">
              <div
                role="slider"
                tabIndex={hasPreview ? 0 : -1}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className={`relative h-2 w-full overflow-hidden rounded-full bg-muted ${hasPreview ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                onKeyDown={(e) => {
                  if (!hasPreview) return;
                  if (e.key === "ArrowRight") seek(progress + 0.05);
                  if (e.key === "ArrowLeft") seek(progress - 0.05);
                }}
                onClick={(e) => {
                  if (!hasPreview) return;
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  seek((e.clientX - rect.left) / rect.width);
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>{formatTime(currentTimeSec)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              {!hasPreview ? (
                <p className="text-center text-xs text-muted-foreground md:text-left">{copy.musicNoPreview}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label={copy.musicPrev}
                onClick={() => setIndex((i) => (i - 1 + tracks.length) % tracks.length)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                disabled={!hasPreview}
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
                aria-label={playing ? copy.musicPause : copy.musicPlay}
                onClick={() => void togglePlay()}
              >
                {hasPreview && playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label={copy.musicNext}
                onClick={() => setIndex((i) => (i + 1) % tracks.length)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {hasPreview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label={muted ? copy.musicUnmute : copy.musicMute}
                  onClick={() => {
                    setMuted((m) => {
                      const next = !m;
                      if (audioRef.current) audioRef.current.muted = next;
                      return next;
                    });
                  }}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* 侧栏列表 */}
        <div className="w-full shrink-0 pt-6 md:w-56 md:shrink-0 md:pt-0 md:pl-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{copy.musicPlaylist}</p>
          <ul className="space-y-1">
            {tracks.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "group/track flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm",
                    "transition-[transform,background-color,color,box-shadow] duration-200 ease-out",
                    i === index
                      ? "bg-primary/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/75 hover:text-foreground hover:shadow-sm",
                    "active:scale-[0.99] motion-reduce:active:scale-100"
                  )}
                >
                  <span className="inline-block h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={t.coverUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 object-cover transition-transform duration-200 ease-out group-hover/track:scale-105"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{t.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
