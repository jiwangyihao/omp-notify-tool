# v0.2.1

`omp-notify-tool` v0.2.1 修复 OMP TUI 中看不到通知的问题。

## 安装 / 升级

```bash
omp plugin install omp-notify-tool@0.2.1 --force
```

当前 OMP CLI（已验证 `omp/14.9.3`）不接受 `npm:` 前缀；请使用裸包名版本化命令。

安装后可运行：

```bash
omp plugin doctor
```

如果 OMP 已在运行，升级后重启会话再验证。

## 修复内容

- 将 runtime 调用从 `ctx.ui.notify(message, variant)` 修正为 OMP 实际使用的 `ctx.ui.notify({ type, message })`。
- 不再把 `ctx.hasUI === true` 作为唯一启用条件；只要执行上下文提供 `ctx.ui.notify` 能力，就尝试发送非阻塞通知。
- 保持 `variant` 支持范围为 `info`、`warning`、`error`。
- 保持 fail-open：`ctx.ui.notify` 缺失、抛错或 rejected 时不阻塞主 Agent 工作。

## 验证

- 自动化测试覆盖真实 notify payload 形状：`{ type, message }`。
- 自动化测试覆盖 `hasUI: false` 但 `ctx.ui.notify` 存在时仍尝试发送通知。
