import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import type { ApiResponse, ProfileRelationItem, ProfileRelationListResponse } from "@/types/blog";

export interface ProfileRelationsListResult {
  items: ProfileRelationItem[];
  pagination: ProfileRelationListResponse["pagination"];
}

/**
 * 个人中心关系数据 API 客户端（粉丝/关注）。
 * 当前阶段后端接口可能尚未落地，因此调用方需结合 fallback 数据兜底。
 */
export class ProfileRelationsAPI {
  /**
   * 获取粉丝列表
   */
  static async getFollowers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    mutualOnly?: boolean;
  }): Promise<ProfileRelationsListResult> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.mutualOnly) qs.set("mutualOnly", "true");

    const res = await fetch(`/api/profile/followers${qs.toString() ? `?${qs.toString()}` : ""}`, {
      headers: {
        ...clientBearerHeaders(),
      },
    });

    if (!res.ok) {
      throw new Error(`获取粉丝列表失败: ${res.status}`);
    }

    const json = (await res.json()) as ApiResponse<ProfileRelationListResponse | ProfileRelationItem[]>;
    if (!json.success) {
      throw new Error(json.message || "获取粉丝列表失败");
    }

    const payload = json.data;
    if (Array.isArray(payload)) {
      return {
        items: payload,
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || payload.length || 20,
          total: payload.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return {
      items: payload?.data || [],
      pagination: payload?.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * 获取关注列表
   */
  static async getFollowing(params?: {
    page?: number;
    limit?: number;
    search?: string;
    mutualOnly?: boolean;
  }): Promise<ProfileRelationsListResult> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.mutualOnly) qs.set("mutualOnly", "true");

    const res = await fetch(`/api/profile/following${qs.toString() ? `?${qs.toString()}` : ""}`, {
      headers: {
        ...clientBearerHeaders(),
      },
    });

    if (!res.ok) {
      throw new Error(`获取关注列表失败: ${res.status}`);
    }

    const json = (await res.json()) as ApiResponse<ProfileRelationListResponse | ProfileRelationItem[]>;
    if (!json.success) {
      throw new Error(json.message || "获取关注列表失败");
    }

    const payload = json.data;
    if (Array.isArray(payload)) {
      return {
        items: payload,
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || payload.length || 20,
          total: payload.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return {
      items: payload?.data || [],
      pagination: payload?.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * 关注用户
   */
  static async followUser(targetUserId: number): Promise<void> {
    const res = await fetch("/api/profile/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...clientBearerHeaders(),
      },
      body: JSON.stringify({ followingId: targetUserId }),
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    if (!res.ok || !json.success) {
      throw new Error(json.message || "关注失败");
    }
  }

  /**
   * 取消关注用户
   */
  static async unfollowUser(targetUserId: number): Promise<void> {
    const res = await fetch(`/api/profile/follow/${targetUserId}`, {
      method: "DELETE",
      headers: {
        ...clientBearerHeaders(),
      },
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    if (!res.ok || !json.success) {
      throw new Error(json.message || "取消关注失败");
    }
  }
}

export default ProfileRelationsAPI;
