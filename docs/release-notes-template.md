`opencode-notify-tool` 让 OpenCode 模型可以用非阻塞 toast 汇报进度，而不把纯进度升级成需要用户回复的提问。

## 适合谁升级

- 需要让模型发送非阻塞进度提示的 OpenCode 用户。
- 正在组合 `opencode-wait` 与 Guided Loop Safety 工作流的用户。

## 你会看到的变化

- 新增独立 `notify` tool，用于进度、阶段切换和后台状态提示。
- `notify` 只暴露 `message` 与可选 `variant`，不承担确认、授权或最终交接。
- 缺失或失败的 toast 会 fail open，不会中断主工作流。

## 升级方式

```bash
opencode plugin opencode-notify-tool@0.1.0 --force -g
```
