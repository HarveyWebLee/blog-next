"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, Button, Card, CardBody, Chip, Input, Pagination } from "@heroui/react";
import { Search, UserPlus, Users } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import ProfileRelationsAPI from "@/lib/api/profile-relations";
import { message } from "@/lib/utils";
import type { ProfileRelationItem } from "@/types/blog";

interface ProfileFollowersProps {
  lang: string;
}

/**
 * 粉丝页面（MVP）：
 * 1) 先提供稳定的页面结构、筛选区与基础交互；
 * 2) 数据层先用本地占位，后续可直接替换为 /api/profile/followers 返回值；
 * 3) 操作按钮保留“回关/查看主页”产品语义，方便后续接真实关注关系接口。
 */
export default function ProfileFollowers({ lang }: ProfileFollowersProps) {
  const t =
    lang === "en-US"
      ? {
          title: "Followers",
          subtitle: "People who follow you",
          searchPh: "Search followers...",
          mutual: "Mutual follow",
          newFollower: "New",
          followBack: "Follow back",
          viewProfile: "View profile",
          mutualOnly: "Mutual only",
          allRelations: "All",
          empty: "No followers yet",
          emptyDesc: "Once someone follows you, they will appear here.",
          loadFailed: "Unable to load followers, showing fallback data.",
          overview: "Back to profile",
          neverActive: "No activity yet",
          followedSuffix: "followed you",
        }
      : lang === "ja-JP"
        ? {
            title: "フォロワー",
            subtitle: "あなたをフォローしているユーザー",
            searchPh: "フォロワーを検索...",
            mutual: "相互フォロー",
            newFollower: "新着",
            followBack: "フォローバック",
            viewProfile: "プロフィールを見る",
            mutualOnly: "相互のみ",
            allRelations: "すべて",
            empty: "フォロワーがいません",
            emptyDesc: "フォローされるとここに表示されます。",
            loadFailed: "フォロワーの取得に失敗したため、代替データを表示しています。",
            overview: "プロフィールへ戻る",
            neverActive: "活動履歴なし",
            followedSuffix: "フォローしました",
          }
        : {
            title: "我的粉丝",
            subtitle: "关注你的用户",
            searchPh: "搜索粉丝昵称/用户名...",
            mutual: "互相关注",
            newFollower: "新粉丝",
            followBack: "回关",
            viewProfile: "查看主页",
            mutualOnly: "仅互关",
            allRelations: "全部",
            empty: "暂时还没有粉丝",
            emptyDesc: "当有人关注你后，会展示在这里。",
            loadFailed: "加载粉丝列表失败，已展示占位数据。",
            overview: "返回个人中心",
            neverActive: "暂无活跃记录",
            followedSuffix: "关注了你",
          };

  /**
   * 占位数据仅用于打通 UI 和交互流程。
   * 后续接入真实接口时，可将该数据替换为 fetch 结果，并保留下方筛选逻辑。
   */
  const placeholderFollowers = useMemo<ProfileRelationItem[]>(
    () => [
      {
        userId: 101,
        username: "wanderer_tea",
        displayName: "山野茶客",
        bio: "在山里写代码，也写故事。",
        followedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isMutual: false,
      },
      {
        userId: 102,
        username: "frontend_aki",
        displayName: "Aki",
        bio: "前端体验与设计系统实践。",
        followedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isMutual: true,
      },
    ],
    []
  );

  const [loading, setLoading] = useState(true);
  const [fromFallback, setFromFallback] = useState(false);
  const [followers, setFollowers] = useState<ProfileRelationItem[]>([]);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [mutualOnly, setMutualOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const fallbackWarnedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadFollowers = async () => {
      setLoading(true);
      try {
        const result = await ProfileRelationsAPI.getFollowers({
          page,
          limit: pageSize,
          search: keyword.trim() || undefined,
          mutualOnly,
        });
        if (cancelled) return;
        setFollowers(result.items);
        setTotalPages(Math.max(result.pagination.totalPages, 1));
        setTotal(result.pagination.total);
        setFromFallback(false);
        fallbackWarnedRef.current = false;
      } catch (error) {
        if (cancelled) return;
        console.error("获取粉丝列表失败:", error);
        // 接口异常时回退本地占位，并以本地分页兜底可用性
        const base = mutualOnly ? placeholderFollowers.filter((item) => item.isMutual) : placeholderFollowers;
        const kw = keyword.trim().toLowerCase();
        const filtered =
          kw.length > 0
            ? base.filter(
                (item) =>
                  (item.displayName || "").toLowerCase().includes(kw) ||
                  (item.username || "").toLowerCase().includes(kw)
              )
            : base;
        const start = (page - 1) * pageSize;
        setFollowers(filtered.slice(start, start + pageSize));
        setTotal(filtered.length);
        setTotalPages(Math.max(Math.ceil(filtered.length / pageSize), 1));
        setFromFallback(true);
        if (!fallbackWarnedRef.current) {
          message.warning(t.loadFailed);
          fallbackWarnedRef.current = true;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadFollowers();
    return () => {
      cancelled = true;
    };
  }, [keyword, mutualOnly, page, pageSize, placeholderFollowers, t.loadFailed]);

  const formatFollowedText = (item: ProfileRelationItem): string => {
    if (!item.followedAt) return t.neverActive;
    return `${new Date(item.followedAt).toLocaleString(lang)} ${t.followedSuffix}`;
  };

  const handleFollowBack = async (targetUserId: number) => {
    setActionUserId(targetUserId);
    try {
      await ProfileRelationsAPI.followUser(targetUserId);
      setFollowers((prev) => prev.map((item) => (item.userId === targetUserId ? { ...item, isMutual: true } : item)));
      message.success(lang === "en-US" ? "Followed" : lang === "ja-JP" ? "フォローしました" : "已回关");
    } catch (error) {
      console.error("回关失败:", error);
      message.error(error instanceof Error ? error.message : "回关失败");
    } finally {
      setActionUserId(null);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [keyword, mutualOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-default-500">{t.subtitle}</p>
        </div>
        <Button as={Link} href={`/${lang}/profile`} variant="flat" size="sm">
          {t.overview}
        </Button>
      </div>

      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              size="sm"
              value={keyword}
              onValueChange={setKeyword}
              placeholder={t.searchPh}
              startContent={<Search className="h-4 w-4 text-default-400" />}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant={mutualOnly ? "flat" : "light"} onPress={() => setMutualOnly(true)}>
                {t.mutualOnly}
              </Button>
              <Button size="sm" variant={!mutualOnly ? "flat" : "light"} onPress={() => setMutualOnly(false)}>
                {t.allRelations}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card className={PROFILE_GLASS_CARD}>
          <CardBody className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-1/4 rounded-lg bg-default-200" />
              <div className="h-16 rounded-xl bg-default-200" />
              <div className="h-16 rounded-xl bg-default-200" />
            </div>
          </CardBody>
        </Card>
      ) : null}

      {!loading && fromFallback ? (
        <Card className={PROFILE_GLASS_CARD}>
          <CardBody className="p-3">
            <p className="text-xs text-warning">{t.loadFailed}</p>
          </CardBody>
        </Card>
      ) : null}

      {!loading && followers.length === 0 ? (
        <Card className={PROFILE_GLASS_CARD}>
          <CardBody className="flex flex-col items-center gap-2 p-10 text-center">
            <Users className="h-10 w-10 text-default-300" />
            <p className="text-lg font-semibold text-foreground">{t.empty}</p>
            <p className="text-sm text-default-500">{t.emptyDesc}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {followers.map((item) => (
            <Card key={item.userId} className={PROFILE_GLASS_CARD}>
              <CardBody className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.displayName || item.username} src={item.avatar} className="h-12 w-12" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.displayName || item.username}
                      </p>
                      <p className="truncate text-xs text-default-500">@{item.username}</p>
                      {item.bio ? <p className="mt-1 line-clamp-1 text-xs text-default-600">{item.bio}</p> : null}
                      <p className="mt-1 text-xs text-default-500">{formatFollowedText(item)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.isMutual ? (
                      <Chip size="sm" color="success" variant="flat">
                        {t.mutual}
                      </Chip>
                    ) : null}
                    {item.followedAt && Date.now() - new Date(item.followedAt).getTime() < 24 * 60 * 60 * 1000 ? (
                      <Chip size="sm" color="danger" variant="flat">
                        {t.newFollower}
                      </Chip>
                    ) : null}
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<UserPlus className="h-4 w-4" />}
                      isDisabled={Boolean(item.isMutual)}
                      isLoading={actionUserId === item.userId}
                      onPress={() => void handleFollowBack(item.userId)}
                    >
                      {t.followBack}
                    </Button>
                    <Button as={Link} href={`/${lang}/blog?authorId=${item.userId}`} size="sm" variant="light">
                      {t.viewProfile}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
          {total > pageSize ? (
            <div className="flex justify-center">
              <Pagination page={page} total={totalPages} onChange={setPage} showControls size="sm" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
