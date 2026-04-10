# 邮箱验证码注册功能使用指南

## 功能概述

本系统现在支持两种注册方式：

1. **传统密码注册** - 使用用户名、邮箱、密码进行注册
2. **邮箱验证码注册** - 使用邮箱验证码进行注册（推荐）

## 技术实现

### 1. 数据库表结构

新增了 `email_verifications` 表用于存储邮箱验证码：

```sql
CREATE TABLE email_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type ENUM('register', 'reset_password', 'change_email') NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### 2. API 端点

#### 发送验证码

- **端点**: `POST /api/auth/send-verification-code`
- **参数**: `{ email: string, type: string }`
- **功能**: 发送6位数字验证码到指定邮箱

#### 验证验证码

- **端点**: `POST /api/auth/verify-code`
- **参数**: `{ email: string, code: string, type: string }`
- **功能**: 验证邮箱验证码是否有效

#### 注册（支持验证码）

- **端点**: `POST /api/auth/register`
- **参数**: `{ username, email, password, displayName, useEmailVerification, verificationCode }`
- **功能**: 支持传统注册和邮箱验证码注册

### 3. 邮件服务

使用 `nodemailer` 发送邮件，支持多种邮件服务商：

- Gmail
- Outlook
- 自定义 SMTP 服务器

## 配置说明

### 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
```

### Gmail 配置示例

1. 启用两步验证
2. 生成应用专用密码
3. 使用应用专用密码作为 `SMTP_PASS`

### 其他邮件服务商配置

#### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### QQ邮箱

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
```

## 使用流程

### 用户注册流程

1. **选择注册方式**
   - 用户可以选择传统密码注册或邮箱验证码注册
   - 推荐使用邮箱验证码注册，更安全

2. **邮箱验证码注册流程**

   ```
   用户填写基本信息 → 选择邮箱验证 → 输入邮箱 → 点击发送验证码 →
   输入验证码 → 提交注册 → 注册成功
   ```

3. **传统密码注册流程**
   ```
   用户填写基本信息 → 输入密码 → 提交注册 → 注册成功
   ```

### 验证码规则

- **长度**: 6位数字
- **有效期**: 10分钟
- **发送频率**: 1分钟内只能发送一次
- **使用次数**: 每个验证码只能使用一次

## 测试功能

### 邮箱配置测试

```bash
# 测试邮箱配置是否正确
pnpm test:email
```

### API 测试

```bash
# 测试发送验证码
curl -X POST http://localhost:3000/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"register"}'

# 测试验证码验证
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","type":"register"}'
```

## 安全特性

### 1. 验证码安全

- 验证码随机生成，不可预测
- 设置有效期，防止重放攻击
- 限制发送频率，防止滥用
- 一次性使用，防止重复使用

### 2. 邮箱验证

- 验证邮箱格式
- 检查邮箱是否已被注册
- 验证码与邮箱绑定

### 3. 数据库安全

- 验证码加密存储
- 自动清理过期验证码
- 防止SQL注入

## 邮件模板

系统提供三种邮件模板：

1. **注册验证码** - 蓝色主题，欢迎用户注册
2. **密码重置** - 红色主题，提醒用户安全
3. **邮箱变更** - 绿色主题，确认邮箱变更

## 故障排除

### 常见问题

1. **邮件发送失败**
   - 检查 SMTP 配置
   - 确认邮箱密码正确
   - 检查网络连接

2. **验证码收不到**
   - 检查垃圾邮件文件夹
   - 确认邮箱地址正确
   - 检查邮件服务商限制

3. **验证码无效**
   - 检查验证码是否过期
   - 确认验证码输入正确
   - 检查是否已使用过

### 调试方法

1. **查看日志**

   ```bash
   # 查看应用日志
   tail -f logs/app.log
   ```

2. **测试邮箱配置**

   ```bash
   # 运行邮箱测试
   pnpm test:email
   ```

3. **检查数据库**
   ```bash
   # 查看验证码记录
   pnpm db:studio
   ```

## 部署注意事项

### 生产环境配置

1. **使用专业的邮件服务**
   - SendGrid
   - Mailgun
   - Amazon SES

2. **配置环境变量**
   - 确保生产环境变量正确
   - 使用强密码
   - 定期轮换密钥

3. **监控和日志**
   - 监控邮件发送成功率
   - 记录验证码使用情况
   - 设置异常告警

## 扩展功能

### 未来可扩展的功能

1. **短信验证码** - 支持手机短信验证
2. **图形验证码** - 防止机器人注册
3. **社交登录** - 支持第三方登录
4. **多语言邮件** - 支持多语言邮件模板

## 总结

邮箱验证码注册功能提供了更安全、更便捷的用户注册体验。通过合理的配置和测试，可以确保功能的稳定性和安全性。

如有问题，请参考本文档的故障排除部分，或联系开发团队。
