"use client";

import { Select, SelectItem } from "@heroui/select";

import { Category } from "@/types/blog";

type TreeOption = {
  id: number;
  name: string;
  depth: number;
  pathLabel: string;
};

interface CategoryTreeSelectProps {
  categories: Category[];
  value?: number;
  onChange: (parentId: number | undefined) => void;
  label?: string;
  placeholder: string;
  noneLabel: string;
  /**
   * 需要禁用（不显示）的分类 id 列表。
   * 常用于编辑时排除当前节点及其后代，避免形成循环树。
   */
  disabledIds?: number[];
}

/**
 * 分类树选择器：将扁平分类列表转换为树状缩进选项，支持“无父分类”。
 */
export function CategoryTreeSelect({
  categories,
  value,
  onChange,
  label,
  placeholder,
  noneLabel,
  disabledIds = [],
}: CategoryTreeSelectProps) {
  const disabledSet = new Set<number>(disabledIds);

  // 按 parentId 建索引，保留输入顺序（通常已由后端排序）
  const childrenMap = new Map<number | null, Category[]>();
  for (const category of categories) {
    const key = category.parentId ?? null;
    const list = childrenMap.get(key) || [];
    list.push(category);
    childrenMap.set(key, list);
  }

  const options: TreeOption[] = [];
  const walk = (parentId: number | null, depth: number, parentPath: string[]) => {
    const nodes = childrenMap.get(parentId) || [];
    for (const node of nodes) {
      const nextPath = [...parentPath, node.name];
      if (!disabledSet.has(node.id)) {
        options.push({
          id: node.id,
          name: node.name,
          depth,
          pathLabel: depth > 0 ? parentPath.join(" / ") : "",
        });
      }
      // 被禁用节点仍继续遍历其子级，防止整支可用分支被意外吞掉
      walk(node.id, depth + 1, nextPath);
    }
  };
  walk(null, 0, []);

  /** 将「无父级」选项与树节点合并为同一列表再渲染，避免静态项 + map 混合导致 HeroUI Select 子节点类型报错 */
  type SelectRow = { rowKey: "none" } | { rowKey: "option"; option: TreeOption };

  const rows: SelectRow[] = [{ rowKey: "none" }, ...options.map((option) => ({ rowKey: "option" as const, option }))];

  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={new Set([value ? String(value) : "none"])}
      onSelectionChange={(keys) => {
        const selectedKey = Array.from(keys)[0] as string;
        onChange(selectedKey === "none" ? undefined : Number(selectedKey));
      }}
    >
      {rows.map((row) =>
        row.rowKey === "none" ? (
          <SelectItem key="none" textValue={noneLabel}>
            {noneLabel}
          </SelectItem>
        ) : (
          <SelectItem key={String(row.option.id)} textValue={row.option.name}>
            <div
              className="flex w-full min-w-0 items-center gap-2"
              style={{ paddingInlineStart: `${row.option.depth * 14}px` }}
            >
              {row.option.depth > 0 ? (
                <span className="text-default-400">└</span>
              ) : (
                <span className="text-default-400">•</span>
              )}
              <span className="truncate">{row.option.name}</span>
              {row.option.pathLabel ? (
                <span className="ml-auto truncate text-xs text-default-400">{row.option.pathLabel}</span>
              ) : null}
            </div>
          </SelectItem>
        )
      )}
    </Select>
  );
}
