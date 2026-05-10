# v0.2.2

`omp-notify-tool` v0.2.2 修正 v0.2.1 对 OMP UI notify 签名的误判，恢复为 OMP 官方签名。

## 安装 / 升级

```bash
omp plugin install omp-notify-tool@0.2.2 --force
```

当前 OMP CLI（已验证 `omp/14.9.3`）不接受 `npm:` 前缀；请使用裸包名版本化命令。

安装后可运行：

```bash
omp plugin doctor
```

如果 OMP 已在运行，升级后重启会话再验证。

## 修复内容

- 依据 OMP 14.9.3 `ExtensionUIContext` 源码，使用官方签名：`ctx.ui.notify(message, type)`。
- 撤销 v0.2.1 的对象 payload 调用：`ctx.ui.notify({ type, message })`。
- 保留 v0.2.1 中正确的能力探测修复：不把 `ctx.hasUI === true` 作为唯一启用条件；只要执行上下文提供 `ctx.ui.notify`，就尝试发送非阻塞通知。
- 保持 `variant` 支持范围为 `info`、`warning`、`error`。
- 保持 fail-open：`ctx.ui.notify` 缺失、抛错或 rejected 时不阻塞主 Agent 工作。

## 验证

- 自动化测试覆盖官方 notify 调用签名：`notify(message, type)`。
- 自动化测试覆盖 `hasUI: false` 但 `ctx.ui.notify` 存在时仍尝试发送通知。
