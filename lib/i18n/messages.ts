import { DEFAULT_LOCALE } from "@/lib/i18n/locale";
import type { Locale } from "@/types/common";

/** 三语文案条目：{zh-CN, en-US, ja-JP} */
export type I18nEntry = Record<Locale, string>;

/** 支持 {name} 形式占位符 */
export type MessageParams = Record<string, string | number>;

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = params[key];
    return val === undefined ? `{${key}}` : String(val);
  });
}

/**
 * API 响应消息 catalog（键名用点分命名空间）。
 * 新增消息时须同时补齐 zh-CN / en-US / ja-JP。
 */
export const API_MESSAGES = {
  // --- common ---
  "common.operationSuccess": {
    "zh-CN": "操作成功",
    "en-US": "Operation successful",
    "ja-JP": "操作が完了しました",
  },
  "common.serviceUnavailable": {
    "zh-CN": "服务暂时不可用，请稍后再试",
    "en-US": "Service temporarily unavailable. Please try again later.",
    "ja-JP": "サービスは一時的に利用できません。しばらくしてから再度お試しください。",
  },
  "common.internalError": {
    "zh-CN": "服务器内部错误",
    "en-US": "Internal server error",
    "ja-JP": "サーバー内部エラー",
  },
  "common.tokenMissing": {
    "zh-CN": "未提供认证令牌",
    "en-US": "Authentication token not provided",
    "ja-JP": "認証トークンが提供されていません",
  },
  "common.tokenInvalid": {
    "zh-CN": "无效的认证令牌",
    "en-US": "Invalid authentication token",
    "ja-JP": "無効な認証トークンです",
  },
  "common.pleaseLogin": {
    "zh-CN": "请先登录",
    "en-US": "Please sign in first",
    "ja-JP": "先にログインしてください",
  },
  "common.loginExpired": {
    "zh-CN": "登录已失效，请重新登录后再试",
    "en-US": "Session expired. Please sign in again.",
    "ja-JP": "ログインの有効期限が切れました。再度ログインしてください。",
  },
  "common.superAdminRequired": {
    "zh-CN": "需要超级管理员权限",
    "en-US": "Super administrator privileges required",
    "ja-JP": "スーパー管理者権限が必要です",
  },
  "common.invalidUserId": {
    "zh-CN": "无效的用户 ID",
    "en-US": "Invalid user ID",
    "ja-JP": "無効なユーザー ID です",
  },
  "common.userNotFound": {
    "zh-CN": "用户不存在",
    "en-US": "User not found",
    "ja-JP": "ユーザーが見つかりません",
  },
  "common.invalidRequestBody": {
    "zh-CN": "请求体无效",
    "en-US": "Invalid request body",
    "ja-JP": "リクエスト本文が無効です",
  },
  "common.rateLimit": {
    "zh-CN": "请求过于频繁，请 {seconds} 秒后重试",
    "en-US": "Too many requests. Please try again in {seconds} seconds.",
    "ja-JP": "リクエストが多すぎます。{seconds} 秒後に再度お試しください。",
  },
  "common.missingEnvVars": {
    "zh-CN": "缺少必要的环境变量",
    "en-US": "Required environment variables are missing",
    "ja-JP": "必要な環境変数が不足しています",
  },
  "common.ok": {
    "zh-CN": "ok",
    "en-US": "ok",
    "ja-JP": "ok",
  },

  // --- auth ---
  "auth.usernamePasswordRequired": {
    "zh-CN": "用户名和密码不能为空",
    "en-US": "Username and password are required",
    "ja-JP": "ユーザー名とパスワードは必須です",
  },
  "auth.invalidCredentials": {
    "zh-CN": "用户名或密码错误",
    "en-US": "Invalid username or password",
    "ja-JP": "ユーザー名またはパスワードが正しくありません",
  },
  "auth.loginSuccess": {
    "zh-CN": "登录成功",
    "en-US": "Signed in successfully",
    "ja-JP": "ログインに成功しました",
  },
  "auth.accountDisabled": {
    "zh-CN": "账户已停用或受限，无法登录。如有疑问请联系管理员。",
    "en-US": "Account is disabled or restricted. Contact an administrator if you need help.",
    "ja-JP": "アカウントが停止または制限されています。管理者にお問い合わせください。",
  },
  "auth.refreshTokenMissing": {
    "zh-CN": "未提供刷新令牌",
    "en-US": "Refresh token not provided",
    "ja-JP": "リフレッシュトークンが提供されていません",
  },
  "auth.invalidRefreshToken": {
    "zh-CN": "无效的刷新令牌",
    "en-US": "Invalid refresh token",
    "ja-JP": "無効なリフレッシュトークンです",
  },
  "auth.superAdminDisabled": {
    "zh-CN": "超级管理员登录已禁用",
    "en-US": "Super administrator sign-in is disabled",
    "ja-JP": "スーパー管理者ログインは無効です",
  },
  "auth.superAdminUnavailable": {
    "zh-CN": "超级管理员身份不可用",
    "en-US": "Super administrator identity unavailable",
    "ja-JP": "スーパー管理者身份が利用できません",
  },
  "auth.refreshSuccess": {
    "zh-CN": "刷新成功",
    "en-US": "Token refreshed successfully",
    "ja-JP": "トークンの更新に成功しました",
  },
  "auth.logoutSuccess": {
    "zh-CN": "已退出登录",
    "en-US": "Signed out successfully",
    "ja-JP": "ログアウトしました",
  },
  "auth.originRejected": {
    "zh-CN": "请求来源不被允许",
    "en-US": "Request origin is not allowed",
    "ja-JP": "リクエスト元は許可されていません",
  },
  "auth.accountUnavailable": {
    "zh-CN": "账户不可用",
    "en-US": "Account unavailable",
    "ja-JP": "アカウントを利用できません",
  },
  "auth.usernameRequired": {
    "zh-CN": "用户名为必填项",
    "en-US": "Username is required",
    "ja-JP": "ユーザー名は必須です",
  },
  "auth.displayNameRequired": {
    "zh-CN": "显示名称为必填项",
    "en-US": "Display name is required",
    "ja-JP": "表示名は必須です",
  },
  "auth.emailRequired": {
    "zh-CN": "邮箱为必填项",
    "en-US": "Email is required",
    "ja-JP": "メールアドレスは必須です",
  },
  "auth.emailInvalid": {
    "zh-CN": "邮箱格式不符合规范，请填写有效的邮箱地址",
    "en-US": "Invalid email format. Please enter a valid email address.",
    "ja-JP": "メール形式が正しくありません。有効なメールアドレスを入力してください。",
  },
  "auth.passwordRequired": {
    "zh-CN": "密码为必填项",
    "en-US": "Password is required",
    "ja-JP": "パスワードは必須です",
  },
  "auth.verificationCodeRequired": {
    "zh-CN": "请输入邮箱验证码",
    "en-US": "Email verification code is required",
    "ja-JP": "メール認証コードを入力してください",
  },
  "auth.verificationCodeInvalid": {
    "zh-CN": "邮箱验证码无效或已过期",
    "en-US": "Email verification code is invalid or expired",
    "ja-JP": "メール認証コードが無効または期限切れです",
  },
  "auth.passwordWeak": {
    "zh-CN": "密码强度不符合要求",
    "en-US": "Password does not meet strength requirements",
    "ja-JP": "パスワードが強度要件を満たしていません",
  },
  "auth.usernameExists": {
    "zh-CN": "用户名已存在",
    "en-US": "Username already exists",
    "ja-JP": "ユーザー名は既に存在します",
  },
  "auth.emailRegistered": {
    "zh-CN": "邮箱已被注册",
    "en-US": "Email is already registered",
    "ja-JP": "メールアドレスは既に登録されています",
  },
  "auth.registerSuccess": {
    "zh-CN": "注册成功",
    "en-US": "Registration successful",
    "ja-JP": "登録に成功しました",
  },
  "auth.verificationTypeInvalid": {
    "zh-CN": "验证码类型不正确",
    "en-US": "Invalid verification code type",
    "ja-JP": "認証コードの種類が正しくありません",
  },
  "auth.emailAlreadySubscribed": {
    "zh-CN": "该邮箱已处于订阅状态，无需重复订阅",
    "en-US": "This email is already subscribed",
    "ja-JP": "このメールアドレスは既に購読中です",
  },
  "auth.emailNotSubscribed": {
    "zh-CN": "该邮箱当前未订阅，无法发送退订验证码",
    "en-US": "This email is not subscribed; cannot send unsubscribe code",
    "ja-JP": "このメールアドレスは未購読のため、退会コードを送信できません",
  },
  "auth.emailAlreadyUsed": {
    "zh-CN": "邮箱已存在，已被用户使用",
    "en-US": "Email is already in use",
    "ja-JP": "メールアドレスは既に使用されています",
  },
  "auth.verificationRateLimit": {
    "zh-CN": "验证码发送过于频繁，请1分钟后再试",
    "en-US": "Verification codes sent too frequently. Please try again in one minute.",
    "ja-JP": "認証コードの送信が多すぎます。1 分後に再度お試しください。",
  },
  "auth.verificationSent": {
    "zh-CN": "验证码已发送到您的邮箱",
    "en-US": "Verification code sent to your email",
    "ja-JP": "認証コードをメールに送信しました",
  },
  "auth.verifyEmailCodeRequired": {
    "zh-CN": "邮箱和验证码不能为空",
    "en-US": "Email and verification code are required",
    "ja-JP": "メールアドレスと認証コードは必須です",
  },
  "auth.verifyCodeInvalid": {
    "zh-CN": "验证码无效或已过期",
    "en-US": "Verification code is invalid or expired",
    "ja-JP": "認証コードが無効または期限切れです",
  },
  "auth.verifyCodeSuccess": {
    "zh-CN": "验证码验证成功",
    "en-US": "Verification code validated successfully",
    "ja-JP": "認証コードの検証に成功しました",
  },
  "auth.resetTokenPasswordRequired": {
    "zh-CN": "重置令牌和新密码不能为空",
    "en-US": "Reset token and new password are required",
    "ja-JP": "リセットトークンと新しいパスワードは必須です",
  },
  "auth.resetTokenInvalid": {
    "zh-CN": "无效或过期的重置令牌",
    "en-US": "Invalid or expired reset token",
    "ja-JP": "無効または期限切れのリセットトークンです",
  },
  "auth.resetTokenExpired": {
    "zh-CN": "重置令牌已过期，请重新申请",
    "en-US": "Reset token expired. Please request a new one.",
    "ja-JP": "リセットトークンの有効期限が切れました。再度申請してください。",
  },
  "auth.resetPasswordSuccess": {
    "zh-CN": "密码重置成功，请使用新密码登录",
    "en-US": "Password reset successful. Please sign in with your new password.",
    "ja-JP": "パスワードのリセットに成功しました。新しいパスワードでログインしてください。",
  },
  "auth.forgotPasswordInvalidJson": {
    "zh-CN": "请求体 JSON 格式不正确",
    "en-US": "Invalid JSON in request body",
    "ja-JP": "リクエスト本文の JSON 形式が正しくありません",
  },
  "auth.forgotPasswordEmailRequired": {
    "zh-CN": "邮箱地址不能为空",
    "en-US": "Email address is required",
    "ja-JP": "メールアドレスは必須です",
  },
  "auth.forgotPasswordEmailInvalid": {
    "zh-CN": "邮箱格式不正确",
    "en-US": "Invalid email format",
    "ja-JP": "メール形式が正しくありません",
  },
  "auth.forgotPasswordEmailNotRegistered": {
    "zh-CN": "该邮箱地址未注册",
    "en-US": "This email is not registered",
    "ja-JP": "このメールアドレスは登録されていません",
  },
  "auth.forgotPasswordEmailSendFailed": {
    "zh-CN": "邮件发送失败，请稍后重试",
    "en-US": "Failed to send email. Please try again later.",
    "ja-JP": "メール送信に失敗しました。しばらくしてから再度お試しください。",
  },
  "auth.forgotPasswordEmailSent": {
    "zh-CN": "密码重置邮件已发送，请检查您的邮箱",
    "en-US": "Password reset email sent. Please check your inbox.",
    "ja-JP": "パスワードリセットメールを送信しました。受信トレイをご確認ください。",
  },

  // --- post ---
  "post.invalidId": {
    "zh-CN": "无效的文章ID",
    "en-US": "Invalid post ID",
    "ja-JP": "無効な記事 ID です",
  },
  "post.notFound": {
    "zh-CN": "文章不存在",
    "en-US": "Post not found",
    "ja-JP": "記事が見つかりません",
  },
  "post.slugRequired": {
    "zh-CN": "文章slug不能为空",
    "en-US": "Post slug is required",
    "ja-JP": "記事 slug は必須です",
  },
  "post.notInteractive": {
    "zh-CN": "该文章当前不可互动",
    "en-US": "This post is not interactive",
    "ja-JP": "この記事は現在インタラクションできません",
  },
  "post.notShareable": {
    "zh-CN": "该文章当前不可分享",
    "en-US": "This post cannot be shared",
    "ja-JP": "この記事は現在共有できません",
  },
  "post.notAccessible": {
    "zh-CN": "该文章当前不可访问",
    "en-US": "This post is not accessible",
    "ja-JP": "この記事には現在アクセスできません",
  },
  "post.pageMustBePositive": {
    "zh-CN": "页码必须大于0",
    "en-US": "Page number must be greater than 0",
    "ja-JP": "ページ番号は 0 より大きい必要があります",
  },
  "post.limitRange": {
    "zh-CN": "每页数量必须在1-100之间",
    "en-US": "Page size must be between 1 and 100",
    "ja-JP": "1 ページあたりの件数は 1〜100 の範囲である必要があります",
  },
  "post.authorFilterNeedLogin": {
    "zh-CN": "按作者筛选文章需先登录",
    "en-US": "Sign in to filter posts by author",
    "ja-JP": "著者で絞り込むにはログインが必要です",
  },
  "post.noPermissionOtherAuthor": {
    "zh-CN": "无权查看其他作者的管理列表",
    "en-US": "You cannot view another author's management list",
    "ja-JP": "他の著者の管理リストを表示する権限がありません",
  },
  "post.privateNeedLogin": {
    "zh-CN": "查看 private 文章需先登录",
    "en-US": "Sign in to view private posts",
    "ja-JP": "非公開記事を表示するにはログインが必要です",
  },
  "post.privateSuperAdminOnly": {
    "zh-CN": "仅超级管理员可查看全站 private 文章",
    "en-US": "Only super administrators can view all private posts",
    "ja-JP": "全サイトの非公開記事はスーパー管理者のみ閲覧できます",
  },
  "post.titleContentRequired": {
    "zh-CN": "文章标题和内容不能为空",
    "en-US": "Post title and content are required",
    "ja-JP": "記事のタイトルと本文は必須です",
  },
  "post.titleTooLong": {
    "zh-CN": "文章标题不能超过200个字符",
    "en-US": "Post title cannot exceed 200 characters",
    "ja-JP": "記事タイトルは 200 文字以内にしてください",
  },
  "post.contentTooShort": {
    "zh-CN": "文章内容不能少于10个字符",
    "en-US": "Post content must be at least 10 characters",
    "ja-JP": "記事本文は 10 文字以上必要です",
  },
  "post.passwordVisibilityRequired": {
    "zh-CN": "可见性为密码保护时，访问密码不能为空",
    "en-US": "Access password is required for password-protected visibility",
    "ja-JP": "パスワード保護の公開範囲ではアクセスパスワードが必須です",
  },
  "post.createNeedLogin": {
    "zh-CN": "请先登录后再创建文章",
    "en-US": "Please sign in before creating a post",
    "ja-JP": "記事を作成する前にログインしてください",
  },
  "post.slugExists": {
    "zh-CN": "文章别名已存在，请使用不同的标题或别名",
    "en-US": "Post slug already exists. Use a different title or slug.",
    "ja-JP": "記事 slug は既に存在します。別のタイトルまたは slug を使用してください。",
  },
  "post.listFetchFailed": {
    "zh-CN": "获取文章列表失败",
    "en-US": "Failed to fetch post list",
    "ja-JP": "記事一覧の取得に失敗しました",
  },
  "post.createFailed": {
    "zh-CN": "创建文章失败",
    "en-US": "Failed to create post",
    "ja-JP": "記事の作成に失敗しました",
  },
  "post.fetchFailed": {
    "zh-CN": "获取文章详情失败",
    "en-US": "Failed to fetch post details",
    "ja-JP": "記事詳細の取得に失敗しました",
  },
  "post.updateFailed": {
    "zh-CN": "更新文章失败",
    "en-US": "Failed to update post",
    "ja-JP": "記事の更新に失敗しました",
  },
  "post.deleteFailed": {
    "zh-CN": "删除文章失败",
    "en-US": "Failed to delete post",
    "ja-JP": "記事の削除に失敗しました",
  },
  "post.invalidStatus": {
    "zh-CN": "无效的文章状态",
    "en-US": "Invalid post status",
    "ja-JP": "無効な記事ステータスです",
  },
  "post.invalidVisibility": {
    "zh-CN": "无效的文章可见性",
    "en-US": "Invalid post visibility",
    "ja-JP": "無効な記事の公開範囲です",
  },
  "post.likeSuccess": {
    "zh-CN": "点赞成功",
    "en-US": "Liked successfully",
    "ja-JP": "いいねしました",
  },
  "post.unlikeSuccess": {
    "zh-CN": "取消点赞成功",
    "en-US": "Like removed",
    "ja-JP": "いいねを取り消しました",
  },
  "post.likeStatusSuccess": {
    "zh-CN": "获取点赞状态成功",
    "en-US": "Like status retrieved",
    "ja-JP": "いいね状態を取得しました",
  },
  "post.likeFailed": {
    "zh-CN": "点赞操作失败",
    "en-US": "Like operation failed",
    "ja-JP": "いいね操作に失敗しました",
  },
  "post.likeStatusFailed": {
    "zh-CN": "获取点赞状态失败",
    "en-US": "Failed to get like status",
    "ja-JP": "いいね状態の取得に失敗しました",
  },
  "post.favoriteSuccess": {
    "zh-CN": "收藏成功",
    "en-US": "Added to favorites",
    "ja-JP": "お気に入りに追加しました",
  },
  "post.unfavoriteSuccess": {
    "zh-CN": "取消收藏成功",
    "en-US": "Removed from favorites",
    "ja-JP": "お気に入りを解除しました",
  },
  "post.favoriteStatusSuccess": {
    "zh-CN": "获取收藏状态成功",
    "en-US": "Favorite status retrieved",
    "ja-JP": "お気に入り状態を取得しました",
  },
  "post.favoriteFailed": {
    "zh-CN": "收藏操作失败",
    "en-US": "Favorite operation failed",
    "ja-JP": "お気に入り操作に失敗しました",
  },
  "post.favoriteStatusFailed": {
    "zh-CN": "获取收藏状态失败",
    "en-US": "Failed to get favorite status",
    "ja-JP": "お気に入り状態の取得に失敗しました",
  },
  "post.notFavoritable": {
    "zh-CN": "该文章当前不可收藏",
    "en-US": "This post cannot be favorited",
    "ja-JP": "この記事は現在お気に入りに追加できません",
  },
  "post.alreadyFavorited": {
    "zh-CN": "已经收藏过该文章",
    "en-US": "Post already in favorites",
    "ja-JP": "この記事は既にお気に入りに追加されています",
  },
  "post.shareFailed": {
    "zh-CN": "记录分享失败",
    "en-US": "Failed to record share",
    "ja-JP": "共有の記録に失敗しました",
  },
  "post.listSuccess": {
    "zh-CN": "获取文章列表成功",
    "en-US": "Post list retrieved",
    "ja-JP": "記事一覧を取得しました",
  },
  "post.createSuccess": {
    "zh-CN": "文章创建成功",
    "en-US": "Post created",
    "ja-JP": "記事を作成しました",
  },
  "post.fetchDetailSuccess": {
    "zh-CN": "获取文章详情成功",
    "en-US": "Post details retrieved",
    "ja-JP": "記事詳細を取得しました",
  },
  "post.updateSuccess": {
    "zh-CN": "文章更新成功",
    "en-US": "Post updated",
    "ja-JP": "記事を更新しました",
  },
  "post.deleteSuccess": {
    "zh-CN": "文章删除成功",
    "en-US": "Post deleted",
    "ja-JP": "記事を削除しました",
  },
  "post.noPasswordRequired": {
    "zh-CN": "文章无需密码",
    "en-US": "No password required for this post",
    "ja-JP": "この記事にパスワードは不要です",
  },
  "post.passwordVerifySuccess": {
    "zh-CN": "密码验证成功",
    "en-US": "Password verified",
    "ja-JP": "パスワードを確認しました",
  },
  "post.plainPasswordRejected": {
    "zh-CN": "此接口不接受明文密码，请升级客户端",
    "en-US": "Plaintext passwords are not accepted. Please upgrade your client.",
    "ja-JP": "この API は平文パスワードを受け付けません。クライアントを更新してください。",
  },
  "post.secretFieldMissing": {
    "zh-CN": "缺少密钥或密码字段",
    "en-US": "Secret or password field is missing",
    "ja-JP": "秘密鍵またはパスワードフィールドがありません",
  },
  "post.passwordTransportMisconfigured": {
    "zh-CN": "服务端密码传输配置缺失，请联系管理员",
    "en-US": "Password transport is not configured on the server. Contact an administrator.",
    "ja-JP": "サーバー側のパスワード転送設定がありません。管理者にお問い合わせください。",
  },
  "post.passwordTransportNotConfigured": {
    "zh-CN": "服务端未配置密码传输密钥，无法接受加密包",
    "en-US": "Password transport keys are not configured; encrypted payload rejected.",
    "ja-JP": "パスワード転送鍵が未設定のため、暗号化ペイロードを受け付けられません。",
  },
  "post.passwordTransportRequired": {
    "zh-CN": "必须使用加密方式提交访问密码",
    "en-US": "Access password must be submitted using encrypted transport.",
    "ja-JP": "アクセスパスワードは暗号化方式で送信する必要があります。",
  },
  "auth.passwordFieldTransportRequired": {
    "zh-CN": "必须使用加密方式提交密码字段",
    "en-US": "Password fields must be submitted using encrypted transport.",
    "ja-JP": "パスワードフィールドは暗号化方式で送信する必要があります。",
  },
  "post.wrongPassword": {
    "zh-CN": "密码错误",
    "en-US": "Incorrect password",
    "ja-JP": "パスワードが正しくありません",
  },

  // --- comment ---
  "comment.contentInvalid": {
    "zh-CN": "评论内容长度不符合要求",
    "en-US": "Comment length does not meet requirements",
    "ja-JP": "コメントの長さが要件を満たしていません",
  },
  "comment.notAllowed": {
    "zh-CN": "该文章未开放评论",
    "en-US": "Comments are disabled for this post",
    "ja-JP": "この記事ではコメントが無効です",
  },
  "comment.submitPending": {
    "zh-CN": "评论提交成功，审核通过后将展示",
    "en-US": "Comment submitted. It will appear after approval.",
    "ja-JP": "コメントを送信しました。承認後に表示されます。",
  },
  "comment.submitSpam": {
    "zh-CN": "评论已提交，系统已进入风控审核队列",
    "en-US": "Comment submitted and queued for spam review.",
    "ja-JP": "コメントを送信しました。スパム審査キューに入りました。",
  },
  "comment.submitRateLimit": {
    "zh-CN": "提交过于频繁，请 {seconds} 秒后重试",
    "en-US": "Too many submissions. Please try again in {seconds} seconds.",
    "ja-JP": "送信が多すぎます。{seconds} 秒後に再度お試しください。",
  },
  "post.shareRateLimit": {
    "zh-CN": "分享操作过于频繁，请 {seconds} 秒后重试",
    "en-US": "Too many share actions. Please try again in {seconds} seconds.",
    "ja-JP": "共有操作が多すぎます。{seconds} 秒後に再度お試しください。",
  },
  "post.viewRateLimit": {
    "zh-CN": "请求过于频繁，请 {seconds} 秒后重试",
    "en-US": "Too many requests. Please try again in {seconds} seconds.",
    "ja-JP": "リクエストが多すぎます。{seconds} 秒後に再度お試しください。",
  },
  "post.engagementIdsRequired": {
    "zh-CN": "缺少 ids 参数",
    "en-US": "Missing ids parameter",
    "ja-JP": "ids パラメータがありません",
  },
  "post.shareRecorded": {
    "zh-CN": "已记录分享",
    "en-US": "Share recorded",
    "ja-JP": "共有を記録しました",
  },
  "post.viewIncrementSuccess": {
    "zh-CN": "增加浏览次数成功",
    "en-US": "View count incremented",
    "ja-JP": "閲覧数を増やしました",
  },
  "post.engagementSuccess": {
    "zh-CN": "获取互动状态成功",
    "en-US": "Engagement status retrieved",
    "ja-JP": "インタラクション状態を取得しました",
  },
  "post.engagementIdsInvalid": {
    "zh-CN": "ids 参数无有效文章ID",
    "en-US": "No valid post IDs in ids parameter",
    "ja-JP": "ids パラメータに有効な記事 ID がありません",
  },
  "post.engagementFailed": {
    "zh-CN": "获取互动状态失败",
    "en-US": "Failed to fetch engagement status",
    "ja-JP": "インタラクション状態の取得に失敗しました",
  },
  "upload.success": {
    "zh-CN": "上传成功",
    "en-US": "Upload successful",
    "ja-JP": "アップロードに成功しました",
  },
  "upload.deleted": {
    "zh-CN": "已删除",
    "en-US": "Deleted",
    "ja-JP": "削除しました",
  },
  "comment.submitFailed": {
    "zh-CN": "评论提交失败",
    "en-US": "Failed to submit comment",
    "ja-JP": "コメントの送信に失敗しました",
  },
  "comment.listSuccess": {
    "zh-CN": "评论列表获取成功",
    "en-US": "Comments retrieved",
    "ja-JP": "コメント一覧を取得しました",
  },
  "comment.listFailed": {
    "zh-CN": "评论列表获取失败",
    "en-US": "Failed to retrieve comments",
    "ja-JP": "コメント一覧の取得に失敗しました",
  },
  "comment.parentInvalid": {
    "zh-CN": "无效的父评论 ID",
    "en-US": "Invalid parent comment ID",
    "ja-JP": "無効な親コメント ID です",
  },
  "comment.parentNotFound": {
    "zh-CN": "父评论不存在",
    "en-US": "Parent comment not found",
    "ja-JP": "親コメントが見つかりません",
  },
  "comment.parentCrossPost": {
    "zh-CN": "不能回复其他文章下的评论",
    "en-US": "Cannot reply to a comment from another post",
    "ja-JP": "別の記事のコメントには返信できません",
  },
  "comment.parentDepthExceeded": {
    "zh-CN": "仅支持回复顶层评论（最多两层）",
    "en-US": "Only top-level comments can be replied to (max two levels)",
    "ja-JP": "トップレベルコメントへの返信のみ可能です（最大2階層）",
  },
  "comment.parentDeleted": {
    "zh-CN": "原评论已删除，无法继续回复",
    "en-US": "The original comment was deleted and can no longer be replied to",
    "ja-JP": "元のコメントは削除済みのため返信できません",
  },

  // --- comment notifications（写入 user_notifications 的标题/正文）---
  "notification.comment.replyTitle": {
    "zh-CN": "你的评论收到了回复",
    "en-US": "Someone replied to your comment",
    "ja-JP": "あなたのコメントに返信がありました",
  },
  "notification.comment.replyContent": {
    "zh-CN": "{actorName} 回复了你在《{postTitle}》下的评论：{preview}",
    "en-US": "{actorName} replied to your comment on “{postTitle}”: {preview}",
    "ja-JP": "{actorName} が「{postTitle}」のコメントに返信しました：{preview}",
  },
  "notification.comment.newTitle": {
    "zh-CN": "文章收到了新评论",
    "en-US": "New comment on your post",
    "ja-JP": "記事に新しいコメントがあります",
  },
  "notification.comment.newContent": {
    "zh-CN": "{actorName} 评论了《{postTitle}》：{preview}",
    "en-US": "{actorName} commented on “{postTitle}”: {preview}",
    "ja-JP": "{actorName} が「{postTitle}」にコメントしました：{preview}",
  },
  "notification.comment.approvedTitle": {
    "zh-CN": "你的评论已通过审核",
    "en-US": "Your comment was approved",
    "ja-JP": "コメントが承認されました",
  },
  "notification.comment.approvedContent": {
    "zh-CN": "你在《{postTitle}》下的评论已通过，现已公开展示。",
    "en-US": "Your comment on “{postTitle}” was approved and is now public.",
    "ja-JP": "「{postTitle}」へのコメントが承認され、公開されました。",
  },
  "notification.comment.rejectedTitle": {
    "zh-CN": "你的评论未通过审核",
    "en-US": "Your comment was not approved",
    "ja-JP": "コメントは承認されませんでした",
  },
  "notification.comment.rejectedContent": {
    "zh-CN": "你在《{postTitle}》下的评论未通过审核。原因：{reason}",
    "en-US": "Your comment on “{postTitle}” was not approved. Reason: {reason}",
    "ja-JP": "「{postTitle}」へのコメントは承認されませんでした。理由：{reason}",
  },
  "notification.comment.rejectedDefaultReason": {
    "zh-CN": "未提供具体原因",
    "en-US": "No reason provided",
    "ja-JP": "理由は指定されていません",
  },

  // --- category / tag ---
  "taxonomy.invalidCategoryId": {
    "zh-CN": "无效的分类ID",
    "en-US": "Invalid category ID",
    "ja-JP": "無効なカテゴリ ID です",
  },
  "taxonomy.categoryNotFound": {
    "zh-CN": "分类不存在",
    "en-US": "Category not found",
    "ja-JP": "カテゴリが見つかりません",
  },
  "taxonomy.categoryFetchSuccess": {
    "zh-CN": "分类获取成功",
    "en-US": "Category retrieved",
    "ja-JP": "カテゴリを取得しました",
  },
  "taxonomy.categoryListSuccess": {
    "zh-CN": "分类列表获取成功",
    "en-US": "Category list retrieved",
    "ja-JP": "カテゴリ一覧を取得しました",
  },
  "taxonomy.categoryCreateSuccess": {
    "zh-CN": "分类创建成功",
    "en-US": "Category created",
    "ja-JP": "カテゴリを作成しました",
  },
  "taxonomy.categoryUpdateSuccess": {
    "zh-CN": "分类更新成功",
    "en-US": "Category updated",
    "ja-JP": "カテゴリを更新しました",
  },
  "taxonomy.categoryDeleteSuccess": {
    "zh-CN": "分类删除成功",
    "en-US": "Category deleted",
    "ja-JP": "カテゴリを削除しました",
  },
  "taxonomy.manageForbidden": {
    "zh-CN": "需要作者或管理员权限才能管理分类与标签",
    "en-US": "Author or admin role is required to manage categories and tags",
    "ja-JP": "カテゴリーとタグの管理には著者または管理者権限が必要です",
  },
  "taxonomy.nameSlugRequired": {
    "zh-CN": "分类名称和slug不能为空",
    "en-US": "Category name and slug are required",
    "ja-JP": "カテゴリ名と slug は必須です",
  },
  "taxonomy.nameExists": {
    "zh-CN": "分类名称已存在",
    "en-US": "Category name already exists",
    "ja-JP": "カテゴリ名は既に存在します",
  },
  "taxonomy.slugExists": {
    "zh-CN": "分类slug已存在",
    "en-US": "Category slug already exists",
    "ja-JP": "カテゴリ slug は既に存在します",
  },
  "taxonomy.cannotDeleteHasPosts": {
    "zh-CN": "无法删除分类，该分类下还有文章",
    "en-US": "Cannot delete category: it still has posts",
    "ja-JP": "カテゴリを削除できません：記事が残っています",
  },
  "taxonomy.cannotDeleteHasChildren": {
    "zh-CN": "无法删除分类，该分类下还有子分类",
    "en-US": "Cannot delete category: it has subcategories",
    "ja-JP": "カテゴリを削除できません：子カテゴリが残っています",
  },
  "taxonomy.invalidTagId": {
    "zh-CN": "无效的标签ID",
    "en-US": "Invalid tag ID",
    "ja-JP": "無効なタグ ID です",
  },
  "taxonomy.tagNotFound": {
    "zh-CN": "标签不存在",
    "en-US": "Tag not found",
    "ja-JP": "タグが見つかりません",
  },
  "taxonomy.tagFetchSuccess": {
    "zh-CN": "标签获取成功",
    "en-US": "Tag retrieved",
    "ja-JP": "タグを取得しました",
  },
  "taxonomy.tagListSuccess": {
    "zh-CN": "标签列表获取成功",
    "en-US": "Tag list retrieved",
    "ja-JP": "タグ一覧を取得しました",
  },
  "taxonomy.tagCreateSuccess": {
    "zh-CN": "标签创建成功",
    "en-US": "Tag created",
    "ja-JP": "タグを作成しました",
  },
  "taxonomy.tagUpdateSuccess": {
    "zh-CN": "标签更新成功",
    "en-US": "Tag updated",
    "ja-JP": "タグを更新しました",
  },
  "taxonomy.tagDeleteSuccess": {
    "zh-CN": "标签删除成功",
    "en-US": "Tag deleted",
    "ja-JP": "タグを削除しました",
  },
  "taxonomy.tagNameSlugRequired": {
    "zh-CN": "标签名称和slug不能为空",
    "en-US": "Tag name and slug are required",
    "ja-JP": "タグ名と slug は必須です",
  },
  "taxonomy.tagNameExists": {
    "zh-CN": "标签名称已存在",
    "en-US": "Tag name already exists",
    "ja-JP": "タグ名は既に存在します",
  },
  "taxonomy.tagSlugExists": {
    "zh-CN": "标签slug已存在",
    "en-US": "Tag slug already exists",
    "ja-JP": "タグ slug は既に存在します",
  },

  // --- profile ---
  "profile.fetchSuccess": {
    "zh-CN": "个人资料获取成功",
    "en-US": "Profile retrieved",
    "ja-JP": "プロフィールを取得しました",
  },
  "profile.existsUsePut": {
    "zh-CN": "个人资料已存在，请使用PUT方法更新",
    "en-US": "Profile already exists. Use PUT to update.",
    "ja-JP": "プロフィールは既に存在します。PUT で更新してください。",
  },
  "profile.createSuccess": {
    "zh-CN": "个人资料创建成功",
    "en-US": "Profile created",
    "ja-JP": "プロフィールを作成しました",
  },
  "profile.notFoundCreateFirst": {
    "zh-CN": "个人资料不存在，请先创建",
    "en-US": "Profile not found. Please create one first.",
    "ja-JP": "プロフィールが見つかりません。先に作成してください。",
  },
  "profile.updateSuccess": {
    "zh-CN": "个人资料更新成功",
    "en-US": "Profile updated",
    "ja-JP": "プロフィールを更新しました",
  },
  "profile.statsSuccess": {
    "zh-CN": "统计信息获取成功",
    "en-US": "Statistics retrieved",
    "ja-JP": "統計情報を取得しました",
  },
  "profile.favoritesListSuccess": {
    "zh-CN": "收藏列表获取成功",
    "en-US": "Favorites list retrieved",
    "ja-JP": "お気に入り一覧を取得しました",
  },
  "profile.likesListSuccess": {
    "zh-CN": "点赞列表获取成功",
    "en-US": "Liked posts list retrieved",
    "ja-JP": "いいね一覧を取得しました",
  },
  "profile.unlikeSuccess": {
    "zh-CN": "取消点赞成功",
    "en-US": "Like removed",
    "ja-JP": "いいねを取り消しました",
  },
  "profile.followersListSuccess": {
    "zh-CN": "粉丝列表获取成功",
    "en-US": "Followers list retrieved",
    "ja-JP": "フォロワー一覧を取得しました",
  },
  "profile.followingListSuccess": {
    "zh-CN": "关注列表获取成功",
    "en-US": "Following list retrieved",
    "ja-JP": "フォロー一覧を取得しました",
  },
  "profile.followInvalidId": {
    "zh-CN": "followingId 无效",
    "en-US": "Invalid followingId",
    "ja-JP": "followingId が無効です",
  },
  "profile.followSelf": {
    "zh-CN": "不能关注自己",
    "en-US": "You cannot follow yourself",
    "ja-JP": "自分自身をフォローすることはできません",
  },
  "profile.followTargetNotFound": {
    "zh-CN": "目标用户不存在",
    "en-US": "Target user not found",
    "ja-JP": "対象ユーザーが見つかりません",
  },
  "profile.alreadyFollowing": {
    "zh-CN": "已关注该用户",
    "en-US": "Already following this user",
    "ja-JP": "既にこのユーザーをフォローしています",
  },
  "profile.followSuccess": {
    "zh-CN": "关注成功",
    "en-US": "Followed successfully",
    "ja-JP": "フォローしました",
  },
  "profile.unfollowInvalidId": {
    "zh-CN": "targetUserId 无效",
    "en-US": "Invalid targetUserId",
    "ja-JP": "targetUserId が無効です",
  },
  "profile.notFollowing": {
    "zh-CN": "尚未关注该用户",
    "en-US": "Not following this user",
    "ja-JP": "このユーザーをフォローしていません",
  },
  "profile.unfollowSuccess": {
    "zh-CN": "已取消关注",
    "en-US": "Unfollowed",
    "ja-JP": "フォローを解除しました",
  },
  "profile.postIdRequired": {
    "zh-CN": "文章ID不能为空",
    "en-US": "Post ID is required",
    "ja-JP": "記事 ID は必須です",
  },
  "profile.activitiesListSuccess": {
    "zh-CN": "活动日志获取成功",
    "en-US": "Activity log retrieved",
    "ja-JP": "アクティビティログを取得しました",
  },
  "profile.activityTypeRequired": {
    "zh-CN": "活动类型不能为空",
    "en-US": "Activity type is required",
    "ja-JP": "アクティビティ種別は必須です",
  },
  "profile.activityLogSuccess": {
    "zh-CN": "活动记录成功",
    "en-US": "Activity logged",
    "ja-JP": "アクティビティを記録しました",
  },
  "profile.publicRestricted": {
    "zh-CN": "资料受限",
    "en-US": "Profile access restricted",
    "ja-JP": "プロフィールへのアクセスが制限されています",
  },
  "profile.publicFetchSuccess": {
    "zh-CN": "公开资料获取成功",
    "en-US": "Public profile retrieved",
    "ja-JP": "公開プロフィールを取得しました",
  },

  // --- notification ---
  "notification.listSuccess": {
    "zh-CN": "获取通知列表成功",
    "en-US": "Notifications retrieved",
    "ja-JP": "通知一覧を取得しました",
  },
  "notification.markAllSuccess": {
    "zh-CN": "已全部标记为已读",
    "en-US": "All marked as read",
    "ja-JP": "すべて既読にしました",
  },
  "notification.markNeedIds": {
    "zh-CN": "请提供 notificationIds 或 markAllAsRead=true",
    "en-US": "Provide notificationIds or markAllAsRead=true",
    "ja-JP": "notificationIds または markAllAsRead=true を指定してください",
  },
  "notification.batchMarkSuccess": {
    "zh-CN": "通知批量标记成功",
    "en-US": "Notifications marked as read",
    "ja-JP": "通知を一括で既読にしました",
  },
  "notification.clearReadSuccess": {
    "zh-CN": "已清理全部已读通知",
    "en-US": "All read notifications cleared",
    "ja-JP": "既読通知をすべて削除しました",
  },
  "notification.deleteNeedIds": {
    "zh-CN": "请提供 notificationIds 或 clearRead=true",
    "en-US": "Provide notificationIds or clearRead=true",
    "ja-JP": "notificationIds または clearRead=true を指定してください",
  },
  "notification.deleteSuccess": {
    "zh-CN": "通知删除成功",
    "en-US": "Notification deleted",
    "ja-JP": "通知を削除しました",
  },
  "notification.noOp": {
    "zh-CN": "无可操作的通知",
    "en-US": "No notifications to update",
    "ja-JP": "操作対象の通知がありません",
  },
  "notification.createRequired": {
    "zh-CN": "标题和类型是必填项",
    "en-US": "Title and type are required",
    "ja-JP": "タイトルと種別は必須です",
  },
  "notification.invalidType": {
    "zh-CN": "无效的通知类型",
    "en-US": "Invalid notification type",
    "ja-JP": "無効な通知種別です",
  },
  "notification.createSuccess": {
    "zh-CN": "通知创建成功",
    "en-US": "Notification created",
    "ja-JP": "通知を作成しました",
  },
  "notification.notFound": {
    "zh-CN": "通知不存在",
    "en-US": "Notification not found",
    "ja-JP": "通知が見つかりません",
  },
  "notification.forbidden": {
    "zh-CN": "无权访问该通知",
    "en-US": "You cannot access this notification",
    "ja-JP": "この通知にアクセスする権限がありません",
  },
  "notification.invalidId": {
    "zh-CN": "无效的通知ID",
    "en-US": "Invalid notification ID",
    "ja-JP": "無効な通知 ID です",
  },
  "notification.detailSuccess": {
    "zh-CN": "获取通知详情成功",
    "en-US": "Notification details retrieved",
    "ja-JP": "通知詳細を取得しました",
  },
  "notification.updateNoFields": {
    "zh-CN": "未提供可更新字段",
    "en-US": "No fields to update",
    "ja-JP": "更新するフィールドがありません",
  },
  "notification.updateSuccess": {
    "zh-CN": "通知更新成功",
    "en-US": "Notification updated",
    "ja-JP": "通知を更新しました",
  },
  "notification.legacyListSuccess": {
    "zh-CN": "通知列表获取成功",
    "en-US": "Notifications list retrieved",
    "ja-JP": "通知一覧を取得しました",
  },
  "notification.legacyMarkNeedIds": {
    "zh-CN": "请提供要标记的通知ID或设置markAllAsRead为true",
    "en-US": "Provide notification IDs or set markAllAsRead to true",
    "ja-JP": "通知 ID を指定するか markAllAsRead=true にしてください",
  },
  "notification.legacyMarkSuccess": {
    "zh-CN": "通知标记成功",
    "en-US": "Notifications marked",
    "ja-JP": "通知を更新しました",
  },
  "notification.legacyIdRequired": {
    "zh-CN": "通知ID不能为空",
    "en-US": "Notification ID is required",
    "ja-JP": "通知 ID は必須です",
  },

  // --- subscription ---
  "subscription.unavailable": {
    "zh-CN": "订阅服务暂时不可用，请稍后再试",
    "en-US": "Subscription service temporarily unavailable",
    "ja-JP": "購読サービスは一時的に利用できません",
  },
  "subscription.emailRequired": {
    "zh-CN": "邮箱不能为空",
    "en-US": "Email is required",
    "ja-JP": "メールアドレスは必須です",
  },
  "subscription.statusSuccess": {
    "zh-CN": "订阅状态获取成功",
    "en-US": "Subscription status retrieved",
    "ja-JP": "購読状態を取得しました",
  },
  "subscription.emailInvalid": {
    "zh-CN": "请输入有效的邮箱地址",
    "en-US": "Please enter a valid email address",
    "ja-JP": "有効なメールアドレスを入力してください",
  },
  "subscription.emailMismatch": {
    "zh-CN": "仅可为当前登录账号的邮箱办理订阅",
    "en-US": "You can only subscribe with your account email",
    "ja-JP": "ログイン中のアカウントのメールのみ購読できます",
  },
  "subscription.codeRequired": {
    "zh-CN": "请先获取邮箱验证码，验证通过后方可订阅",
    "en-US": "Verify your email with a code before subscribing",
    "ja-JP": "購読前にメール認証コードで確認してください",
  },
  "subscription.alreadySubscribed": {
    "zh-CN": "该邮箱已订阅，无需重复订阅",
    "en-US": "This email is already subscribed",
    "ja-JP": "このメールアドレスは既に購読中です",
  },
  "subscription.success": {
    "zh-CN": "订阅成功",
    "en-US": "Subscribed successfully",
    "ja-JP": "購読に成功しました",
  },
  "subscription.unsubscribeEmailMismatch": {
    "zh-CN": "仅可为当前登录账号的邮箱办理退订",
    "en-US": "You can only unsubscribe your account email",
    "ja-JP": "ログイン中のアカウントのメールのみ退会できます",
  },
  "subscription.unsubscribeCodeRequired": {
    "zh-CN": "请先获取邮箱验证码，验证通过后方可取消订阅",
    "en-US": "Verify your email with a code before unsubscribing",
    "ja-JP": "退会前にメール認証コードで確認してください",
  },
  "subscription.notSubscribed": {
    "zh-CN": "该邮箱当前未订阅",
    "en-US": "This email is not subscribed",
    "ja-JP": "このメールアドレスは未購読です",
  },
  "subscription.unsubscribeSuccess": {
    "zh-CN": "取消订阅成功",
    "en-US": "Unsubscribed successfully",
    "ja-JP": "購読を解除しました",
  },

  // --- upload ---
  "upload.storageNotConfigured": {
    "zh-CN": "对象存储未配置，请联系管理员配置 MINIO_* 环境变量",
    "en-US": "Object storage not configured. Contact admin to set MINIO_* variables.",
    "ja-JP": "オブジェクトストレージが未設定です。管理者に MINIO_* 環境変数の設定を依頼してください。",
  },
  "upload.multipartRequired": {
    "zh-CN": "请使用 multipart 上传字段 file",
    "en-US": "Use multipart field 'file' for upload",
    "ja-JP": "multipart の file フィールドでアップロードしてください",
  },
  "upload.invalidScope": {
    "zh-CN": "scope 仅支持 article 或 profile",
    "en-US": "scope must be 'article' or 'profile'",
    "ja-JP": "scope は article または profile のみ対応しています",
  },
  "upload.fileEmpty": {
    "zh-CN": "文件为空",
    "en-US": "File is empty",
    "ja-JP": "ファイルが空です",
  },
  "upload.fileTooLarge": {
    "zh-CN": "图片大小不能超过 10MB",
    "en-US": "Image size cannot exceed 10MB",
    "ja-JP": "画像サイズは 10MB 以下にしてください",
  },
  "upload.invalidType": {
    "zh-CN": "仅支持 JPEG、PNG、GIF、WebP 图片",
    "en-US": "Only JPEG, PNG, GIF, and WebP images are supported",
    "ja-JP": "JPEG、PNG、GIF、WebP 画像のみ対応しています",
  },
  "upload.publicUrlMissing": {
    "zh-CN": "MINIO_PUBLIC_BASE_URL 未配置，无法生成访问地址",
    "en-US": "MINIO_PUBLIC_BASE_URL not configured; cannot generate public URL",
    "ja-JP": "MINIO_PUBLIC_BASE_URL が未設定のため公開 URL を生成できません",
  },
  "upload.storageUnavailable": {
    "zh-CN": "对象存储未配置",
    "en-US": "Object storage not configured",
    "ja-JP": "オブジェクトストレージが未設定です",
  },
  "upload.keyRequired": {
    "zh-CN": "缺少参数 key",
    "en-US": "Missing parameter: key",
    "ja-JP": "パラメータ key がありません",
  },
  "upload.forbiddenDelete": {
    "zh-CN": "无权删除该资源",
    "en-US": "You cannot delete this resource",
    "ja-JP": "このリソースを削除する権限がありません",
  },
  "upload.failed": {
    "zh-CN": "上传失败",
    "en-US": "Upload failed",
    "ja-JP": "アップロードに失敗しました",
  },
  "upload.deleteFailed": {
    "zh-CN": "删除失败",
    "en-US": "Delete failed",
    "ja-JP": "削除に失敗しました",
  },

  // --- admin ---
  "admin.usersListFailed": {
    "zh-CN": "获取用户列表失败",
    "en-US": "Failed to fetch user list",
    "ja-JP": "ユーザー一覧の取得に失敗しました",
  },
  "admin.invalidRole": {
    "zh-CN": "无效的角色",
    "en-US": "Invalid role",
    "ja-JP": "無効なロールです",
  },
  "admin.invalidStatus": {
    "zh-CN": "无效的状态",
    "en-US": "Invalid status",
    "ja-JP": "無効なステータスです",
  },
  "admin.roleStatusRequired": {
    "zh-CN": "请至少提供 role 或 status",
    "en-US": "Provide at least role or status",
    "ja-JP": "role または status のいずれかを指定してください",
  },
  "admin.cannotModifyRoot": {
    "zh-CN": "不可修改根账户（超级管理员本人）的角色与状态",
    "en-US": "Cannot modify the root super administrator account",
    "ja-JP": "ルートスーパー管理者アカウントは変更できません",
  },
  "admin.updated": {
    "zh-CN": "已更新",
    "en-US": "Updated",
    "ja-JP": "更新しました",
  },
  "admin.invalidCommentId": {
    "zh-CN": "无效的评论 ID",
    "en-US": "Invalid comment ID",
    "ja-JP": "無効なコメント ID です",
  },
  "admin.invalidCommentStatus": {
    "zh-CN": "status 必须为 pending/approved/spam",
    "en-US": "status must be pending, approved, or spam",
    "ja-JP": "status は pending / approved / spam である必要があります",
  },
  "admin.commentNotFound": {
    "zh-CN": "评论不存在",
    "en-US": "Comment not found",
    "ja-JP": "コメントが見つかりません",
  },
  "admin.commentsListSuccess": {
    "zh-CN": "获取评论审核列表成功",
    "en-US": "Comment moderation list retrieved",
    "ja-JP": "コメント審査一覧を取得しました",
  },
  "admin.idsRequired": {
    "zh-CN": "ids 不能为空",
    "en-US": "ids cannot be empty",
    "ja-JP": "ids は空にできません",
  },
  "admin.batchCommentUpdateSuccess": {
    "zh-CN": "批量更新评论状态成功",
    "en-US": "Comments updated in batch",
    "ja-JP": "コメントを一括更新しました",
  },
  "admin.batchCommentDeleteSuccess": {
    "zh-CN": "批量删除评论成功",
    "en-US": "Comments deleted in batch",
    "ja-JP": "コメントを一括削除しました",
  },
  "admin.commentUpdateSuccess": {
    "zh-CN": "评论状态更新成功",
    "en-US": "Comment status updated",
    "ja-JP": "コメントステータスを更新しました",
  },
  "admin.commentDeleteSuccess": {
    "zh-CN": "评论删除成功",
    "en-US": "Comment deleted",
    "ja-JP": "コメントを削除しました",
  },

  // --- music ---
  "music.playlistFetchFailed": {
    "zh-CN": "网易云歌单拉取失败",
    "en-US": "Failed to fetch NetEase playlist",
    "ja-JP": "NetEase プレイリストの取得に失敗しました",
  },
  "music.playlistEmpty": {
    "zh-CN": "歌单为空",
    "en-US": "Playlist is empty",
    "ja-JP": "プレイリストが空です",
  },
  "music.noFreeTracks": {
    "zh-CN": "未找到可免费播放曲目",
    "en-US": "No freely playable tracks found",
    "ja-JP": "無料で再生できる曲が見つかりません",
  },
  "music.trackUrlFailed": {
    "zh-CN": "网易云歌曲地址拉取失败",
    "en-US": "Failed to fetch NetEase track URL",
    "ja-JP": "NetEase 曲 URL の取得に失敗しました",
  },
  "music.tracksSuccess": {
    "zh-CN": "网易云可播放曲目获取成功",
    "en-US": "NetEase playable tracks retrieved",
    "ja-JP": "NetEase 再生可能曲を取得しました",
  },

  // --- ops ---
  "ops.envCheckFailed": {
    "zh-CN": "环境配置检查失败",
    "en-US": "Environment check failed",
    "ja-JP": "環境設定の確認に失敗しました",
  },
  "ops.dbTestSuccess": {
    "zh-CN": "数据库连接测试成功",
    "en-US": "Database connection test succeeded",
    "ja-JP": "データベース接続テストに成功しました",
  },
  "ops.dbTestFailed": {
    "zh-CN": "数据库连接测试执行失败",
    "en-US": "Database connection test failed",
    "ja-JP": "データベース接続テストに失敗しました",
  },
  "ops.seedSuccess": {
    "zh-CN": "数据库种子数据初始化完成",
    "en-US": "Database seed completed",
    "ja-JP": "データベースシードが完了しました",
  },
  "ops.seedFailed": {
    "zh-CN": "种子数据初始化失败",
    "en-US": "Database seed failed",
    "ja-JP": "データベースシードに失敗しました",
  },
} as const satisfies Record<string, I18nEntry>;

export type ApiMessageKey = keyof typeof API_MESSAGES;

/** 按 locale 解析 API 消息；未知键回退为键名本身 */
export function tApi(locale: Locale, key: ApiMessageKey, params?: MessageParams): string {
  const entry = API_MESSAGES[key];
  if (!entry) return String(key);
  const template = entry[locale] ?? entry[DEFAULT_LOCALE as Locale] ?? String(key);
  return interpolate(template, params);
}

/** 历史硬编码中文 -> catalog 键，供 pwdPart / decrypt 等过渡期回退 */
const LEGACY_ZH_TO_KEY: Record<string, ApiMessageKey> = {
  "此接口不接受明文密码，请升级客户端": "post.plainPasswordRejected",
  缺少密钥或密码字段: "post.secretFieldMissing",
  "服务端密码传输配置缺失，请联系管理员": "post.passwordTransportMisconfigured",
  "服务端未配置密码传输密钥，无法接受加密包": "post.passwordTransportNotConfigured",
  必须使用加密方式提交访问密码: "post.passwordTransportRequired",
  必须使用加密方式提交密码字段: "auth.passwordFieldTransportRequired",
};

/** 若 message 已是 catalog 键则翻译，否则按 LEGACY 映射或原样返回 */
export function tApiOrRaw(locale: Locale, message: string, params?: MessageParams): string {
  if (message in API_MESSAGES) {
    return tApi(locale, message as ApiMessageKey, params);
  }
  const mapped = LEGACY_ZH_TO_KEY[message];
  if (mapped) {
    return tApi(locale, mapped, params);
  }
  return interpolate(message, params);
}
