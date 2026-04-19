/**
 * 博客全屏 WebGL 氛围层（水波纹 / 极光）性能优化：
 * - 滚动时浏览器重绘与全屏透明 WebGL 争用 GPU → passive scroll 标记窗口内隔帧 draw；
 * - ResizeObserver 合并到下一帧 rAF，尺寸不变则跳过 setSize；
 * - 标签页隐藏时完全停止 rAF，避免后台仍按刷新率空转；
 * - setPixelRatio 上限减轻片段着色器填充压力。
 */

/** 博客氛围层 WebGL 建议像素比上限（全屏着色器片段填充压力大） */
export const BLOG_GL_MAX_DPR = 1.28;

export type BlogGlScrollBudget = {
  /** 滚动结束后的 holdMs 内隔帧返回 false，减轻与 scroll 管线抢 GPU */
  shouldRenderFrame: () => boolean;
  dispose: () => void;
};

/**
 * 监听 window scroll（passive）。滚动过程中约一半帧跳过 render；时间 uniforms 仍在各组件内每帧更新时可单独处理。
 *
 * @param holdMs 最后一次 scroll 事件后多久仍视为「滚动中」（默认 180ms）
 */
export function createScrollRenderBudget(holdMs = 180): BlogGlScrollBudget {
  let scrollUntil = 0;
  let parity = 0;

  const onScroll = () => {
    scrollUntil = performance.now() + holdMs;
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  const shouldRenderFrame = () => {
    const now = performance.now();
    if (now > scrollUntil) {
      return true;
    }
    parity ^= 1;
    return parity === 0;
  };

  const dispose = () => {
    window.removeEventListener("scroll", onScroll);
  };

  return { shouldRenderFrame, dispose };
}

/**
 * 博客氛围层默认滚动预算（180ms）。
 */
export function createBlogGlScrollBudget(): BlogGlScrollBudget {
  return createScrollRenderBudget(180);
}

export type TabVisibleRafHandle = {
  dispose: () => void;
};

/**
 * 仅在标签页可见时维持 rAF 循环；隐藏时取消调度，回到前台再由 visibilitychange 恢复。
 * 用于避免切后台/最小化后仍每秒触发数十次无用回调。
 */
export function runTabVisibleRafLoop(options: {
  onFrame: () => void;
  getDisposed: () => boolean;
}): TabVisibleRafHandle {
  let rafId = 0;

  const tick = () => {
    if (options.getDisposed()) return;
    if (document.visibilityState === "hidden") {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(tick);
    options.onFrame();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (!options.getDisposed() && rafId === 0) {
      rafId = requestAnimationFrame(tick);
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  if (document.visibilityState !== "hidden") {
    rafId = requestAnimationFrame(tick);
  }

  return {
    dispose: () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
  };
}

export type CoalescedResizeHandle = {
  observer: ResizeObserver;
  dispose: () => void;
};

/**
 * ResizeObserver 回调合并到单次 rAF，并在尺寸未变时跳过。
 */
export function attachCoalescedResize(
  el: HTMLElement,
  onSizeChange: (width: number, height: number) => void
): CoalescedResizeHandle {
  let rafId = 0;
  let lastW = -1;
  let lastH = -1;

  const flush = () => {
    rafId = 0;
    if (!el.isConnected) return;
    const w = Math.floor(el.clientWidth);
    const h = Math.floor(el.clientHeight);
    if (w < 2 || h < 2) return;
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    onSizeChange(w, h);
  };

  const observer = new ResizeObserver(() => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(flush);
  });

  observer.observe(el);

  /* 首帧同步一次尺寸，避免首屏 0×0 或等不到 ResizeObserver */
  requestAnimationFrame(flush);

  const dispose = () => {
    if (rafId) cancelAnimationFrame(rafId);
    observer.disconnect();
  };

  return { observer, dispose };
}
