# 对外入口（`blog-edge`）Secret 模板

将本目录**复制**为同级的 `../edge/`（即 `deploy/secrets/edge/`），再编辑各文件为**单行**真实值。

```bash
cp -r deploy/secrets/edge.example deploy/secrets/edge
chmod -R go-rwx deploy/secrets/edge
```

| 文件名                          | 说明                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `domains`                       | 证书主域与 SAN，**英文逗号**分隔，第一个为主域（与 Let’s Encrypt 目录名一致）                            |
| `certbot_email`                 | Let’s Encrypt 账户邮箱                                                                                   |
| `app_upstream`                  | 反代上游，默认 `http://blog-next-app:3000`（与 `docker-compose` 中 `blog-web` 的 `container_name` 一致） |
| `check_interval_seconds`        | cert-manager 检查间隔（秒）                                                                              |
| `renew_strategy`                | `official_30d` 或 `custom_seconds`                                                                       |
| `official_renew_window_seconds` | 官方策略窗口（秒），默认 2592000（30 天）                                                                |
| `renew_before_seconds`          | 仅 `custom_seconds` 时使用                                                                               |
| `tls_mode`                      | `auto`：有证则启用 HTTPS；`http_only`：强制仅 HTTP（证书失败或应急回退，见部署文档 §7.8）                |

**勿将 `deploy/secrets/edge/` 提交到 Git**（已在仓库 `.gitignore`）。
