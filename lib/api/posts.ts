/**
 * 博客文章API客户端
 * 封装所有与文章相关的API调用
 */

import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { CreatePostRequest, PaginatedResponse, PostData, PostQueryParams, UpdatePostRequest } from "@/types/blog";

const API_BASE = "/api/posts";

export type PostEngagementState = {
  postId: number;
  liked: boolean;
  favorited: boolean;
};

/**
 * 文章API客户端类
 */
export class PostsAPI {
  /**
   * 获取文章列表
   */
  static async getPosts(params: PostQueryParams = {}): Promise<PaginatedResponse<PostData>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.visibility) searchParams.append("visibility", params.visibility);
    if (params.authorId) searchParams.append("authorId", params.authorId.toString());
    if (params.categoryId) searchParams.append("categoryId", params.categoryId.toString());
    if (params.tagId != null) searchParams.append("tagId", params.tagId.toString());
    if (params.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const response = await fetch(`${API_BASE}?${searchParams.toString()}`, {
      headers: {
        ...clientBearerHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`获取文章列表失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 根据ID获取文章详情
   */
  static async getPostById(id: number): Promise<PostData> {
    const response = await fetch(`${API_BASE}/${id}`);

    if (!response.ok) {
      throw new Error(`获取文章详情失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 根据slug获取文章详情
   */
  static async getPostBySlug(slug: string): Promise<PostData> {
    const response = await fetch(`${API_BASE}/slug/${slug}`);

    if (!response.ok) {
      throw new Error(`获取文章详情失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 创建新文章
   */
  static async createPost(data: CreatePostRequest): Promise<PostData> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...clientBearerHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`创建文章失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 更新文章
   */
  static async updatePost(id: number, data: UpdatePostRequest): Promise<PostData> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...clientBearerHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`更新文章失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 删除文章
   */
  static async deletePost(id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        ...clientBearerHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`删除文章失败: ${response.statusText}`);
    }

    return true;
  }

  /**
   * 更新文章状态
   */
  static async updatePostStatus(id: number, status: PostData["status"]): Promise<PostData> {
    const response = await fetch(`${API_BASE}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...clientBearerHeaders(),
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`更新文章状态失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 增加文章浏览次数
   */
  static async incrementViewCount(id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE}/${id}/view`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`增加浏览次数失败: ${response.statusText}`);
    }

    return true;
  }

  /**
   * 增加文章点赞次数
   */
  static async incrementLikeCount(id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE}/${id}/like`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`增加点赞次数失败: ${response.statusText}`);
    }

    return true;
  }

  /**
   * 批量获取当前用户对文章的点赞/收藏状态
   */
  static async getEngagementStates(ids: number[]): Promise<PostEngagementState[]> {
    if (!ids.length) return [];
    const uniq = Array.from(new Set(ids.map((n) => Math.floor(n)).filter((n) => Number.isFinite(n) && n > 0)));
    if (!uniq.length) return [];
    const response = await fetch(`${API_BASE}/engagement?ids=${uniq.join(",")}`, {
      headers: {
        ...clientBearerHeaders(),
      },
    });
    if (!response.ok) {
      throw new Error(`获取互动状态失败: ${response.statusText}`);
    }
    const json = await response.json();
    return (json?.data || []) as PostEngagementState[];
  }

  /**
   * 切换文章点赞状态（已点赞则取消）
   */
  static async toggleLike(id: number): Promise<{ liked: boolean; likeCount: number }> {
    const response = await fetch(`${API_BASE}/${id}/like`, {
      method: "POST",
      headers: {
        ...clientBearerHeaders(),
      },
    });
    if (!response.ok) {
      throw new Error(`点赞操作失败: ${response.statusText}`);
    }
    const json = await response.json();
    return (json?.data || { liked: false, likeCount: 0 }) as { liked: boolean; likeCount: number };
  }

  /**
   * 切换文章收藏状态（已收藏则取消）
   */
  static async toggleFavorite(id: number): Promise<{ favorited: boolean; favoriteCount: number }> {
    const response = await fetch(`${API_BASE}/${id}/favorite`, {
      method: "POST",
      headers: {
        ...clientBearerHeaders(),
      },
    });
    if (!response.ok) {
      throw new Error(`收藏操作失败: ${response.statusText}`);
    }
    const json = await response.json();
    return (json?.data || { favorited: false, favoriteCount: 0 }) as { favorited: boolean; favoriteCount: number };
  }
}

// 导出默认实例
export default PostsAPI;
