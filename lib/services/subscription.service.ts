import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailSubscriptions } from "@/lib/db/schema";
import { sendPostPublishedEmail } from "@/lib/utils/email";

interface PublishPostPayload {
  title: string;
  slug: string;
  excerpt?: string | null;
}

/**
 * 订阅服务：处理文章发布后的订阅邮件通知
 */
export class SubscriptionService {
  async notifyOnPostPublished(post: PublishPostPayload): Promise<void> {
    try {
      const subscribers = await db
        .select({ email: emailSubscriptions.email })
        .from(emailSubscriptions)
        .where(eq(emailSubscriptions.isActive, true));

      if (subscribers.length === 0) return;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const postUrl = `${appUrl}/zh-CN/blog/${post.slug}`;

      let successCount = 0;
      let failedCount = 0;

      // 逐个发送，避免一次失败影响所有订阅者
      for (const item of subscribers) {
        const sent = await sendPostPublishedEmail({
          to: item.email,
          title: post.title,
          excerpt: post.excerpt || "",
          postUrl,
        });
        if (sent) {
          successCount += 1;
        } else {
          failedCount += 1;
        }
      }

      console.log("订阅通知发送完成:", {
        postTitle: post.title,
        total: subscribers.length,
        successCount,
        failedCount,
      });
    } catch (error) {
      console.error("发送订阅通知失败:", error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
