# v0.2.0

`omp-notify-tool` v0.2.0 收敛为 OMP/Pi 原生通知语义，不再保留 OpenCode `success` variant 兼容层。

## 安装 / 升级

```bash
omp plugin install omp-notify-tool@0.2.0
```

当前 OMP CLI（已验证 `omp/14.9.2`）不接受 `npm:` 前缀；请使用裸包名版本化命令。

安装后可运行：

```bash
omp plugin doctor
```

如果 OMP 已在运行，升级后重启会话再验证。

## 你会看到的变化

- `variant` 只支持 OMP/Pi UI notify 类型：`info`、`warning`、`error`。
- 移除 `success -> info` 降级逻辑，避免向 OMP/Pi Agent 暴露 OpenCode 专属语义。
- OMP/Pi 双入口保持不变：`omp.extensions` 与 legacy `pi.extensions` 都指向 `./src/extension.ts`。
- README、runtime compatibility、规格文档和测试均同步为 OMP/Pi 原生契约。
- 继续保持非阻塞、fail-open：无 UI、headless/subagent 或 UI 通知失败不会中断主 Agent 工作。

## 边界说明

如果你需要 Agent 完成后提醒人回来，请使用 `pi-notify` 或 `pi-poly-notify`。本包不是完成提醒插件，不提供桌面完成通知、声音、Webhook、邮件或移动推送。

`notify` 也不替代 `question`、`wait`、权限确认、人工审批或最终交接。

## Runtime 注意事项

- OMP interactive 或支持 RPC UI notify 的运行时可展示非阻塞通知。
- headless/subagent、无 UI 或 `ctx.ui.notify` 缺失时，工具会返回 skipped，不会把未展示伪装成 delivered。
- `details.notifyType` 与最终使用的 `variant` 一致。
