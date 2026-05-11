# v0.2.3

`omp-notify-tool` v0.2.3 调整 fail-open 结果语义，避免 ACP、headless 或无 UI 环境下 Agent 把非阻塞通知降级误读为工具失败。

## 安装 / 升级

```bash
omp plugin install omp-notify-tool@0.2.3
```

当前 OMP CLI（已验证 `omp/14.9.3`）不接受 `npm:` 前缀；请使用裸包名版本化命令。

安装后可运行：

```bash
omp plugin doctor
```

如果 OMP 已在运行，升级后重启会话再验证。

## 修复内容

- 工具可见文本现在始终返回 `content[0].text === "ok"`。
- 成功投递时继续返回 `details.delivered = true`。
- 无 UI、aborted、`ctx.ui.notify` 抛错或 rejected 时仍保持 fail-open，并通过 `details.delivered = false` 与 `details.reason` 表达真实状态。
- `details.reason` 继续使用：`ui_unavailable`、`notify_failed`、`aborted`。
- `ctx.ui.notify` 失败时继续记录 logger warning，但不把诊断文案暴露给模型作为工具结果文本。
- 运行时调用仍使用 OMP 官方签名：`ctx.ui.notify(message, type)`。
- `variant` 支持范围为 `info`、`warning`、`error`。

## 验证

- 自动化测试覆盖成功、无 UI、aborted、同步抛错、异步 rejected、不可 stringify 抛出值等路径。
- 自动化测试确认失败/跳过路径对模型可见文本仍为 `ok`，诊断状态仅保留在 `details`。
