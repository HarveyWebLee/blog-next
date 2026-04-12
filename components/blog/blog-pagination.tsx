"use client";

import { useMemo } from "react";
import { Button } from "@heroui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/** 在页码序列中插入省略占位，避免长列表铺满屏 */
function buildPageList(current: number, total: number): (number | "gap")[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = Array.from(set).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("gap");
    out.push(sorted[i]!);
  }
  return out;
}

const LABELS: Record<
  string,
  { prev: string; next: string; first: string; last: string; bubble: (c: number, t: number) => string }
> = {
  "zh-CN": {
    prev: "上一页",
    next: "下一页",
    first: "首页",
    last: "末页",
    bubble: (c, t) => `第 ${c} / ${t} 页`,
  },
  "en-US": {
    prev: "Prev",
    next: "Next",
    first: "First",
    last: "Last",
    bubble: (c, t) => `Page ${c} of ${t}`,
  },
  "ja-JP": {
    prev: "前へ",
    next: "次へ",
    first: "先頭",
    last: "最後",
    bubble: (c, t) => `${c} / ${t} ページ`,
  },
};

export interface BlogPaginationProps {
  /** 当前页（1-based） */
  page: number;
  /** 总页数 */
  totalPages: number;
  /** 切换页码 */
  onPageChange: (page: number) => void;
  lang?: string;
}

/**
 * 博客列表专用分页：卡通描边 + 块状阴影，避免窄 Card 内 HeroUI Pagination 挤压错位；
 * 与业务配合时请保证 onPageChange 使用已合并筛选条件的请求（见 usePosts setParams）。
 */
export function BlogPagination({ page, totalPages, onPageChange, lang = "zh-CN" }: BlogPaginationProps) {
  const t = LABELS[lang] ?? LABELS["zh-CN"];
  const items = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

  const go = (p: number) => {
    const n = Math.min(Math.max(1, Math.floor(p)), totalPages);
    if (n === page) return;
    onPageChange(n);
  };

  if (totalPages <= 1) return null;

  /** 漫画风按钮：粗描边 + 右下角硬阴影，按下时阴影“压扁” */
  const comicBtn =
    "min-w-10 h-10 px-3 rounded-full border-[3px] border-foreground/80 bg-secondary-100 font-black text-sm text-foreground shadow-[4px_4px_0_0] shadow-foreground/25 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0] hover:shadow-foreground/20 active:translate-y-0.5 active:shadow-[2px_2px_0_0] active:shadow-foreground/30 dark:border-white/70 dark:bg-secondary-900/50 dark:text-foreground dark:shadow-white/20";

  const comicNum =
    "min-w-10 h-10 rounded-full border-[3px] border-foreground/70 font-black text-sm shadow-[3px_3px_0_0] shadow-foreground/20 transition-all duration-150 dark:border-white/60 dark:shadow-white/15";

  return (
    <div className="w-full max-w-full px-1 py-3">
      {/* 状态气泡 */}
      <div className="mb-4 flex justify-center">
        <div
          className="relative rounded-2xl border-[3px] border-foreground/80 bg-warning-200 px-5 py-2 font-black text-foreground shadow-[5px_5px_0_0] shadow-primary/40 dark:border-warning-400/80 dark:bg-warning-500/25 dark:text-warning-100 dark:shadow-warning-900/40"
          role="status"
          aria-live="polite"
        >
          <span className="tabular-nums">{t.bubble(page, totalPages)}</span>
          {/* 小尖角，漫画对话框感 */}
          <span
            className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-foreground/80 dark:border-t-warning-400/80"
            aria-hidden
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <Button variant="flat" className={comicBtn} isDisabled={page <= 1} onPress={() => go(1)} aria-label={t.first}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="flat"
          className={comicBtn}
          isDisabled={page <= 1}
          onPress={() => go(page - 1)}
          aria-label={t.prev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="mx-1 flex max-w-full flex-wrap items-center justify-center gap-2">
          {items.map((item, idx) =>
            item === "gap" ? (
              <span key={`gap-${idx}`} className="select-none px-1 font-black text-default-400" aria-hidden>
                ···
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => go(item)}
                className={
                  item === page
                    ? `${comicNum} z-[1] bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background`
                    : `${comicNum} bg-background/80 hover:-translate-y-0.5 hover:bg-primary/15`
                }
              >
                {item}
              </button>
            )
          )}
        </div>

        <Button
          variant="flat"
          className={comicBtn}
          isDisabled={page >= totalPages}
          onPress={() => go(page + 1)}
          aria-label={t.next}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="flat"
          className={comicBtn}
          isDisabled={page >= totalPages}
          onPress={() => go(totalPages)}
          aria-label={t.last}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
