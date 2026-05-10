# omp-notify-tool

[![npm version](https://img.shields.io/npm/v/omp-notify-tool.svg)](https://www.npmjs.com/package/omp-notify-tool)
[![npm downloads](https://img.shields.io/npm/dw/omp-notify-tool.svg)](https://www.npmjs.com/package/omp-notify-tool)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-brightgreen.svg)](LICENSE)

> **Latest in v0.2.0 | v0.2.0 原生 OMP/Pi 语义**
>
> - Uses OMP/Pi-native `variant` values only: `info`, `warning`, `error` | 仅使用 OMP/Pi 原生 `variant`：`info`、`warning`、`error`
> - Declares both `omp.extensions` and legacy `pi.extensions` entries | 同时声明 `omp.extensions` 与 legacy `pi.extensions` 入口
> - Keeps progress updates separate from `question`, `wait`, and completion notifications | 将进度提示与 `question`、`wait` 和完成提醒分离
> - Falls open when UI notification is unavailable or fails | UI 通知不可用或失败时保持 fail-open

[中文](#中文) | [English](#english)

---

<a name="中文"></a>

## 中文

`omp-notify-tool` 为 OMP 和 Pi-family runtime 提供模型可调用的非阻塞 `notify` 工具。

`notify` 用于进度、阶段切换和后台状态提示，不要求用户立即响应。参数语义直接贴合 OMP/Pi UI 通知能力，并通过 OMP/Pi extension 入口注册到宿主运行时。

## 功能一览

- **非阻塞进度提示** — 模型可以调用 `notify({ message, variant })` 汇报进度，不把纯进度升级成提问。
- **OMP/Pi 双入口** — npm 包同时声明 `omp.extensions` 与 legacy `pi.extensions`，入口均为 `./src/extension.ts`。
- **明确交互边界** — 需要用户响应、确认、授权、最终交接或无安全工作可继续时，不要使用 `notify`。
- **完成提醒边界** — 如果需要 Agent 完成后提醒人回来，请使用 `pi-notify` 或 `pi-poly-notify`。本包不是完成提醒插件。
- **Fail-open** — headless/subagent、无 UI、`ctx.ui.notify` 缺失或通知失败时，工具返回 skipped/failed，不中断主任务。

---

## 安装

<details open>
<summary><b>面向人类用户</b></summary>

**选项 A：让 LLM 帮你安装**

把下面这段话丢给 OMP / Claude Code / Cursor 等任意 LLM Agent：

```text
请先查看 omp-notify-tool 最新 GitHub Release 正文里的安装或升级说明，然后严格执行其中带明确版本号的 OMP 安装命令。不要使用裸包名或 latest。安装后运行 `omp plugin doctor` 确认插件可用。如果 OMP 已经运行，安装或升级后重启会话再验证。参考说明：https://github.com/jiwangyihao/omp-notify-tool/releases/latest
```

**选项 B：手动安装**

当前版本：

```bash
omp plugin install npm:omp-notify-tool@0.2.0
```

安装后检查插件状态：

```bash
omp plugin doctor
```

如果 OMP 已在运行，安装或升级后重启会话再验证。

</details>

<details>
<summary><b>面向 LLM 智能体</b></summary>

### 步骤指引

1. 读取本仓库最新 GitHub Release 正文：

   `https://github.com/jiwangyihao/omp-notify-tool/releases/latest`

2. 提取其中带明确版本号的安装命令。当前版本示例：

   ```bash
   omp plugin install npm:omp-notify-tool@0.2.0
   ```

3. 直接执行该命令。不要使用裸包名或 `latest`，不要手动编辑 OMP/Pi 配置。

4. 安装后运行：

   ```bash
   omp plugin doctor
   ```

5. 如果 OMP 已经运行，重启后再进行功能验证。

### 验证

让 Agent 调用 `notify`，例如：

```json
{
  "message": "Running verification",
  "variant": "info"
}
```

在 interactive/RPC UI 可用时，应看到非阻塞通知；在 headless/subagent 或无 UI 场景中，工具可能返回 skipped，但不会中断主任务。

</details>

---

## 本地开发

```bash
omp plugin link <path-to-this-repo>
bun test
npm pack --dry-run --json
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
- `variant`：可选，只能是 `info`、`warning`、`error`；缺省为 `info`。

## 使用边界

`notify` 只用于进度、阶段切换和后台状态。需要用户响应、确认、授权、最终交接或无安全工作可继续时，不要使用 `notify`。

需要等待时使用宿主提供的 `wait` 或等价机制；需要提问或确认时使用 `question` 或宿主对应的交互工具。

如果你需要 Agent 完成后提醒人回来，请使用 `pi-notify` 或 `pi-poly-notify`。本包不是完成提醒插件，也不提供桌面完成通知、声音、Webhook、邮件或移动推送。

## 运行时模式

- **OMP interactive**：当当前会话有 UI 且 `ctx.ui.notify` 可用时，通知会作为非阻塞 UI 提示展示。
- **OMP RPC**：当宿主提供 RPC UI notify 通道时，通知按 fire-and-forget 方式发送，不要求模型等待用户响应。
- **headless/subagent**：无 UI、后台或子代理场景可能返回 skipped；工具会 fail open，不中断主任务。
- **Pi-family runtime**：同一个 npm 包通过 legacy `pi.extensions` 入口加载。目标 Pi runtime 仍需提供兼容的 extension API 和 `ctx.ui.notify` 能力；未验证的安装命令或运行时行为不在本文中写成事实。


## 相关版本

- 使用 **OpenCode**？请安装 [`opencode-notify-tool`](https://github.com/jiwangyihao/opencode-notify-tool)：

  ```bash
  opencode plugin opencode-notify-tool@0.1.0 --force -g
  ```

- 两个包都提供模型可调用的非阻塞 `notify` 进度提示，但宿主适配层和可用 `variant` 集合不同。不要把 OMP/Pi 包直接装到 OpenCode，也不要把 OpenCode 包直接装到 OMP/Pi。

---

<a name="english"></a>

## English

`omp-notify-tool` gives OMP and Pi-family runtimes a model-callable, non-blocking `notify` tool.

Use it for progress updates, phase changes, and background status messages that do not require an immediate user response. Use `question` or the host runtime's interactive tools when a real user decision, confirmation, authorization, or final handoff is required.

## What You Get

- **Non-blocking progress updates** — agents can call `notify({ message, variant })` without turning progress into a prompt.
- **OMP/Pi dual entry** — the package declares both `omp.extensions` and legacy `pi.extensions`, both pointing to `./src/extension.ts`.
- **Clear interaction boundary** — `notify` is not a replacement for `question`, `wait`, permission approval, or final responses.
- **Completion-notification boundary** — use `pi-notify` or `pi-poly-notify` if you need a completion notification when the agent finishes.
- **Fail-open behavior** — missing UI, headless/subagent mode, or notification failures do not interrupt the main agent task.

---

## Installation

<details open>
<summary><b>For Humans</b></summary>

**Option A: Let an LLM do it**

Paste this into any OMP / Claude Code / Cursor style LLM agent:

```text
First read the latest GitHub Release for omp-notify-tool, then execute the exact versioned OMP install command from the release notes. Do not use a bare package name or latest. After installation, run `omp plugin doctor` to confirm the plugin is available. If OMP is already running, restart the session before verification. Reference: https://github.com/jiwangyihao/omp-notify-tool/releases/latest
```

**Option B: Manual setup**

Current version:

```bash
omp plugin install npm:omp-notify-tool@0.2.0
```

Verify installation:

```bash
omp plugin doctor
```

If OMP is already running, restart it before verification.

</details>

<details>
<summary><b>For LLM Agents</b></summary>

### Step-by-Step Instructions

1. Read the latest GitHub Release body for this repository:

   `https://github.com/jiwangyihao/omp-notify-tool/releases/latest`

2. Extract the exact versioned install command. Current version example:

   ```bash
   omp plugin install npm:omp-notify-tool@0.2.0
   ```

3. Execute that command directly. Do not use a bare package name or `latest`, and do not hand-edit OMP/Pi configuration.

4. After installation, run:

   ```bash
   omp plugin doctor
   ```

5. If OMP is already running, restart before feature verification.

### Verification

Ask the agent to call `notify`, for example:

```json
{
  "message": "Running verification",
  "variant": "info"
}
```

In interactive/RPC UI modes, a non-blocking notification should be displayed. In headless/subagent or no-UI modes, the tool may return skipped without interrupting the main task.

</details>

---

## Local Development

```bash
omp plugin link <path-to-this-repo>
bun test
npm pack --dry-run --json
```

## Tool Input

```json
{
  "message": "Running verification",
  "variant": "info"
}
```

- `message`: required, non-empty string.
- `variant`: optional, one of `info`, `warning`, or `error`; defaults to `info`.

## Runtime Modes

- **OMP interactive**: shows a non-blocking UI notification when `ctx.ui.notify` is available.
- **OMP RPC**: sends a fire-and-forget UI notification request when the host provides that channel.
- **headless/subagent**: may return skipped; the tool fails open and does not interrupt the main task.
- **Pi-family runtime**: loads through the legacy `pi.extensions` package entry. The target runtime must provide compatible extension APIs and `ctx.ui.notify`.


## Companion Package

- Using **OpenCode**? Install [`opencode-notify-tool`](https://github.com/jiwangyihao/opencode-notify-tool):

  ```bash
  opencode plugin opencode-notify-tool@0.1.0 --force -g
  ```

- Both packages provide a model-callable, non-blocking `notify` progress tool, but their host adapters and supported `variant` values are different. Do not install the OMP/Pi package into OpenCode or the OpenCode package into OMP/Pi.

## License

`MPL-2.0`; see [LICENSE](./LICENSE).
