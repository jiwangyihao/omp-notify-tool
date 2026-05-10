# omp-notify-tool

`omp-notify-tool` 为 OMP 和 Pi-family runtime 提供模型可调用的非阻塞 `notify` 工具。

`notify` 用于进度、阶段切换和后台状态提示，不要求用户立即响应。它保留 OpenCode 版的参数语义，同时通过 OMP/Pi extension 入口注册到宿主运行时。

## 安装

```bash
omp plugin install npm:omp-notify-tool@0.1.0
```

安装后检查插件状态：

```bash
omp plugin doctor
```

### 本地开发

```bash
omp plugin link <path-to-this-repo>
```

## 工具参数

模型调用 `notify` 时只应传入 `message` 和可选 `variant`：

```json
{
  "message": "Running verification",
  "variant": "info"
}
```

- `message`：必填，非空字符串。
- `variant`：可选，只能是 `info`、`success`、`warning`、`error`；缺省为 `info`。

## 使用边界

`notify` 只用于进度、阶段切换和后台状态。需要用户响应、确认、授权、最终交接或无安全工作可继续时，不要使用 `notify`。

需要等待时使用宿主提供的 `wait` 或等价机制；需要提问或确认时使用 `question` 或宿主对应的交互工具。

如果你需要 Agent 完成后提醒人回来，请使用 `pi-notify` 或 `pi-poly-notify`。本包不是完成提醒插件，也不提供桌面完成通知、声音、Webhook、邮件或移动推送。

## 运行时模式

- **OMP interactive**：当当前会话有 UI 且 `ctx.ui.notify` 可用时，通知会作为非阻塞 UI 提示展示。
- **OMP RPC**：当宿主提供 RPC UI notify 通道时，通知按 fire-and-forget 方式发送，不要求模型等待用户响应。
- **headless/subagent**：无 UI、后台或子代理场景可能返回 skipped；工具会 fail open，不中断主任务。
- **Pi-family runtime**：同一个 npm 包通过 legacy `pi.extensions` 入口加载。目标 Pi runtime 仍需提供兼容的 extension API 和 `ctx.ui.notify` 能力；未验证的安装命令或运行时行为不在本文中写成事实。

## `success` variant

公开参数保留 `success`，便于兼容已有 OpenCode 语义。OMP/Pi UI 的通知类型只接收 `info`、`warning`、`error`，因此 `success` 在 OMP/Pi UI 中降级为 `info`。

工具结果仍会保留原始意图和实际通知类型：`details.variant = "success"`，`details.notifyType = "info"`。

## License

`MPL-2.0`，详见 [LICENSE](./LICENSE)。
