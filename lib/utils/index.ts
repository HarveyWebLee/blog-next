/**
 * 客户端安全的共享工具桶。
 * 切勿再 export auth / authz / request-auth：顶层会校验 JWT_SECRET，打进浏览器会在 production 抛错。
 */
export * from "./message";
export * from "./email-format";
export * from "./tool";
