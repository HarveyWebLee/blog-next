"use client";

const COPY_DEFAULT_TEXT = "复制";
const COPY_SUCCESS_TEXT = "已复制";
const COPY_ERROR_TEXT = "复制失败";

type PrismLike = {
  languages: Record<string, unknown>;
  highlight: (code: string, grammar: any, language: string) => string;
};

interface MountMarkdownCodeEnhancerOptions {
  highlighter?: PrismLike;
}

const DEBUG_STORAGE_KEY = "md-code-enhancer-debug";

type EnhancerStats = {
  copyClicks: number;
  copySuccess: number;
  copyFail: number;
  copyAvgDurationMs: number;
  observerCallbacks: number;
  observerMutations: number;
  observerIgnoredButtonMutations: number;
  enhancedBlocks: number;
};

const createInitialStats = (): EnhancerStats => ({
  copyClicks: 0,
  copySuccess: 0,
  copyFail: 0,
  copyAvgDurationMs: 0,
  observerCallbacks: 0,
  observerMutations: 0,
  observerIgnoredButtonMutations: 0,
  enhancedBlocks: 0,
});

const resolvePrismLanguage = (language: string): string => {
  const normalized = language.toLowerCase();
  if (normalized === "ts") return "typescript";
  if (normalized === "js") return "javascript";
  if (normalized === "md") return "markdown";
  if (normalized === "yml") return "yaml";
  if (normalized === "sh" || normalized === "shell") return "bash";
  return normalized;
};

/**
 * 给 Markdown 渲染出来的 pre 代码块补充统一能力：
 * 1) 语言角标（data-code-lang）
 * 2) 复制按钮（.md-code-copy-btn）
 * 3) 内容变化时自动补挂（MutationObserver）
 */
export function mountMarkdownCodeEnhancer(
  root: HTMLElement,
  options: MountMarkdownCodeEnhancerOptions = {}
): () => void {
  const { highlighter } = options;
  const stats = createInitialStats();
  const isDebugEnabled = () => {
    try {
      return window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  };
  const exposeStats = () => {
    (window as typeof window & { __MD_CODE_ENHANCER_STATS__?: EnhancerStats }).__MD_CODE_ENHANCER_STATS__ = stats;
  };
  const debugLog = (message: string, payload?: Record<string, unknown>) => {
    if (!isDebugEnabled()) return;
    console.debug("[markdown-code-enhancer]", message, payload ?? {});
  };
  const updateCopyDuration = (durationMs: number) => {
    const prevCount = stats.copyClicks;
    if (prevCount <= 0) {
      stats.copyAvgDurationMs = durationMs;
      return;
    }
    // 增量均值，避免额外存储每次点击样本，同时可长期观测体验波动
    stats.copyAvgDurationMs = (stats.copyAvgDurationMs * (prevCount - 1) + durationMs) / prevCount;
  };

  exposeStats();

  const isDarkMode = (el: HTMLElement) => {
    const scopedThemeHost = el.closest(".dark, [data-theme='dark']");
    if (scopedThemeHost) return true;

    const scopedScheme = window.getComputedStyle(el).getPropertyValue("color-scheme").trim().toLowerCase();
    if (scopedScheme.includes("dark")) return true;

    if (typeof document === "undefined") return false;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const htmlDark = htmlEl.classList.contains("dark") || htmlEl.getAttribute("data-theme") === "dark";
    const bodyDark = bodyEl?.classList.contains("dark") || bodyEl?.getAttribute("data-theme") === "dark";
    return Boolean(htmlDark || bodyDark);
  };

  const applyCodeBlockTheme = (block: HTMLElement, codeEl?: HTMLElement | null, copyBtn?: HTMLElement | null) => {
    if (isDarkMode(block)) {
      // 暗色代码块改为中性深灰，降低“过黑”压迫感
      block.style.setProperty("background", "#1f2937", "important");
      block.style.setProperty("background-color", "#1f2937", "important");
      block.style.setProperty("background-image", "none", "important");
      block.style.setProperty("border-color", "#4b5563", "important");
      block.style.setProperty("color", "#f3f4f6", "important");
      codeEl?.style.setProperty("color", "#f3f4f6", "important");
      copyBtn?.style.setProperty("background", "#273449", "important");
      copyBtn?.style.setProperty("background-color", "#273449", "important");
      copyBtn?.style.setProperty("border-color", "#5b6b82", "important");
      copyBtn?.style.setProperty("color", "#e5e7eb", "important");
    } else {
      block.style.setProperty("background", "#f1f5f9", "important");
      block.style.setProperty("background-color", "#f1f5f9", "important");
      block.style.setProperty("background-image", "none", "important");
      block.style.setProperty("border-color", "#cbd5e1", "important");
      block.style.setProperty("color", "#1f2937", "important");
      codeEl?.style.setProperty("color", "#1f2937", "important");
      copyBtn?.style.setProperty("background", "#f8fafc", "important");
      copyBtn?.style.setProperty("background-color", "#f8fafc", "important");
      copyBtn?.style.setProperty("border-color", "#cbd5e1", "important");
      copyBtn?.style.setProperty("color", "#475569", "important");
    }
  };

  const enhanceCodeBlock = (block: HTMLElement) => {
    // 仅处理代码块，避免误伤普通 pre（如第三方组件占位节点）
    if (!block.matches("pre")) return;
    const className = block.className || "";
    const languageMatch = className.match(/(?:lang|language)-([a-z0-9+#-]+)/i);
    const language = languageMatch ? languageMatch[1].toUpperCase() : "TEXT";
    block.setAttribute("data-code-lang", language);
    const alreadyEnhanced = block.getAttribute("data-code-enhanced") === "1";

    let codeEl = block.querySelector("code");
    if (!codeEl) {
      codeEl = document.createElement("code");
      codeEl.textContent = block.textContent || "";
      block.textContent = "";
      block.appendChild(codeEl);
    }
    const existingBtn = block.querySelector(".md-code-copy-btn") as HTMLElement | null;
    applyCodeBlockTheme(block, codeEl, existingBtn);

    const rawCode = codeEl.textContent || "";
    // 已增强且已完成高亮时，避免重复改写导致 observer 循环抖动；
    // 若此前未高亮成功（如首次加载时高亮器尚未就绪），允许后续补高亮。
    const hasHighlighted = block.getAttribute("data-highlighted") === "1";
    if (alreadyEnhanced && existingBtn && (hasHighlighted || !highlighter)) {
      return;
    }

    if (highlighter && language !== "TEXT") {
      const prismLang = resolvePrismLanguage(language);
      const grammar = highlighter.languages[prismLang];
      if (grammar) {
        try {
          codeEl.innerHTML = highlighter.highlight(rawCode, grammar, prismLang);
          codeEl.className = `language-${prismLang}`;
          block.setAttribute("data-highlighted", "1");
        } catch {
          codeEl.textContent = rawCode;
          codeEl.className = `language-${prismLang}`;
          block.setAttribute("data-highlighted", "0");
        }
      } else {
        block.setAttribute("data-highlighted", "0");
      }
    } else {
      block.setAttribute("data-highlighted", "0");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "md-code-copy-btn";
    button.textContent = COPY_DEFAULT_TEXT;
    button.setAttribute("aria-label", "复制代码");
    block.appendChild(button);
    applyCodeBlockTheme(block, codeEl as HTMLElement, button);
    block.setAttribute("data-code-enhanced", "1");
    stats.enhancedBlocks += 1;
    exposeStats();
  };

  const decorateCodeBlocks = (scope?: ParentNode) => {
    const container = scope ?? root;
    const blocks = container.querySelectorAll<HTMLElement>("pre");
    blocks.forEach((block) => {
      enhanceCodeBlock(block);
    });
  };

  const pickMutationTargets = (mutations: MutationRecord[]): HTMLElement[] => {
    const targets = new Set<HTMLElement>();
    let ignoredButtonMutations = 0;

    for (const mutation of mutations) {
      // 忽略复制按钮自身文本切换引发的子节点变化，避免点击复制触发全量增强
      if ((mutation.target as HTMLElement | null)?.closest?.(".md-code-copy-btn")) {
        ignoredButtonMutations += 1;
        continue;
      }

      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches("pre")) {
          targets.add(node);
          return;
        }
        const nestedBlocks = node.querySelectorAll?.("pre");
        nestedBlocks?.forEach((nested) => targets.add(nested as HTMLElement));
      });

      if (mutation.type === "characterData") {
        const host = mutation.target.parentElement?.closest?.("pre");
        if (host) targets.add(host as HTMLElement);
      }
    }

    stats.observerIgnoredButtonMutations += ignoredButtonMutations;
    exposeStats();
    return Array.from(targets);
  };

  const decorateMutationTargets = (mutations: MutationRecord[]) => {
    const targets = pickMutationTargets(mutations);
    targets.forEach((target) => enhanceCodeBlock(target));
  };

  const decorateAllCodeBlocks = () => {
    decorateCodeBlocks(root);
  };

  const handleCopyClick = async (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.classList.contains("md-code-copy-btn")) return;
    event.preventDefault();
    event.stopPropagation();
    const start = performance.now();
    stats.copyClicks += 1;
    const pre = target.closest("pre");
    const codeEl = pre?.querySelector("code");
    const textSource = codeEl?.textContent || pre?.textContent || "";
    const codeText = textSource.replace(/复制|已复制|复制失败/g, "").trim();
    if (!codeText) {
      const duration = performance.now() - start;
      updateCopyDuration(duration);
      exposeStats();
      return;
    }

    try {
      await navigator.clipboard.writeText(codeText);
      target.textContent = COPY_SUCCESS_TEXT;
      stats.copySuccess += 1;
      window.setTimeout(() => {
        target.textContent = COPY_DEFAULT_TEXT;
      }, 1400);
    } catch {
      target.textContent = COPY_ERROR_TEXT;
      stats.copyFail += 1;
      window.setTimeout(() => {
        target.textContent = COPY_DEFAULT_TEXT;
      }, 1400);
    } finally {
      const duration = performance.now() - start;
      updateCopyDuration(duration);
      exposeStats();
      debugLog("copy-click", {
        durationMs: Number(duration.toFixed(2)),
        copyClicks: stats.copyClicks,
        copySuccess: stats.copySuccess,
        copyFail: stats.copyFail,
        copyAvgDurationMs: Number(stats.copyAvgDurationMs.toFixed(2)),
      });
    }
  };

  decorateAllCodeBlocks();
  const observer = new MutationObserver((mutations) => {
    stats.observerCallbacks += 1;
    stats.observerMutations += mutations.length;
    decorateMutationTargets(mutations);
    exposeStats();
    debugLog("observer-cycle", {
      callbacks: stats.observerCallbacks,
      mutations: stats.observerMutations,
      ignoredButtonMutations: stats.observerIgnoredButtonMutations,
      enhancedBlocks: stats.enhancedBlocks,
    });
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  root.addEventListener("click", handleCopyClick);

  return () => {
    observer.disconnect();
    root.removeEventListener("click", handleCopyClick);
  };
}
