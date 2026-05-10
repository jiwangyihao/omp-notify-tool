# Runtime compatibility

本文档只记录 `omp-notify-tool` 的能力门槛和已知限制，不声明未验证 runtime 一定支持。

## 能力门槛

`omp-notify-tool` 需要宿主在 extension 执行阶段提供以下能力：

- 能加载 npm package manifest 中的 extension entry。
- 能调用 extension factory，并提供 `registerTool` 注册模型可调用工具。
- 工具执行上下文能表达当前 UI 状态，例如 `ctx.hasUI`。
- UI 可用时提供 `ctx.ui.notify({ type, message })`，其中 `type` 为 `info`、`warning` 或 `error`。

本包不依赖 active-tools、provider request hook、message renderer、custom UI、外部通知服务或运行时 core package 作为 runtime dependency。

## 已记录的运行模式

| Runtime 模式 | 能力门槛 | 预期行为 |
| --- | --- | --- |
| OMP interactive | extension entry、`registerTool`、`ctx.ui.notify` | 展示非阻塞通知；工具结果表达 delivered |
| OMP RPC | 宿主支持 fire-and-forget `notify` UI request | 通过 RPC UI notify 通道发送；不要求用户响应 |
| headless/subagent | `ctx.ui.notify` 不可用 | 不调用 UI，返回 skipped，不中断主任务 |
| Pi-family | manifest 支持 legacy `pi.extensions`，并提供兼容 extension API | 能力满足时行为同 OMP；未满足时返回 skipped 或 failed |

## 已知限制

- `variant` 只支持 OMP/Pi UI notify 类型：`info`、`warning`、`error`。
- `details.notifyType` 与最终使用的 `variant` 一致；本包不做跨宿主语义转换。
- 无 UI、headless、subagent 或 `ctx.ui.notify` 缺失时，工具会返回 skipped，而不是把未展示的通知伪装成 delivered。
- `ctx.ui.notify` 抛错或返回 rejected promise 时，工具会返回 failed/continuing，并保持 fail-open。
- 本文档不声明未验证 runtime 一定支持；Pi-family 的具体 CLI 安装命令和各 runtime 的实际 RPC 展示行为应在对应版本验证后再记录。
