"use client";

/**
 * 首页深色主题：不规则雪花飘落。
 * 性能：雪花为离屏预渲染精灵 + drawImage；无每帧 shadowBlur；delta 时间步；降 DPR；不可见时暂停 rAF。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

const SNOW_COUNT = 400;
const SNOW_COUNT_REDUCED = 55;
const SNOW_SIZE_SCALE = 1 / 2;

/** 精灵种类数（每种只画一次到离屏 Canvas） */
const SPRITE_VARIANTS = 16;
/** 精灵逻辑边长（CSS 像素），与 REF_BASE_R 一起决定清晰度 */
const SPRITE_LOGICAL = 44;

/** 精灵绘制用的基准半径（与 Snowflake.r 缩放对比） */
function refBaseRadius(): number {
  return (2.2 + 1.15 * 4.2) * SNOW_SIZE_SCALE;
}

type Twig = {
  angle: number;
  len: number;
  forkAngle: number | null;
  forkLen: number;
};

type Snowflake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayPhase: number;
  swayAmp: number;
  rotation: number;
  rotSpeed: number;
  r: number;
  /** 0 .. SPRITE_VARIANTS-1，对应预渲染精灵 */
  spriteIndex: number;
};

function randomTwigs(): Twig[] {
  const armCount = 5 + Math.floor(Math.random() * 5);
  const twigs: Twig[] = [];
  for (let i = 0; i < armCount; i++) {
    const baseA = (i / armCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const hasFork = Math.random() > 0.45;
    twigs.push({
      angle: baseA,
      len: 0.45 + Math.random() * 0.95,
      forkAngle: hasFork ? (Math.random() > 0.5 ? 0.35 : -0.4) + (Math.random() - 0.5) * 0.2 : null,
      forkLen: hasFork ? 0.25 + Math.random() * 0.45 : 0,
    });
  }
  return twigs;
}

function randomCrumbs(): { ox: number; oy: number; cr: number; rot: number; aspect: number }[] {
  const n = 2 + Math.floor(Math.random() * 5);
  const crumbs: { ox: number; oy: number; cr: number; rot: number; aspect: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * 0.55;
    crumbs.push({
      ox: Math.cos(a) * d,
      oy: Math.sin(a) * d,
      cr: 0.12 + Math.random() * 0.35,
      rot: Math.random() * Math.PI * 2,
      aspect: 0.65 + Math.random() * 0.45,
    });
  }
  return crumbs;
}

function drawSnowflakeShape(
  ctx: CanvasRenderingContext2D,
  baseRadius: number,
  alpha: number,
  twigs: Twig[],
  crumbs: { ox: number; oy: number; cr: number; rot: number; aspect: number }[]
) {
  const stroke = `rgba(255,255,255,${alpha})`;
  const fill = `rgba(255,255,255,${alpha * 0.92})`;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const t of twigs) {
    const lx = Math.cos(t.angle) * baseRadius * t.len;
    const ly = Math.sin(t.angle) * baseRadius * t.len;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(0.12, baseRadius * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(lx, ly);
    ctx.stroke();

    if (t.forkAngle != null && t.forkLen > 0) {
      const mx = lx * 0.55;
      const my = ly * 0.55;
      const fa = t.angle + t.forkAngle;
      const flx = Math.cos(fa) * baseRadius * t.forkLen;
      const fly = Math.sin(fa) * baseRadius * t.forkLen;
      ctx.lineWidth = Math.max(0.1, baseRadius * 0.07);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + flx, my + fly);
      ctx.stroke();
    }
  }

  ctx.fillStyle = fill;
  for (const c of crumbs) {
    const px = c.ox * baseRadius;
    const py = c.oy * baseRadius;
    const rr = c.cr * baseRadius;
    ctx.beginPath();
    ctx.ellipse(px, py, rr, rr * c.aspect, c.rot, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** 生成全部精灵（仅尺寸变化或首次调用时执行） */
function buildSnowflakeSprites(scale: number, dprSprite: number): HTMLCanvasElement[] {
  const refR = (2.2 + 1.15 * 4.2) * scale;
  const pad = SPRITE_LOGICAL / 2;
  const sprites: HTMLCanvasElement[] = [];
  for (let i = 0; i < SPRITE_VARIANTS; i++) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(SPRITE_LOGICAL * dprSprite);
    c.height = Math.ceil(SPRITE_LOGICAL * dprSprite);
    const sctx = c.getContext("2d", { alpha: true, willReadFrequently: true });
    if (!sctx) continue;
    sctx.setTransform(dprSprite, 0, 0, dprSprite, 0, 0);
    sctx.translate(pad, pad);
    drawSnowflakeShape(sctx, refR, 1, randomTwigs(), randomCrumbs());
    sprites.push(c);
  }
  return sprites;
}

function createSnowflakes(w: number, h: number, count: number): Snowflake[] {
  const flakes: Snowflake[] = [];
  for (let i = 0; i < count; i++) {
    flakes.push({
      x: Math.random() * w,
      y: Math.random() * (h + 120) - 140,
      vx: (Math.random() - 0.5) * 1.1,
      vy: 1.1 + Math.random() * 4.3,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: 0.15 + Math.random() * 0.55,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.036,
      r: 0.55 + Math.random() * 1.15,
      spriteIndex: Math.floor(Math.random() * SPRITE_VARIANTS),
    });
  }
  return flakes;
}

function respawnFlake(f: Snowflake, w: number, h: number) {
  f.x = Math.random() * w;
  f.y = -20 - Math.random() * 80;
  f.vx = (Math.random() - 0.5) * 1.1;
  f.vy = 1.1 + Math.random() * 4.3;
  f.swayPhase = Math.random() * Math.PI * 2;
  f.swayAmp = 0.15 + Math.random() * 0.55;
  f.rotation = Math.random() * Math.PI * 2;
  f.rotSpeed = (Math.random() - 0.5) * 0.036;
  f.r = 0.55 + Math.random() * 1.15;
  f.spriteIndex = Math.floor(Math.random() * SPRITE_VARIANTS);
}

export function HomeDarkStarfield() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakesRef = useRef<Snowflake[]>([]);
  const spritesRef = useRef<HTMLCanvasElement[] | null>(null);
  const rafRef = useRef<number>(0);
  const reduceMotionRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastFrameRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  /** 避免每帧 getContext（会触发额外开销） */
  const mainCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    setMounted(true);
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, freeze: boolean, dtSec: number) => {
      const flakes = flakesRef.current;
      const sprites = spritesRef.current;
      if (!sprites?.length) return;

      const refR = refBaseRadius();
      /** 与原先「每帧位移」等价：vx/vy 按 60fps 设计，故乘 dt*60 */
      const t60 = freeze ? 0 : dtSec * 60;

      ctx.clearRect(0, 0, w, h);

      for (const f of flakes) {
        if (!freeze && t60 > 0) {
          f.swayPhase += 0.024 * t60;
          const sway = Math.sin(f.swayPhase) * f.swayAmp;
          f.x += (f.vx + sway * 0.08) * t60;
          f.y += f.vy * t60;
          f.rotation += f.rotSpeed * t60;

          if (f.y > h + 30) {
            respawnFlake(f, w, h);
          }
          if (f.x < -40) f.x = w + 20;
          else if (f.x > w + 40) f.x = -20;
        }

        const depth = 0.35 + Math.min(1, f.vy / 5.6) * 0.55;
        const alpha = 0.18 + depth * 0.72;
        const baseR = (2.2 + f.r * 4.2) * SNOW_SIZE_SCALE;
        const dest = SPRITE_LOGICAL * (baseR / refR);

        const sp = sprites[f.spriteIndex % sprites.length];
        ctx.save();
        ctx.globalAlpha = Math.min(0.92, alpha);
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.drawImage(sp, 0, 0, sp.width, sp.height, -dest / 2, -dest / 2, dest, dest);
        ctx.restore();
      }
    },
    []
  );

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return false;

    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w < 2 || h < 2) return false;

    /** 装饰层限制 DPR，显著减轻像素填充压力 */
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });
    if (!ctx) return false;
    mainCtxRef.current = ctx;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
      sizeRef.current = { w, h };
      const count = reduceMotionRef.current ? SNOW_COUNT_REDUCED : SNOW_COUNT;
      flakesRef.current = createSnowflakes(w, h, count);
      spritesRef.current = buildSnowflakeSprites(SNOW_SIZE_SCALE, Math.min(2, dpr));
    }

    return true;
  }, []);

  const tick = useCallback(() => {
    if (!visibleRef.current) {
      return;
    }

    const ctx = mainCtxRef.current;
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    if (w < 2 || h < 2) return;

    const now = performance.now();
    const last = lastFrameRef.current ?? now;
    let dtSec = (now - last) / 1000;
    lastFrameRef.current = now;
    if (dtSec > 0.064) dtSec = 0.064;

    const freeze = reduceMotionRef.current;
    drawFrame(ctx, w, h, freeze, freeze ? 0 : dtSec);

    if (!freeze) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [drawFrame]);

  useEffect(() => {
    if (!mounted || resolvedTheme !== "dark") return;

    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (!document.hidden) {
        lastFrameRef.current = performance.now();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    visibleRef.current = !document.hidden;

    const start = () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = performance.now();
      if (!syncCanvasSize()) {
        return;
      }
      tick();
    };

    start();
    const rafBoot = requestAnimationFrame(() => {
      requestAnimationFrame(start);
    });

    const ro = new ResizeObserver(() => {
      start();
    });
    const el = containerRef.current;
    if (el) ro.observe(el);

    window.addEventListener("resize", start);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(rafBoot);
      ro.disconnect();
      window.removeEventListener("resize", start);
      flakesRef.current = [];
      spritesRef.current = null;
      mainCtxRef.current = null;
      sizeRef.current = { w: 0, h: 0 };
      lastFrameRef.current = null;
    };
  }, [mounted, resolvedTheme, syncCanvasSize, tick]);

  if (!mounted || resolvedTheme !== "dark") {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[1] min-h-full overflow-hidden"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
