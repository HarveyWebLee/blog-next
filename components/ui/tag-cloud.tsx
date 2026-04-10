/**
 * 标签云组件 - 玻璃态优化版本
 * 以云状布局展示标签，支持不同大小和颜色
 */

"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { BarChart3, Hash, Palette, Shuffle, Tag as TagIcon, TrendingUp } from "lucide-react";

import { Tag } from "@/types/blog";

interface TagCloudProps {
  tags: Tag[];
  maxTags?: number;
  minSize?: number;
  maxSize?: number;
  showPostCount?: boolean;
  onTagClick?: (tag: Tag) => void;
  selectedTagId?: number;
  layout?: "cloud" | "grid" | "list";
  sortBy?: "name" | "postCount" | "random";
}

/**
 * 标签云组件
 * @param tags 标签数组
 * @param maxTags 最大显示标签数量
 * @param minSize 最小字体大小
 * @param maxSize 最大字体大小
 * @param showPostCount 是否显示文章数量
 * @param onTagClick 标签点击回调
 * @param selectedTagId 当前选中的标签ID
 * @param layout 布局方式
 * @param sortBy 排序方式
 */
export function TagCloud({
  tags,
  maxTags = 50,
  minSize = 12,
  maxSize = 24,
  showPostCount = true,
  onTagClick,
  selectedTagId,
  layout = "cloud",
  sortBy = "postCount",
}: TagCloudProps) {
  /** 仅用于触发 random 模式下的重新渲染，数值本身不参与计算 */
  const [, setShuffleKey] = useState(0);

  const baseSortedTags = useMemo(() => {
    const processed = [...tags];
    switch (sortBy) {
      case "name":
        processed.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "postCount":
        processed.sort((a, b) => (b.postCount || 0) - (a.postCount || 0));
        break;
      case "random":
        break;
      default:
        break;
    }
    return processed;
  }, [tags, sortBy]);

  /** random 模式在每次渲染（含点击「洗牌」触发 setShuffleKey）时重新打乱 */
  const processedTags =
    sortBy === "random"
      ? [...baseSortedTags].sort(() => Math.random() - 0.5).slice(0, maxTags)
      : baseSortedTags.slice(0, maxTags);

  // 计算标签大小
  const getTagSize = (postCount: number) => {
    if (processedTags.length === 0) return minSize;

    const maxCount = Math.max(...processedTags.map((tag) => tag.postCount || 0));
    const minCount = Math.min(...processedTags.map((tag) => tag.postCount || 0));

    if (maxCount === minCount) return (minSize + maxSize) / 2;

    const ratio = (postCount - minCount) / (maxCount - minCount);
    return minSize + (maxSize - minSize) * ratio;
  };

  // 获取标签颜色
  const getTagColor = (tag: Tag) => {
    return tag.color || "#667eea";
  };

  // 处理标签点击
  const handleTagClick = (tag: Tag) => {
    onTagClick?.(tag);
  };

  // 重新洗牌
  const handleShuffle = () => {
    setShuffleKey((prev) => prev + 1);
  };

  // 渲染标签
  const renderTag = (tag: Tag, index: number) => {
    const isSelected = selectedTagId === tag.id;
    const size = getTagSize(tag.postCount || 0);
    const color = getTagColor(tag);

    return (
      <div key={tag.id} className="group relative animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
        <Chip
          size="sm"
          variant={isSelected ? "solid" : "flat"}
          color={isSelected ? "primary" : "default"}
          className={`
            cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg
            backdrop-blur-sm bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20
            border-white/20 dark:border-white/10 hover:border-primary/50
            ${isSelected ? "ring-2 ring-primary/50 shadow-primary/20" : ""}
            relative overflow-hidden
          `}
          style={{
            fontSize: `${size}px`,
            backgroundColor: isSelected ? undefined : `${color}20`,
            borderColor: isSelected ? undefined : color,
            color: isSelected ? undefined : color,
          }}
          onClick={() => handleTagClick(tag)}
          startContent={showPostCount ? <Hash className="w-3 h-3" /> : undefined}
        >
          {tag.name}
          {showPostCount && <span className="ml-1 text-xs opacity-75">{tag.postCount || 0}</span>}

          {/* 悬停光效 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </Chip>
      </div>
    );
  };

  // 根据布局渲染
  const renderContent = () => {
    switch (layout) {
      case "grid":
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {processedTags.map((tag, index) => renderTag(tag, index))}
          </div>
        );

      case "list":
        return <div className="space-y-2">{processedTags.map((tag, index) => renderTag(tag, index))}</div>;

      case "cloud":
      default:
        return (
          <div className="flex flex-wrap gap-3 justify-center items-center min-h-[200px]">
            {processedTags.map((tag, index) => renderTag(tag, index))}
          </div>
        );
    }
  };

  return (
    <div className="tag-cloud-container">
      <div className="flex items-center justify-between w-full mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">标签云</span>
        </h2>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={handleShuffle}
            title="重新洗牌"
            className="backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {processedTags.length > 0 ? (
        renderContent()
      ) : (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-default-200 to-default-300 dark:from-default-700 dark:to-default-800">
              <TagIcon className="w-12 h-12 text-default-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">暂无标签数据</h3>
            <p className="text-sm text-default-600">还没有任何标签，快去创建一些吧！</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 标签统计组件 - 玻璃态优化版本
 * 显示标签的统计信息
 */
export function TagStats({ tags }: { tags: Tag[] }) {
  const stats = useMemo(() => {
    const totalTags = tags.length;
    const totalPosts = tags.reduce((sum, tag) => sum + (tag.postCount || 0), 0);
    const activeTags = tags.filter((tag) => tag.isActive).length;
    const avgPostsPerTag = totalTags > 0 ? Math.round(totalPosts / totalTags) : 0;
    const mostUsedTag = tags.reduce(
      (max, tag) => ((tag.postCount || 0) > (max.postCount || 0) ? tag : max),
      tags[0] || { name: "无", postCount: 0 }
    );

    return {
      totalTags,
      totalPosts,
      activeTags,
      avgPostsPerTag,
      mostUsedTag,
    };
  }, [tags]);

  const statItems = [
    {
      label: "总标签数",
      value: stats.totalTags,
      icon: TagIcon,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-100",
      iconColor: "text-blue-200",
    },
    {
      label: "总文章数",
      value: stats.totalPosts,
      icon: Hash,
      color: "from-green-500 to-green-600",
      textColor: "text-green-100",
      iconColor: "text-green-200",
    },
    {
      label: "活跃标签",
      value: stats.activeTags,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-100",
      iconColor: "text-purple-200",
    },
    {
      label: "最热门",
      value: stats.mostUsedTag.name,
      subValue: `${stats.mostUsedTag.postCount} 篇`,
      icon: BarChart3,
      color: "from-orange-500 to-orange-600",
      textColor: "text-orange-100",
      iconColor: "text-orange-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => (
        <Card
          key={item.label}
          className={`bg-gradient-to-r ${item.color} text-white backdrop-blur-xl hover:scale-105 transition-all duration-300 animate-fade-in-up`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`${item.textColor} text-sm font-medium`}>{item.label}</p>
                <p className="text-2xl font-bold truncate">{item.value}</p>
                {item.subValue && <p className={`${item.textColor} text-xs opacity-75`}>{item.subValue}</p>}
              </div>
              <div className="flex-shrink-0 ml-3">
                <item.icon className={`w-8 h-8 ${item.iconColor}`} />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
