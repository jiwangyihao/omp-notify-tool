# opencode-notify-tool

`opencode-notify-tool` 为 OpenCode 提供独立的 `notify` tool，让模型可以用非阻塞 toast 汇报进度、阶段切换和后台状态，而不把纯进度升级成需要用户回复的提问。

## 安装

```bash
opencode plugin opencode-notify-tool@0.1.0 --force -g
```

## 工具参数

```json
{
  "message": "Running verification",
  "variant": "info"
}
```

- `message`：必填，非空字符串。
- `variant`：可选，只能是 `info`、`success`、`warning`、`error`。

## 与 `question` 的边界

`notify` 只用于非阻塞进度。需要用户响应、确认、授权、最终交接或无安全工作可继续时，应使用 `question`。

## 与 `opencode-wait` 配合

等待交给 `opencode-wait`，进度交给 `opencode-notify-tool`。

## 与未来 `opencode-loop-safety` 配合

Loop Safety 可以通过外部 `notify`、`wait`、`question` 工具获得完整通道。本包只负责非阻塞通知。

## English

`opencode-notify-tool` gives OpenCode a dedicated `notify` tool so models can send non-blocking toast updates for progress, phase changes, and background status without turning pure progress into a question that needs a reply.

## Installation

```bash
opencode plugin opencode-notify-tool@0.1.0 --force -g
```

## Tool Arguments

```json
{
  "message": "Running verification",
  "variant": "info"
}
```

- `message`: required, a non-empty string.
- `variant`: optional, must be one of `info`, `success`, `warning`, or `error`.

## Boundary with `question`

`notify` is only for non-blocking progress. When you need a user response, confirmation, authorization, a final handoff, or no safe work remains, use `question`.

## Working with `opencode-wait`

Use `opencode-wait` for waiting. Use `opencode-notify-tool` for progress.

## Working with future `opencode-loop-safety`

Loop Safety can get a complete channel through external `notify`, `wait`, and `question` tools. This package only handles non-blocking notifications.
