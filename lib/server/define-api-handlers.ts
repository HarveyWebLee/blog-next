/**
 * Next.js App Router Route Handler 包装：统一 **访问日志**（方法、路径、HTTP 状态、耗时），
 * 未捕获异常时走 {@link logger.exception}（error 级别 + 开发环境 stack）。
 *
 * 用法（替换分散的 `export async function GET`）：
 *
 * ```ts
 * const handleGET = async (request: NextRequest) => { ... };
 * export const { GET } = defineApiHandlers({ GET: handleGET });
 * ```
 *
 * 业务 catch 后 **返回** 4xx/5xx 的 Response 仍会经过包装器记一条访问日志；库内抛出的异常请依赖包装器或自行 catch。
 */

import { NextResponse, type NextRequest } from "next/server";

import { sanitizeLogMessage, sanitizeLogMeta } from "@/lib/server/log-redaction";
import { logger } from "@/lib/server/logger";

/** 兼容动态路由的 `context`（Next 15：`params` 为 Promise） */
export type AppRouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

type ErrorLogInput = {
  method: string;
  path: string;
  ms: number;
  error: unknown;
};

type ErrorLogPayload = {
  message?: string;
  meta?: Record<string, unknown>;
};

export type DefineApiHandlersOptions = {
  /**
   * 自定义错误脱敏逻辑：
   * - 可改写 message（默认是 Error.message）
   * - 可追加/覆盖 meta（默认 method/path/ms/phase）
   */
  redactError?: (input: ErrorLogInput) => ErrorLogPayload;
  /**
   * 每次未捕获异常后触发（已做脱敏），用于埋点或告警桥接。
   * 注意：此回调抛错会被吞掉并记录 warn，不影响原异常继续抛出。
   */
  onError?: (payload: {
    method: string;
    path: string;
    ms: number;
    status: 500;
    message: string;
    meta: Record<string, unknown>;
    error: unknown;
  }) => void | Promise<void>;
  /**
   * 未捕获异常统一响应转换器。
   * - 返回 Response：包装器直接返回该响应（仍会先记录日志+触发 onError）
   * - 返回 void：沿用默认行为（继续 throw，由 Next 处理）
   */
  onUnhandledErrorResponse?: (payload: {
    method: string;
    path: string;
    ms: number;
    message: string;
    meta: Record<string, unknown>;
    error: unknown;
  }) => Response | void | Promise<Response | void>;
};

function defaultRedactError(input: ErrorLogInput): { message: string; meta: Record<string, unknown> } {
  const baseMessage = input.error instanceof Error ? input.error.message : String(input.error);
  return {
    message: sanitizeLogMessage(baseMessage),
    meta: {
      method: input.method,
      path: input.path,
      ms: input.ms,
      status: 500,
      phase: "unhandled",
    },
  };
}

function wrapHandler(method: string, fn: AppRouteHandler, options?: DefineApiHandlersOptions): AppRouteHandler {
  return async (request: NextRequest, context?: any) => {
    const path = request.nextUrl.pathname;
    const t0 = Date.now();

    try {
      const response = await fn(request, context);
      logger.httpAccess(method, path, response.status, Date.now() - t0);
      return response;
    } catch (error) {
      const ms = Date.now() - t0;
      const redacted = defaultRedactError({ method, path, ms, error });
      const custom = options?.redactError?.({ method, path, ms, error });
      const message = custom?.message ? sanitizeLogMessage(custom.message) : redacted.message;
      const meta = sanitizeLogMeta({ ...redacted.meta, ...(custom?.meta || {}) });

      logger.error("http", message, meta);

      if (options?.onError) {
        try {
          await options.onError({ method, path, ms, status: 500, message, meta, error });
        } catch (hookError) {
          logger.warn("http", "onError hook failed", {
            method,
            path,
            hookError: hookError instanceof Error ? hookError.message : String(hookError),
          });
        }
      }

      if (options?.onUnhandledErrorResponse) {
        const mapped = await options.onUnhandledErrorResponse({ method, path, ms, message, meta, error });
        if (mapped) {
          logger.httpAccess(method, path, mapped.status, ms);
          return mapped;
        }
      }

      // 默认兜底：所有未捕获异常统一返回 JSON 500，避免回退到 Next 内置 HTML 错误页。
      const fallback = NextResponse.json(
        {
          success: false,
          message: "服务暂时不可用，请稍后再试",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
      logger.httpAccess(method, path, fallback.status, ms);
      return fallback;
    }
  };
}

export function defineApiHandlers<const T extends Record<string, AppRouteHandler>>(
  handlers: T,
  options?: DefineApiHandlersOptions
): T {
  const out = {} as T;

  for (const method of Object.keys(handlers) as (keyof T)[]) {
    const fn = handlers[method];
    if (typeof fn !== "function") continue;

    out[method] = wrapHandler(String(method), fn as AppRouteHandler, options) as T[keyof T];
  }

  return out;
}
