"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface ActionMenuProps {
  triggerLabel: string;
  children: ReactNode;
  /** 菜单对齐方式 */
  align?: "left" | "right";
  /** 菜单宽度预设 */
  width?: "sm" | "md" | "lg" | "auto";
  /** 触发按钮额外样式 */
  triggerClassName?: string;
  /** 是否禁用菜单 */
  disabled?: boolean;
  /** 额外菜单样式（用于覆盖或补充） */
  menuClassName?: string;
}

/**
 * 轻量操作菜单：
 * - 点击触发按钮展开/收起；
 * - 点击外部区域自动收起；
 * - 支持 ESC 关闭。
 */
export function ActionMenu({
  triggerLabel,
  children,
  align = "right",
  width = "md",
  triggerClassName,
  disabled = false,
  menuClassName,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const alignClass = align === "left" ? "left-0" : "right-0";
  const widthClass = width === "sm" ? "w-40" : width === "md" ? "w-52" : width === "lg" ? "w-64" : "w-auto";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={[
          "flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm",
          disabled ? "cursor-not-allowed opacity-60" : "",
          triggerClassName ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          className={
            menuClassName ??
            `absolute ${alignClass} z-20 mt-2 ${widthClass} space-y-1 rounded-md border border-default-200 bg-background p-2 shadow-lg`
          }
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button,a,[role='menuitem']")) {
              setOpen(false);
            }
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
