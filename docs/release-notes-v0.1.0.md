# v0.1.0

`omp-notify-tool` v0.1.0 是 OMP/Pi 版本首发，提供模型可调用的非阻塞 `notify` 工具，用于进度、阶段切换和后台状态提示。

## 安装

```bash
omp plugin install npm:omp-notify-tool@0.1.0
```

安装后可运行：

```bash
omp plugin doctor
```

## 首发内容

- 新增 `notify` 工具，参数为必填 `message` 和可选 `variant`。
- 同一个 npm 包提供 OMP/Pi 双入口：`omp.extensions` 与 legacy `pi.extensions` 都指向 `./src/extension.ts`。
- 保留 OpenCode 版语义：`variant` 支持 `info`、`success`、`warning`、`error`，缺省为 `info`。
- 通知失败保持 fail-open，不阻塞主 Agent 工作。

## 边界说明

如果你需要 Agent 完成后提醒人回来，请使用 `pi-notify` 或 `pi-poly-notify`。本包不是完成提醒插件，不提供桌面完成通知、声音、Webhook、邮件或移动推送。

`notify` 也不替代 `question`、`wait`、权限确认、人工审批或最终交接。

## Runtime 注意事项

- OMP interactive 或支持 RPC UI notify 的运行时可展示非阻塞通知。
- headless/subagent、无 UI 或 `ctx.ui.notify` 缺失时，工具会返回 skipped，不会把未展示伪装成 delivered。
- `success` 在 OMP/Pi UI 中降级为 `info`；tool result 会保留 `details.variant = "success"` 和 `details.notifyType = "info"`。
