"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, Button, Card, CardBody, Chip, Input, Pagination } from "@heroui/react";
import { CheckCheck, Search, UserMinus, Users } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import ProfileRelationsAPI from "@/lib/api/profile-relations";
import { message } from "@/lib/utils";
import type { ProfileRelationItem } from "@/types/blog";

interface ProfileFollowingProps {
  lang: string;
}

/**
 * 关注页面（MVP）：
 * 1) 先确定页面结构与基础筛选交互；
 * 2) 关注关系接口上线后仅替换数据源，不改 UI 契约；
 * 3) 按“可操作列表”设计，保留取消关注和查看主页入口。
 */
export default function ProfileFollowing({ lang }: ProfileFollowingProps) {
  const t =
    lang === "en-US"
      ? {
          title: "Following",
          subtitle: "People you follow",
          searchPh: "Search following...",
          mutual: "Mutual follow",
          mutualDone: "Mutual following",
          unfollow: "Unfollow",
          viewProfile: "View profile",
          mutualOnly: "Mutual only",
          allRelations: "All",
          empty: "You are not following anyone",
          emptyDesc: "Follow creators and keep up with their updates.",
          loadFailed: "Unable to load following list, showing fallback data.",
          overview: "Back to profile",
          lastActive: "Last active",
          neverActive: "No recent activity",
          followedAt: "Followed at",
        }
      : lang === "ja-JP"
        ? {
            title: "フォロー中",
            subtitle: "あなたがフォローしているユーザー",
            searchPh: "フォロー中を検索...",
            mutual: "相互フォロー",
            mutualDone: "相互フォロー中",
            unfollow: "フォロー解除",
            viewProfile: "プロフィールを見る",
            mutualOnly: "相互のみ",
            allRelations: "すべて",
            empty: "まだ誰もフォローしていません",
            emptyDesc: "クリエイターをフォローして更新を受け取りましょう。",
            loadFailed: "フォロー中一覧の取得に失敗したため、代替データを表示しています。",
            overview: "プロフィールへ戻る",
            lastActive: "最終アクティブ",
            neverActive: "活動履歴なし",
            followedAt: "フォロー日時",
          }
        : {
            title: "我的关注",
            subtitle: "你正在关注的用户",
            searchPh: "搜索关注对象昵称/用户名...",
            mutual: "互相关注",
            mutualDone: "已互关",
            unfollow: "取消关注",
            viewProfile: "查看主页",
            mutualOnly: "仅互关",
            allRelations: "全部",
            empty: "你还没有关注任何人",
            emptyDesc: "去发现更多创作者，关注后可在这里管理。",
            loadFailed: "加载关注列表失败，已展示占位数据。",
            overview: "返回个人中心",
            lastActive: "最近活跃",
            neverActive: "暂无活跃记录",
            followedAt: "关注时间",
          };

  const placeholderFollowing = useMemo<ProfileRelationItem[]>(
    () => [
      {
        userId: 201,
        username: "design_tako",
        displayName: "章鱼设计局",
        bio: "分享设计系统与交互思考。",
        followedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastActiveAt: new Date(Date.now() - 60 * 60 * 1000),
        isMutual: true,
      },
      {
        userId: 202,
        username: "node_hiker",
        displayName: "Node旅人",
        bio: "后端工程化、部署与可观测性。",
        followedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isMutual: false,
      },
    ],
    []
  );

  const [loading, setLoading] = useState(true);
  const [fromFallback, setFromFallback] = useState(false);
  const [following, setFollowing] = useState<ProfileRelationItem[]>([]);
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

    const loadFollowing = async () => {
      setLoading(true);
      try {
        const result = await ProfileRelationsAPI.getFollowing({
          page,
          limit: pageSize,
          search: keyword.trim() || undefined,
          mutualOnly,
        });
        if (cancelled) return;
        setFollowing(result.items);
        setTotalPages(Math.max(result.pagination.totalPages, 1));
        setTotal(result.pagination.total);
        setFromFallback(false);
        fallbackWarnedRef.current = false;
      } catch (error) {
        if (cancelled) return;
        console.error("获取关注列表失败:", error);
        const base = mutualOnly ? placeholderFollowing.filter((item) => item.isMutual) : placeholderFollowing;
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
        setFollowing(filtered.slice(start, start + pageSize));
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

    void loadFollowing();
    return () => {
      cancelled = true;
    };
  }, [keyword, mutualOnly, page, pageSize, placeholderFollowing, t.loadFailed]);

  const formatFollowMeta = (item: ProfileRelationItem): string => {
    const followed = item.followedAt ? `${t.followedAt} ${new Date(item.followedAt).toLocaleString(lang)}` : "";
    const active = item.lastActiveAt
      ? `${t.lastActive} ${new Date(item.lastActiveAt).toLocaleString(lang)}`
      : t.neverActive;
    return followed ? `${followed} · ${active}` : active;
  };

  const handleUnfollow = async (targetUserId: number) => {
    setActionUserId(targetUserId);
    try {
      await ProfileRelationsAPI.unfollowUser(targetUserId);
      setFollowing((prev) => prev.filter((item) => item.userId !== targetUserId));
      message.success(lang === "en-US" ? "Unfollowed" : lang === "ja-JP" ? "フォロー解除しました" : "已取消关注");
    } catch (error) {
      console.error("取消关注失败:", error);
      message.error(error instanceof Error ? error.message : "取消关注失败");
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

      {!loading && following.length === 0 ? (
        <Card className={PROFILE_GLASS_CARD}>
          <CardBody className="flex flex-col items-center gap-2 p-10 text-center">
            <Users className="h-10 w-10 text-default-300" />
            <p className="text-lg font-semibold text-foreground">{t.empty}</p>
            <p className="text-sm text-default-500">{t.emptyDesc}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {following.map((item) => (
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
                      <p className="mt-1 text-xs text-default-500">{formatFollowMeta(item)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.isMutual ? (
                      <Chip
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<CheckCheck className="h-3.5 w-3.5" />}
                        className="border border-success/65 bg-success/25 font-semibold text-success-700 dark:text-success-300"
                      >
                        {t.mutualDone}
                      </Chip>
                    ) : null}
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<UserMinus className="h-4 w-4" />}
                      isLoading={actionUserId === item.userId}
                      onPress={() => void handleUnfollow(item.userId)}
                    >
                      {t.unfollow}
                    </Button>
                    <Button as={Link} href={`/${lang}/users/${item.userId}`} size="sm" variant="light">
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
