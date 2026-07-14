"use client";

import { FormEvent, useCallback, useState } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Textarea } from "@heroui/react";
import { MessageCircle, Reply, ThumbsUp, X } from "lucide-react";

import { message } from "@/lib/utils";
import { clientApiFetch, hasClientAccessToken } from "@/lib/utils/client-api-fetch";
import { countCommentTree } from "@/lib/utils/comment-tree";
import type { Comment } from "@/types/blog";

type PostCommentsProps = {
  postId: number;
  postAuthorId?: number;
  lang: string;
  /** 博客详情词典片段（含评论相关键） */
  t: Record<string, string>;
  isAuthenticated: boolean;
  userDisplayName?: string | null;
  userUsername?: string | null;
  initialComments?: Comment[];
};

function formatCountLabel(template: string, count: number) {
  return template.replace("{count}", String(count));
}

function displayName(comment: Comment, anonymousLabel: string): string {
  return comment.author?.displayName || comment.authorName || anonymousLabel;
}

export default function PostComments({
  postId,
  postAuthorId,
  lang,
  t,
  isAuthenticated,
  userDisplayName,
  userUsername,
  initialComments = [],
}: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalCount = countCommentTree(comments);

  const reloadComments = useCallback(async () => {
    const response = await clientApiFetch(`/api/comments?postId=${postId}`);
    const result = (await response.json()) as {
      success: boolean;
      data?: { comments?: Comment[]; total?: number };
    };
    if (result.success && Array.isArray(result.data?.comments)) {
      setComments(result.data.comments);
    }
  }, [postId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      message.warning(t.commentRequired);
      return;
    }

    try {
      setSubmitting(true);
      const isLoggedIn = Boolean(isAuthenticated && hasClientAccessToken());
      const commentAuthorName = isLoggedIn ? userDisplayName?.trim() || userUsername?.trim() || t.anonymous : t.guest;

      const response = await clientApiFetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: comment.trim(),
          authorName: commentAuthorName,
          parentId: replyTo?.id ?? null,
        }),
      });

      const result = (await response.json()) as { success: boolean; message?: string };
      if (result.success) {
        setComment("");
        setReplyTo(null);
        message.success(result.message || t.commentSuccess);
        await reloadComments();
      } else {
        message.error(t.commentFailedWithReason.replace("{reason}", result.message || ""));
      }
    } catch (error) {
      console.error("提交评论失败:", error);
      message.error(t.commentFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCommentCard = (item: Comment, nested: boolean) => {
    const deleted = Boolean(item.isDeleted || item.status === "deleted");
    const name = deleted ? t.deletedCommentAuthor || t.anonymous : displayName(item, t.anonymous);
    return (
      <Card className={`comment-card hover-lift card-hover-effect ${nested ? "border-l-2 border-primary/30" : ""}`}>
        <CardBody className={nested ? "p-4" : "p-6"}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              size={nested ? "sm" : "md"}
              src={deleted ? undefined : item.author?.avatar || undefined}
              name={name}
              className="hover-lift"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-base font-semibold">
                <span className="truncate">{name}</span>
                {deleted ? (
                  <Chip size="sm" color="default" variant="flat" className="font-medium">
                    {t.deletedCommentBadge || "已删除"}
                  </Chip>
                ) : null}
                {!deleted && item.authorId != null && item.authorId === postAuthorId && (
                  <Chip size="sm" color="warning" variant="flat" className="font-medium">
                    {t.authorBadge}
                  </Chip>
                )}
              </div>
              <p className="text-sm text-default-400">
                {new Date(item.createdAt).toLocaleDateString(lang, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {!nested && !deleted && (
              <Button
                size="sm"
                variant="light"
                startContent={<Reply className="w-4 h-4" />}
                onPress={() => setReplyTo({ id: item.id, name })}
              >
                {t.reply}
              </Button>
            )}
          </div>
          <p
            className={`text-base leading-relaxed whitespace-pre-wrap break-words ${
              deleted ? "italic text-default-400" : ""
            }`}
          >
            {deleted ? t.deletedCommentPlaceholder || "原评论已删除" : item.content}
          </p>
        </CardBody>
      </Card>
    );
  };

  return (
    <Card className="card-hover-effect glass-enhanced">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold blog-title-gradient">{t.commentsSection}</p>
          <Chip variant="flat" color="primary" size="sm">
            {formatCountLabel(t.commentsCount, totalCount)}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="space-y-8 pt-0">
        <div className="animate-blog-slide-in-right delay-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {replyTo && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-default-100 px-3 py-2 text-sm">
                <span className="text-default-600">{t.replyTo.replace("{name}", replyTo.name)}</span>
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  aria-label={t.cancelReply}
                  onPress={() => setReplyTo(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Textarea
              label={replyTo ? t.reply : t.commentLabel}
              placeholder={replyTo ? t.replyPlaceholder : t.commentPlaceholder}
              value={comment}
              onValueChange={setComment}
              variant="bordered"
              minRows={4}
              isRequired
              className="hover-lift mt-2"
              classNames={{
                input: "text-base",
                inputWrapper: "border-2 hover:border-primary transition-colors",
              }}
            />
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={submitting}
              className="button-hover-effect gradient-button-primary"
              startContent={!submitting && <ThumbsUp className="w-5 h-5" />}
            >
              {submitting ? t.submitting : replyTo ? t.reply : t.submitComment}
            </Button>
          </form>
        </div>

        <Divider className="my-8" />

        {comments.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-secondary" />
              {t.allComments}
            </h3>
            <div className="space-y-4">
              {comments.map((item, index) => (
                <div key={item.id} className={`space-y-3 animate-blog-slide-in-right delay-${200 + index * 100}`}>
                  {renderCommentCard(item, false)}
                  {item.replies && item.replies.length > 0 && (
                    <div className="ml-4 sm:ml-8 space-y-3">
                      {item.replies.map((reply) => (
                        <div key={reply.id}>{renderCommentCard(reply, true)}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 animate-blog-scale-in delay-200">
            <div className="animate-blog-float">
              <MessageCircle className="w-20 h-20 mx-auto mb-6 text-default-300" />
            </div>
            <p className="text-xl text-default-500 mb-4">{t.noComments}</p>
            <p className="text-default-400">{t.beFirstComment}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
