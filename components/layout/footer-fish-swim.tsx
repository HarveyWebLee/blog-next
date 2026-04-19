"use client";

/**
 * 页脚「飞鱼 + 水面波纹」Canvas 层：移植自你提供的 renderer.js（RENDERER / SURFACE_POINT / FISH）。
 *
 * 与原 demo 的差异（刻意为之）：
 * - 使用 ResizeObserver + 容器尺寸重建场景（修正原稿里 window.width 等 jQuery API 写法）；
 * - pointer-events-none：不拦截底部链接/表单，因此不绑定 mouseenter / mousemove / click（鱼运动仍会 generateEpicenter，保留水波扰动来源）；
 * - rAF 接入 runTabVisibleRafLoop：后台标签页停画；
 * - prefers-reduced-motion：不挂载；
 * - 绘制使用 canvas globalAlpha（EFFECT_CONTENT_ALPHA），减轻「水色」遮挡底部内容。
 *
 * 布局与水位（与 footer 等高对齐）：
 * - 效果容器高 = footer.clientHeight × LAYOUT_HEIGHT_MULTIPLIER（默认 2）；canvas 铺满容器。
 * - INIT_HEIGHT_RATE = 0.5 → 水面平衡在画布垂直中线，xor 水体为画布下半（高度 = 画布高/2）。
 *   当画布高 = 2×footer 时，下半高度 = footer 高度；容器 bottom 对齐 footer。footer 已去掉 `overflow-hidden` 时，
 *   画布向上多出的半幅可能叠在页脚上方主内容区（仍 `pointer-events-none` 不挡操作）。
 *
 * 逻辑坐标使用容器 CSS 像素；backing store = 逻辑尺寸 × `quantizeCanvasBackingLength(css, resolveFooterCanvasBackingDpr())`，
 * `setTransform(dpr,...)` 后绘图仍为逻辑坐标；并监听 `resize`/`visualViewport` 以便缩放或换屏时刷新 DPR。
 */
import { useEffect, useRef, useState } from "react";

import { attachCoalescedResize, BLOG_GL_MAX_DPR, runTabVisibleRafLoop } from "@/lib/utils/blog-webgl-performance";

/**
 * Footer 仅占横向一条，相较全屏 WebGL（`BLOG_GL_MAX_DPR`）可适当提高像素比以利锐度；
 * 仍设上限避免 3×、4× 机上分配过大离屏位图。
 */
const FOOTER_CANVAS_MAX_DPR = Math.min(2, BLOG_GL_MAX_DPR + 0.72);

/** 解析当前显示设备像素比并钳制（缩放、窗口拖到不同 DPI 显示器等会改变 `devicePixelRatio`） */
function resolveFooterCanvasBackingDpr(): number {
  if (typeof window === "undefined") return 1;
  const raw = window.devicePixelRatio ?? 1;
  /** 下限避免极端缩放下位图为 0；上限见 `FOOTER_CANVAS_MAX_DPR` */
  return Math.min(Math.max(raw, 0.25), FOOTER_CANVAS_MAX_DPR);
}

/** 逻辑 CSS 像素 × DPR → 位图整数边长，圆整避免单侧 floor 导致的模糊不对称 */
function quantizeCanvasBackingLength(cssPx: number, dpr: number): number {
  return Math.max(1, Math.round(cssPx * dpr));
}

/**
 * 整层 Canvas 绘制不透明度（0~1）：数值越低越能透过效果看到 footer 文案与卡片。
 * （与外层 div 的 opacity 叠加会过暗，故由 canvas 单独控制，外层保持不透明。）
 */
const EFFECT_CONTENT_ALPHA = 0.26;

/** 相对原 renderer.js 的整体降速系数（水平/垂直/加速度/重力） */
const SPEED_SCALE = 0.55;

/**
 * 鱼身与 xor 水面多边形共用填充色。
 * 原教程使用 `hsl(0, 0%, 95%)`（无彩、接近白），叠 `globalCompositeOperation: xor` 与半透明后，
 * 在有色背景上很容易看成「发白 / 漂白」一块；改用低亮、略饱和的青蓝，更像浅水且不会抢成纯白。
 */
const WATER_AND_FISH_FILL = "hsl(198, 42%, 52%)";

/** 效果容器相对 footer 高度的倍数（画布逻辑高 = footer 高 × 该值） */
const LAYOUT_HEIGHT_MULTIPLIER = 2;

/**
 * 水面弹簧平衡高度占画布逻辑高的比例。
 * 固定为 0.5：波面约在画布垂直中线，水体为下半；当画布高 = 2×footer 时，下半高 = footer 高。
 */
const INIT_HEIGHT_RATE = 0.5;

/** 对应原 RENDERER 常量 */
const POINT_INTERVAL = 5;
const FISH_COUNT = 3;
const MAX_INTERVAL_COUNT = 50;
const THRESHOLD = 50;

type SurfacePointForce = { previous: number; next: number };

/**
 * 水面采样点：弹簧 + 相邻扩散（与原 SURFACE_POINT 一致）
 */
class SurfacePoint {
  static readonly SPRING_CONSTANT = 0.03;
  static readonly SPRING_FRICTION = 0.9;
  static readonly WAVE_SPREAD = 0.3;
  static readonly ACCELARATION_RATE = 0.01;

  renderer: FlyingFishRenderer;
  x: number;
  initHeight = 0;
  height = 0;
  fy = 0;
  force: SurfacePointForce = { previous: 0, next: 0 };
  previous: SurfacePoint | null = null;
  next: SurfacePoint | null = null;

  constructor(renderer: FlyingFishRenderer, x: number) {
    this.renderer = renderer;
    this.x = x;
    this.init();
  }

  init() {
    this.initHeight = this.renderer.height * INIT_HEIGHT_RATE;
    this.height = this.initHeight;
    this.fy = 0;
    this.force = { previous: 0, next: 0 };
  }

  setPreviousPoint(previous: SurfacePoint) {
    this.previous = previous;
  }

  setNextPoint(next: SurfacePoint) {
    this.next = next;
  }

  interfere(y: number, velocity: number) {
    const { height: H } = this.renderer;
    /** 鱼变慢后波纹能量略收紧，水面更「轻」 */
    this.fy +=
      H * SurfacePoint.ACCELARATION_RATE * SPEED_SCALE * (H - this.height - y >= 0 ? -1 : 1) * Math.abs(velocity);
  }

  updateSelf() {
    this.fy += SurfacePoint.SPRING_CONSTANT * (this.initHeight - this.height);
    this.fy *= SurfacePoint.SPRING_FRICTION;
    this.height += this.fy;
  }

  updateNeighbors() {
    if (this.previous) {
      this.force.previous = SurfacePoint.WAVE_SPREAD * (this.height - this.previous.height);
    }
    if (this.next) {
      this.force.next = SurfacePoint.WAVE_SPREAD * (this.height - this.next.height);
    }
  }

  render(context: CanvasRenderingContext2D) {
    if (this.previous) {
      this.previous.height += this.force.previous;
      this.previous.fy += this.force.previous;
    }
    if (this.next) {
      this.next.height += this.force.next;
      this.next.fy += this.force.next;
    }
    context.lineTo(this.x, this.renderer.height - this.height);
  }
}

/**
 * 飞鱼：贝塞尔曲线外形 + 尾鳍摆动（与原 FISH 一致）
 */
class Fish {
  static readonly GRAVITY = 0.4 * SPEED_SCALE;

  renderer: FlyingFishRenderer;
  direction = false;
  x = 0;
  y = 0;
  previousY = 0;
  vx = 0;
  vy = 0;
  ay = 0;
  isOut = false;
  theta = 0;
  phi = 0;

  constructor(renderer: FlyingFishRenderer) {
    this.renderer = renderer;
    this.init();
  }

  getRandomValue(min: number, max: number) {
    return min + (max - min) * Math.random();
  }

  init() {
    const { width: W, height: H, reverse } = this.renderer;
    this.direction = Math.random() < 0.5;
    this.x = this.direction ? W + THRESHOLD : -THRESHOLD;
    this.previousY = this.y;
    this.vx = this.getRandomValue(4, 10) * SPEED_SCALE * (this.direction ? -1 : 1);

    if (reverse) {
      this.y = this.getRandomValue(H * (1 / 10), H * (4 / 10));
      this.vy = this.getRandomValue(2, 5) * SPEED_SCALE;
      this.ay = this.getRandomValue(0.05, 0.2) * SPEED_SCALE;
    } else {
      this.y = this.getRandomValue(H * (6 / 10), H * (9 / 10));
      this.vy = this.getRandomValue(-5, -2) * SPEED_SCALE;
      this.ay = this.getRandomValue(-0.2, -0.05) * SPEED_SCALE;
    }
    this.isOut = false;
    this.theta = 0;
    this.phi = 0;
  }

  reverseVertical() {
    this.isOut = !this.isOut;
    this.ay *= -1;
  }

  controlStatus(_context: CanvasRenderingContext2D) {
    const { width: W, height: H, reverse } = this.renderer;
    this.previousY = this.y;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.ay;

    if (reverse) {
      if (this.y > H * INIT_HEIGHT_RATE) {
        this.vy -= Fish.GRAVITY;
        this.isOut = true;
      } else {
        if (this.isOut) {
          this.ay = this.getRandomValue(0.05, 0.2) * SPEED_SCALE;
        }
        this.isOut = false;
      }
    } else {
      if (this.y < H * INIT_HEIGHT_RATE) {
        this.vy += Fish.GRAVITY;
        this.isOut = true;
      } else {
        if (this.isOut) {
          this.ay = this.getRandomValue(-0.2, -0.05) * SPEED_SCALE;
        }
        this.isOut = false;
      }
    }

    if (!this.isOut) {
      /** 摆尾略放慢，与整体降速一致 */
      this.theta += Math.PI / 26;
      this.theta %= Math.PI * 2;
      this.phi += Math.PI / 38;
      this.phi %= Math.PI * 2;
    }

    this.renderer.generateEpicenter(this.x + (this.direction ? -1 : 1) * THRESHOLD, this.y, this.y - this.previousY);

    if ((this.vx > 0 && this.x > W + THRESHOLD) || (this.vx < 0 && this.x < -THRESHOLD)) {
      this.init();
    }
  }

  render(context: CanvasRenderingContext2D) {
    const { reverse } = this.renderer;
    context.save();
    context.translate(this.x, this.y);
    context.rotate(Math.PI + Math.atan2(this.vy, this.vx));
    context.scale(1, this.direction ? 1 : -1);
    context.beginPath();
    context.moveTo(-30, 0);
    context.bezierCurveTo(-20, 15, 15, 10, 40, 0);
    context.bezierCurveTo(15, -10, -20, -15, -30, 0);
    context.fill();

    context.save();
    context.translate(40, 0);
    context.scale(0.9 + 0.2 * Math.sin(this.theta), 1);
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(5, 10, 20, 8);
    context.quadraticCurveTo(12, 5, 10, 0);
    context.quadraticCurveTo(12, -5, 20, -8);
    context.quadraticCurveTo(5, -10, 0, 0);
    context.fill();
    context.restore();

    context.save();
    context.translate(-3, 0);
    context.rotate((Math.PI / 3 + (Math.PI / 10) * Math.sin(this.phi)) * (reverse ? -1 : 1));

    context.beginPath();

    if (reverse) {
      context.moveTo(5, 0);
      context.bezierCurveTo(10, 10, 10, 30, 0, 40);
      context.bezierCurveTo(-12, 25, -8, 10, 0, 0);
    } else {
      context.moveTo(-5, 0);
      context.bezierCurveTo(-10, -10, -10, -30, 0, -40);
      context.bezierCurveTo(12, -25, 8, -10, 0, 0);
    }
    context.closePath();
    context.fill();
    context.restore();
    context.restore();
    this.controlStatus(context);
  }
}

/**
 * 主渲染器（对应原 RENDERER）
 */
class FlyingFishRenderer {
  points: SurfacePoint[] = [];
  fishes: Fish[] = [];
  intervalCount = MAX_INTERVAL_COUNT;
  width = 0;
  height = 0;
  fishCount = 0;
  pointInterval = 0;
  reverse = false;

  private readonly context: CanvasRenderingContext2D;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  /** 重建点列与初始鱼（对应原 setup） */
  setup(logicalWidth: number, logicalHeight: number) {
    this.points = [];
    this.fishes = [];
    this.intervalCount = MAX_INTERVAL_COUNT;
    this.width = logicalWidth;
    this.height = logicalHeight;

    this.fishCount = FISH_COUNT * (logicalWidth / 500) * (logicalHeight / 500);

    /** 与原 createSurfacePoints 一致，避免 count<2 时除零 */
    const rawCount = Math.round(logicalWidth / POINT_INTERVAL);
    const count = Math.max(2, rawCount);
    this.pointInterval = logicalWidth / (count - 1);

    this.points.push(new SurfacePoint(this, 0));
    for (let i = 1; i < count; i++) {
      const point = new SurfacePoint(this, i * this.pointInterval);
      const previous = this.points[i - 1];
      point.setPreviousPoint(previous);
      previous.setNextPoint(point);
      this.points.push(point);
    }

    this.fishes.push(new Fish(this));
  }

  /**
   * 鱼身扰动水面：仅当点击目标在竖直条带内时起作用（与原 generateEpicenter 一致）
   */
  generateEpicenter(x: number, y: number, velocity: number) {
    const H = this.height;
    const T = THRESHOLD;
    if (y < H / 2 - T || y > H / 2 + T) {
      return;
    }
    const index = Math.round(x / this.pointInterval);
    if (index < 0 || index >= this.points.length) {
      return;
    }
    this.points[index].interfere(y, velocity);
  }

  /**
   * 翻转「上下」游动区域（原 reverseVertical + 全局 reverse）；
   * footer 不可点时用 ref 暴露给调试，默认不调用。
   */
  reverseVertical() {
    this.reverse = !this.reverse;
    for (let i = 0, count = this.fishes.length; i < count; i++) {
      this.fishes[i].reverseVertical();
    }
  }

  controlStatus() {
    for (let i = 0, count = this.points.length; i < count; i++) {
      this.points[i].updateSelf();
    }
    for (let i = 0, count = this.points.length; i < count; i++) {
      this.points[i].updateNeighbors();
    }
    if (this.fishes.length < this.fishCount) {
      this.intervalCount -= 1;
      if (this.intervalCount === 0) {
        this.intervalCount = MAX_INTERVAL_COUNT;
        this.fishes.push(new Fish(this));
      }
    }
  }

  renderFrame() {
    const ctx = this.context;
    const { width: W, height: H, reverse } = this;

    this.controlStatus();

    ctx.clearRect(0, 0, W, H);

    ctx.save();
    /** 降低鱼与水面的不透明度，便于阅读 footer 主体内容 */
    ctx.globalAlpha = EFFECT_CONTENT_ALPHA;
    ctx.fillStyle = WATER_AND_FISH_FILL;

    for (let i = 0, count = this.fishes.length; i < count; i++) {
      this.fishes[i].render(ctx);
    }

    ctx.globalCompositeOperation = "xor";
    ctx.beginPath();
    ctx.moveTo(0, reverse ? 0 : H);

    for (let i = 0, count = this.points.length; i < count; i++) {
      this.points[i].render(ctx);
    }

    ctx.lineTo(W, reverse ? 0 : H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  dispose() {
    this.points = [];
    this.fishes = [];
  }
}

export function FooterFishSwim() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlyingFishRenderer | null>(null);
  const disposedRef = useRef(false);

  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAllowMotion(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!allowMotion) return;

    disposedRef.current = false;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    /** alpha 默认 true；显式传入以便未来按需改（如离线 buffer） */
    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: false,
      willReadFrequently: false,
    });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const renderer = new FlyingFishRenderer(ctx);
    rendererRef.current = renderer;

    /** 以 footer（父级）尺寸为基准：画布宽 = footer 宽，画布逻辑高 = footer 高 × LAYOUT_HEIGHT_MULTIPLIER */
    const footerEl = wrap.parentElement;
    if (!footerEl) return;

    /**
     * 同一布局签名则跳过：避免 `resize` 与 ResizeObserver 重复触发的二次 `setup`；
     * 仅 DPR 变而 footer 尺寸未变时签名会变，仍会重建位图与 transform。
     */
    let lastLayoutSig = "";

    const applyFooterCanvasLayout = (footerW?: number, footerH?: number) => {
      const fw = footerW ?? footerEl.clientWidth;
      const fh = footerH ?? footerEl.clientHeight;
      if (fw < 2 || fh < 2) return;

      const logicalW = fw;
      const logicalH = fh * LAYOUT_HEIGHT_MULTIPLIER;
      const dpr = resolveFooterCanvasBackingDpr();
      const sig = `${logicalW}x${logicalH}@${dpr.toFixed(4)}`;
      if (sig === lastLayoutSig) return;
      lastLayoutSig = sig;

      wrap.style.height = `${logicalH}px`;

      const bw = quantizeCanvasBackingLength(logicalW, dpr);
      const bh = quantizeCanvasBackingLength(logicalH, dpr);
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = `${logicalW}px`;
      canvas.style.height = `${logicalH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.setup(logicalW, logicalH);
    };

    const resizeDispose = attachCoalescedResize(footerEl, (footerW, footerH) => {
      applyFooterCanvasLayout(footerW, footerH);
    });

    /** ResizeObserver 在「仅 devicePixelRatio 变化」时可能不回调，补一层 window / visualViewport */
    let rafAlign = 0;
    const scheduleAlignFromViewport = () => {
      if (rafAlign) cancelAnimationFrame(rafAlign);
      rafAlign = requestAnimationFrame(() => {
        rafAlign = 0;
        applyFooterCanvasLayout();
      });
    };
    window.addEventListener("resize", scheduleAlignFromViewport, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleAlignFromViewport);

    const rafHandle = runTabVisibleRafLoop({
      getDisposed: () => disposedRef.current,
      onFrame: () => {
        rendererRef.current?.renderFrame();
      },
    });

    return () => {
      disposedRef.current = true;
      window.removeEventListener("resize", scheduleAlignFromViewport);
      window.visualViewport?.removeEventListener("resize", scheduleAlignFromViewport);
      if (rafAlign) cancelAnimationFrame(rafAlign);
      resizeDispose.dispose();
      rafHandle.dispose();
      renderer.dispose();
      rendererRef.current = null;
      wrap.style.height = "";
      lastLayoutSig = "";
    };
  }, [allowMotion]);

  if (!allowMotion) {
    return null;
  }

  return (
    <div
      ref={wrapRef}
      /**
       * `bottom-0`：容器自下缘对齐 footer，高度为 footer 的 LAYOUT_HEIGHT_MULTIPLIER 倍（由内联 style 写入）。
       * 理想布局下 footer 内仍主要看到画布下半（水体）；无父级 overflow 时上半可能露在页脚外。
       */
      className="pointer-events-none absolute bottom-0 left-0 right-0 z-[25] w-full overflow-hidden select-none"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
