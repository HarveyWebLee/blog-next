/**
 * 一次性脚本：将 app/api 中硬编码中文 message / createErrorResponse 替换为 apiMessage / localizedErrorResponse。
 * 运行：node scripts/migrate-api-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "app/api");

/** 硬编码中文 -> ApiMessageKey（与 lib/i18n/messages.ts 一致） */
const MSG_MAP = {
  环境配置检查失败: "ops.envCheckFailed",
  重置令牌和新密码不能为空: "auth.resetTokenPasswordRequired",
  密码强度不符合要求: "auth.passwordWeak",
  无效或过期的重置令牌: "auth.resetTokenInvalid",
  "重置令牌已过期，请重新申请": "auth.resetTokenExpired",
  "密码重置成功，请使用新密码登录": "auth.resetPasswordSuccess",
  尚未关注该用户: "profile.notFollowing",
  已取消关注: "profile.unfollowSuccess",
  统计信息获取成功: "profile.statsSuccess",
  "无效的用户 ID": "common.invalidUserId",
  用户不存在: "common.userNotFound",
  请求体无效: "common.invalidRequestBody",
  无效的角色: "admin.invalidRole",
  无效的状态: "admin.invalidStatus",
  "请至少提供 role 或 status": "admin.roleStatusRequired",
  "不可修改根账户（超级管理员本人）的角色与状态": "admin.cannotModifyRoot",
  已更新: "admin.updated",
  粉丝列表获取成功: "profile.followersListSuccess",
  通知列表获取成功: "notification.legacyListSuccess",
  请提供要标记的通知ID或设置markAllAsRead为true: "notification.legacyMarkNeedIds",
  通知标记成功: "notification.legacyMarkSuccess",
  通知ID不能为空: "notification.legacyIdRequired",
  通知删除成功: "notification.deleteSuccess",
  点赞列表获取成功: "profile.likesListSuccess",
  文章ID不能为空: "profile.postIdRequired",
  取消点赞成功: "profile.unlikeSuccess",
  关注列表获取成功: "profile.followingListSuccess",
  "followingId 无效": "profile.followInvalidId",
  不能关注自己: "profile.followSelf",
  目标用户不存在: "profile.followTargetNotFound",
  已关注该用户: "profile.alreadyFollowing",
  关注成功: "profile.followSuccess",
  "targetUserId 无效": "profile.unfollowInvalidId",
  收藏列表获取成功: "profile.favoritesListSuccess",
  文章不存在: "post.notFound",
  该文章当前不可收藏: "post.notFavoritable",
  已经收藏过该文章: "post.alreadyFavorited",
  收藏成功: "post.favoriteSuccess",
  取消收藏成功: "post.unfavoriteSuccess",
  活动日志获取成功: "profile.activitiesListSuccess",
  活动类型不能为空: "profile.activityTypeRequired",
  活动记录成功: "profile.activityLogSuccess",
  无效的通知类型: "notification.invalidType",
  获取通知列表成功: "notification.listSuccess",
  已全部标记为已读: "notification.markAllSuccess",
  "请提供 notificationIds 或 markAllAsRead=true": "notification.markNeedIds",
  无可操作的通知: "notification.noOp",
  通知批量标记成功: "notification.batchMarkSuccess",
  已清理全部已读通知: "notification.clearReadSuccess",
  "请提供 notificationIds 或 clearRead=true": "notification.deleteNeedIds",
  标题和类型是必填项: "notification.createRequired",
  通知创建成功: "notification.createSuccess",
  通知不存在: "notification.notFound",
  无权访问该通知: "notification.forbidden",
  无效的通知ID: "notification.invalidId",
  获取通知详情成功: "notification.detailSuccess",
  未提供可更新字段: "notification.updateNoFields",
  通知更新成功: "notification.updateSuccess",
  数据库种子数据初始化完成: "ops.seedSuccess",
  种子数据初始化失败: "ops.seedFailed",
  无效的分类ID: "taxonomy.invalidCategoryId",
  分类不存在: "taxonomy.categoryNotFound",
  分类获取成功: "taxonomy.categoryFetchSuccess",
  分类名称已存在: "taxonomy.nameExists",
  分类slug已存在: "taxonomy.slugExists",
  分类更新成功: "taxonomy.categoryUpdateSuccess",
  "无法删除分类，该分类下还有文章": "taxonomy.cannotDeleteHasPosts",
  "无法删除分类，该分类下还有子分类": "taxonomy.cannotDeleteHasChildren",
  分类删除成功: "taxonomy.categoryDeleteSuccess",
  分类列表获取成功: "taxonomy.categoryListSuccess",
  分类名称和slug不能为空: "taxonomy.nameSlugRequired",
  分类创建成功: "taxonomy.categoryCreateSuccess",
  无效的标签ID: "taxonomy.invalidTagId",
  标签不存在: "taxonomy.tagNotFound",
  标签获取成功: "taxonomy.tagFetchSuccess",
  标签名称已存在: "taxonomy.tagNameExists",
  标签slug已存在: "taxonomy.tagSlugExists",
  标签更新成功: "taxonomy.tagUpdateSuccess",
  标签删除成功: "taxonomy.tagDeleteSuccess",
  标签列表获取成功: "taxonomy.tagListSuccess",
  标签名称和slug不能为空: "taxonomy.tagNameSlugRequired",
  标签创建成功: "taxonomy.tagCreateSuccess",
  邮箱为必填项: "auth.emailRequired",
  "邮箱格式不符合规范，请填写有效的邮箱地址": "auth.emailInvalid",
  验证码类型不正确: "auth.verificationTypeInvalid",
  "该邮箱已处于订阅状态，无需重复订阅": "auth.emailAlreadySubscribed",
  "该邮箱当前未订阅，无法发送退订验证码": "auth.emailNotSubscribed",
  "邮箱已存在，已被用户使用": "auth.emailAlreadyUsed",
  "验证码发送过于频繁，请1分钟后再试": "auth.verificationRateLimit",
  验证码已发送到您的邮箱: "auth.verificationSent",
  资料受限: "profile.publicRestricted",
  公开资料获取成功: "profile.publicFetchSuccess",
  数据库连接测试成功: "ops.dbTestSuccess",
  缺少必要的环境变量: "common.missingEnvVars",
  数据库连接测试执行失败: "ops.dbTestFailed",
  "订阅服务暂时不可用，请稍后再试": "subscription.unavailable",
  "服务暂时不可用，请稍后再试": "common.serviceUnavailable",
  邮箱不能为空: "subscription.emailRequired",
  订阅状态获取成功: "subscription.statusSuccess",
  "登录已失效，请重新登录后再试": "common.loginExpired",
  请输入有效的邮箱地址: "subscription.emailInvalid",
  仅可为当前登录账号的邮箱办理订阅: "subscription.emailMismatch",
  "请先获取邮箱验证码，验证通过后方可订阅": "subscription.codeRequired",
  "该邮箱已订阅，无需重复订阅": "subscription.alreadySubscribed",
  订阅成功: "subscription.success",
  仅可为当前登录账号的邮箱办理退订: "subscription.unsubscribeEmailMismatch",
  "请先获取邮箱验证码，验证通过后方可取消订阅": "subscription.unsubscribeCodeRequired",
  该邮箱当前未订阅: "subscription.notSubscribed",
  取消订阅成功: "subscription.unsubscribeSuccess",
  个人资料获取成功: "profile.fetchSuccess",
  "个人资料已存在，请使用PUT方法更新": "profile.existsUsePut",
  个人资料创建成功: "profile.createSuccess",
  "个人资料不存在，请先创建": "profile.notFoundCreateFirst",
  个人资料更新成功: "profile.updateSuccess",
  邮箱和验证码不能为空: "auth.verifyEmailCodeRequired",
  验证码无效或已过期: "auth.verifyCodeInvalid",
  验证码验证成功: "auth.verifyCodeSuccess",
  网易云歌单拉取失败: "music.playlistFetchFailed",
  歌单为空: "music.playlistEmpty",
  未找到可免费播放曲目: "music.noFreeTracks",
  网易云歌曲地址拉取失败: "music.trackUrlFailed",
  网易云可播放曲目获取成功: "music.tracksSuccess",
  用户名和密码不能为空: "auth.usernamePasswordRequired",
  用户名或密码错误: "auth.invalidCredentials",
  登录成功: "auth.loginSuccess",
  "账户已停用或受限，无法登录。如有疑问请联系管理员。": "auth.accountDisabled",
  服务器内部错误: "common.internalError",
  未提供刷新令牌: "auth.refreshTokenMissing",
  无效的刷新令牌: "auth.invalidRefreshToken",
  超级管理员登录已禁用: "auth.superAdminDisabled",
  超级管理员身份不可用: "auth.superAdminUnavailable",
  刷新成功: "auth.refreshSuccess",
  账户不可用: "auth.accountUnavailable",
  用户名为必填项: "auth.usernameRequired",
  显示名称为必填项: "auth.displayNameRequired",
  密码为必填项: "auth.passwordRequired",
  请输入邮箱验证码: "auth.verificationCodeRequired",
  邮箱验证码无效或已过期: "auth.verificationCodeInvalid",
  用户名已存在: "auth.usernameExists",
  邮箱已被注册: "auth.emailRegistered",
  注册成功: "auth.registerSuccess",
  "请求体 JSON 格式不正确": "auth.forgotPasswordInvalidJson",
  邮箱地址不能为空: "auth.forgotPasswordEmailRequired",
  邮箱格式不正确: "auth.forgotPasswordEmailInvalid",
  "请求过于频繁，请稍后重试": "common.rateLimit",
  该邮箱地址未注册: "auth.forgotPasswordEmailNotRegistered",
  "邮件发送失败，请稍后重试": "auth.forgotPasswordEmailSendFailed",
  "密码重置邮件已发送，请检查您的邮箱": "auth.forgotPasswordEmailSent",
  ok: "common.ok",
  获取用户列表失败: "admin.usersListFailed",
  获取评论审核列表成功: "admin.commentsListSuccess",
  "ids 不能为空": "admin.idsRequired",
  "status 必须为 pending/approved/spam": "admin.invalidCommentStatus",
  评论不存在: "admin.commentNotFound",
  批量更新评论状态成功: "admin.batchCommentUpdateSuccess",
  批量删除评论成功: "admin.batchCommentDeleteSuccess",
  "无效的评论 ID": "admin.invalidCommentId",
  评论状态更新成功: "admin.commentUpdateSuccess",
  评论删除成功: "admin.commentDeleteSuccess",
  无效的文章ID: "post.invalidId",
  该文章当前不可互动: "post.notInteractive",
  请先登录: "common.pleaseLogin",
  获取点赞状态成功: "post.likeStatusSuccess",
  点赞成功: "post.likeSuccess",
  获取点赞状态失败: "post.likeStatusFailed",
  点赞操作失败: "post.likeFailed",
  获取收藏状态成功: "post.favoriteStatusSuccess",
  获取收藏状态失败: "post.favoriteStatusFailed",
  收藏操作失败: "post.favoriteFailed",
  页码必须大于0: "post.pageMustBePositive",
  "每页数量必须在1-100之间": "post.limitRange",
  按作者筛选文章需先登录: "post.authorFilterNeedLogin",
  无权查看其他作者的管理列表: "post.noPermissionOtherAuthor",
  "查看 private 文章需先登录": "post.privateNeedLogin",
  "仅超级管理员可查看全站 private 文章": "post.privateSuperAdminOnly",
  文章标题和内容不能为空: "post.titleContentRequired",
  文章标题不能超过200个字符: "post.titleTooLong",
  文章内容不能少于10个字符: "post.contentTooShort",
  "可见性为密码保护时，访问密码不能为空": "post.passwordVisibilityRequired",
  请先登录后再创建文章: "post.createNeedLogin",
  "文章别名已存在，请使用不同的标题或别名": "post.slugExists",
  获取文章列表失败: "post.listFetchFailed",
  创建文章失败: "post.createFailed",
  获取文章详情失败: "post.fetchFailed",
  删除文章失败: "post.deleteFailed",
  更新文章失败: "post.updateFailed",
  无效的文章状态: "post.invalidStatus",
  无效的文章可见性: "post.invalidVisibility",
  文章slug不能为空: "post.slugRequired",
  密码错误: "post.wrongPassword",
  该文章当前不可分享: "post.notShareable",
  记录分享失败: "post.shareFailed",
  该文章当前不可访问: "post.notAccessible",
  评论内容长度不符合要求: "comment.contentInvalid",
  该文章未开放评论: "comment.notAllowed",
  "评论提交成功，等待审核": "comment.submitSuccess",
  评论提交失败: "comment.submitFailed",
  "对象存储未配置，请联系管理员配置 MINIO_* 环境变量": "upload.storageNotConfigured",
  "请使用 multipart 上传字段 file": "upload.multipartRequired",
  "scope 仅支持 article 或 profile": "upload.invalidScope",
  文件为空: "upload.fileEmpty",
  "图片大小不能超过 10MB": "upload.fileTooLarge",
  "仅支持 JPEG、PNG、GIF、WebP 图片": "upload.invalidType",
  "MINIO_PUBLIC_BASE_URL 未配置，无法生成访问地址": "upload.publicUrlMissing",
  对象存储未配置: "upload.storageUnavailable",
  "缺少参数 key": "upload.keyRequired",
  无权删除该资源: "upload.forbiddenDelete",
  上传失败: "upload.failed",
  上传成功: "upload.success",
  已删除: "upload.deleted",
  获取文章列表成功: "post.listSuccess",
  文章创建成功: "post.createSuccess",
  获取文章详情成功: "post.fetchDetailSuccess",
  文章更新成功: "post.updateSuccess",
  文章删除成功: "post.deleteSuccess",
  文章无需密码: "post.noPasswordRequired",
  密码验证成功: "post.passwordVerifySuccess",
  取消点赞成功: "post.unlikeSuccess",
};

const CREATE_ERR_MAP = { ...MSG_MAP };

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "api-docs") continue;
      walk(p, acc);
    } else if (ent.name === "route.ts") {
      acc.push(p);
    }
  }
  return acc;
}

function ensureImports(content) {
  let c = content;
  const needApi =
    c.includes("apiMessage(") ||
    c.includes("localizedErrorResponse(") ||
    c.includes("localizedSuccessResponse(") ||
    c.includes("jsonError(") ||
    c.includes("jsonSuccess(") ||
    c.includes("jsonRateLimitError(");
  const needAuth = c.includes("authErrorMessage(");

  if (needApi && !c.includes("@/lib/i18n/api-response")) {
    const importLine =
      'import { apiMessage, localizedErrorResponse, localizedSuccessResponse, jsonRateLimitError } from "@/lib/i18n/api-response";\n';
    const idx = c.indexOf("\n\n");
    c = c.slice(0, idx + 1) + importLine + c.slice(idx + 1);
  }
  if (needAuth && !c.includes("authErrorMessage") && c.includes("authErrorMessage(")) {
    // noop
  }
  if (needAuth && c.includes("authErrorMessage(") && !/authErrorMessage.*request-auth/.test(c)) {
    if (c.includes('from "@/lib/utils/request-auth"')) {
      c = c.replace(/import \{([^}]*)\} from "@\/lib\/utils\/request-auth";/, (_, inner) => {
        const parts = inner
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (!parts.includes("authErrorMessage")) parts.push("authErrorMessage");
        return `import { ${parts.join(", ")} } from "@/lib/utils/request-auth";`;
      });
    } else {
      c = c.replace(/^(import .+\n)/m, `$1import { authErrorMessage } from "@/lib/utils/request-auth";\n`);
    }
  }
  return c;
}

function migrateFile(filePath) {
  let c = fs.readFileSync(filePath, "utf8");
  const orig = c;

  // message: "中文"
  for (const [zh, key] of Object.entries(MSG_MAP)) {
    const esc = zh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    c = c.replace(new RegExp(`message:\\s*"${esc}"`, "g"), `message: apiMessage(request, "${key}")`);
    c = c.replace(new RegExp(`message:\\s*'${esc}'`, "g"), `message: apiMessage(request, '${key}')`);
  }

  // createErrorResponse("中文")
  for (const [zh, key] of Object.entries(CREATE_ERR_MAP)) {
    const esc = zh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    c = c.replace(new RegExp(`createErrorResponse\\("${esc}"\\)`, "g"), `localizedErrorResponse(request, "${key}")`);
    c = c.replace(new RegExp(`createErrorResponse\\('${esc}'\\)`, "g"), `localizedErrorResponse(request, '${key}')`);
  }

  // createSuccessResponse(data, "中文")
  for (const [zh, key] of Object.entries(MSG_MAP)) {
    const esc = zh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    c = c.replace(
      new RegExp(`createSuccessResponse\\(([^,]+),\\s*"${esc}"\\)`, "g"),
      `localizedSuccessResponse(request, $1, "${key}")`
    );
  }

  // template literals with rate limit - skip for now

  c = ensureImports(c);

  if (c !== orig) {
    fs.writeFileSync(filePath, c);
    return true;
  }
  return false;
}

const files = walk(apiDir);
let n = 0;
for (const f of files) {
  if (migrateFile(f)) {
    n++;
    console.log("migrated:", path.relative(root, f));
  }
}
console.log("done", n, "files");
