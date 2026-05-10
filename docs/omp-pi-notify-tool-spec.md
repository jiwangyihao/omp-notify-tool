# OMP/Pi Notify Tool 移植规格

> **状态：** 设计规格，供后续实现计划使用。  
> **目标仓库建议：** `jiwangyihao/omp-notify-tool`  
> **npm 包名建议：** `omp-notify-tool`  
> **参考项目：** [`jiwangyihao/omp-openai-provider-tools`](https://github.com/jiwangyihao/omp-openai-provider-tools)  
> **源项目：** 当前仓库 `opencode-notify-tool`

## 1. 背景

当前 `opencode-notify-tool` 为 OpenCode 提供模型可调用的 `notify` 工具。它的价值不在于桌面通知能力，而在于给模型一个明确的非阻塞进度通道：

```json
{
  "message": "Running verification",
  "variant": "info"
}
```

该工具用于进度、阶段切换、后台状态提示，不要求用户响应。需要用户确认、授权、选择、最终交接或无安全工作可继续时，应继续使用 `question` 或宿主对应的交互工具。

OMP/Pi 已有 extension、自定义工具和 UI 通知能力。缺口是：尚未发现一个贴合 OMP/Pi UI 通知能力的原生模型可调用 `notify` 工具包。

## 2. 目标

移植后的新包提供一个同时支持 OMP 和 Pi-family runtime 的 extension：

- 注册一个模型可调用工具 `notify`。
- 定义 OMP/Pi 原生业务契约：`message` 必填，`variant` 可选且限制为 `info | warning | error`。
- 使用 OMP/Pi 的 `ctx.ui.notify(message, variant)` 作为展示通道。
- 在无 UI、headless、subagent、后台或 UI 调用失败时 fail-open，不阻塞主 Agent 工作。
- 包安装本身不修改用户配置，不写入 agent，不禁用任何内置工具。
- 同一个 npm 包同时声明 `omp.extensions` 和 legacy `pi.extensions` 入口。

## 3. 非目标

本包不做以下事情：

- 不做任务完成后的桌面通知插件；这类能力由 `pi-notify`、`pi-poly-notify` 等事件驱动插件覆盖。
- 不替代 `question`、`wait`、权限确认、人工审批或最终回复。
- 不新增 OS notification、sound、Pushover、Webhook、邮件、移动推送等外部通知通道。
- 不提供持久化通知历史、去重队列、通知中心或仪表盘。
- 不读取、保存或要求任何 API key。
- 不把 OpenCode 插件适配层和 OMP/Pi 适配层放入同一个 npm 包。
- 不依赖 OMP/Pi runtime core 包作为运行时 dependency。

## 4. 项目形态

### 4.1 独立仓库与包

建议新建独立仓库和 npm 包：

```text
GitHub: https://github.com/jiwangyihao/omp-notify-tool
npm:    omp-notify-tool
```

理由：

- 当前 `opencode-notify-tool` 依赖 `@opencode-ai/plugin`，并绑定 OpenCode 的 `tool.definition`、`client.tui.showToast` 和 `opencode plugin` 安装机制。
- OMP/Pi 版本应使用 extension `registerTool` 与 `ctx.ui.notify`，宿主适配层完全不同。
- 独立包能避免用户混淆安装方式，也便于按 OMP/Pi runtime 兼容性独立发布。

### 4.2 参考 `omp-openai-provider-tools` 的包结构

新包应参考 `omp-openai-provider-tools` 的模式，而不是当前 OpenCode 包的 `dist` 发布模式：

```text
omp-notify-tool/
  .github/
    workflows/
      release.yml
  docs/
    runtime-compatibility.md
    release-notes-v0.1.0.md
  src/
    extension.ts
    notify-tool.ts
    types.ts
  test/
    extension.test.ts
    package-manifest.test.ts
    release-workflow.test.ts
    notify-tool.test.ts
  README.md
  LICENSE
  package.json
  tsconfig.json
  bun.lock
```

首版可以比 `omp-openai-provider-tools` 更简单，不需要 CLI。

## 5. package manifest 规格

`package.json` 应同时声明 OMP 与 Pi extension 入口：

```json
{
  "type": "module",
  "name": "omp-notify-tool",
  "version": "0.1.0",
  "description": "Model-callable non-blocking notify tool for OMP and Pi-family runtimes.",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jiwangyihao/omp-notify-tool.git"
  },
  "license": "MPL-2.0",
  "keywords": [
    "oh-my-pi",
    "pi-package",
    "omp",
    "pi",
    "extension",
    "notify",
    "toast",
    "progress",
    "agent"
  ],
  "scripts": {
    "test": "bun test",
    "check": "bun test"
  },
  "engines": {
    "bun": ">=1.3.7",
    "node": ">=20"
  },
  "publishConfig": {
    "access": "public"
  },
  "omp": {
    "extensions": ["./src/extension.ts"]
  },
  "pi": {
    "extensions": ["./src/extension.ts"]
  },
  "files": [
    "src",
    "README.md",
    "LICENSE",
    "docs/runtime-compatibility.md"
  ]
}
```

约束：

- `omp.extensions` 和 `pi.extensions` 必须指向同一个 shared extension entry。
- 不设置 `bin`，除非后续确实需要显式配置 CLI。
- 不添加 `@oh-my-pi/*`、`@mariozechner/*`、`@opencode-ai/*` 作为运行时 dependency。
- 若只使用宿主传入的 `pi.typebox`，首版可以没有 runtime dependencies。
- `files` 不应包含 `docs/superpowers`、测试目录或本地规格文档。

## 6. Runtime 兼容性策略

### 6.1 支持范围

首版支持以下运行时形态：

| Runtime | 支持方式 | 预期行为 |
| --- | --- | --- |
| OMP interactive TUI | `ctx.ui.notify` | 展示非阻塞通知，工具返回成功 |
| OMP RPC mode | `ctx.ui.notify` fire-and-forget | 发送 `extension_ui_request`，工具返回成功 |
| OMP headless / subagent | `ctx.hasUI === false` 或 UI no-op | 不抛错，返回 skipped |
| Pi-family runtime | legacy `pi.extensions` 加载同一入口 | 若支持 `registerTool` 与 `ctx.ui.notify`，行为同 OMP |
| 未知/部分兼容 runtime | 能加载 extension 但 UI 能力缺失 | 不抛错，返回 skipped 或 failed |

### 6.2 能力检测

工具执行时必须优先使用执行上下文 `ctx`，而不是 extension load 阶段的全局 `pi.ui`。

原因：

- extension load 阶段 runtime actions 尚未初始化。
- `ctx.hasUI` 比全局状态更接近当前会话、RPC、headless 或 subagent 状态。
- 后台模式可能存在非交互 UI context，不能假定所有 UI 方法都有实际可见效果。

能力判断规则：

1. 若 `ctx.hasUI !== true`，不调用 `ctx.ui.notify`。
2. 若 `ctx.ui?.notify` 不是函数，不调用。
3. 若 `ctx.ui.notify` 抛错或返回 rejected promise，捕获并记录 warning。
4. 所有失败路径都返回正常 tool result，不把通知失败升级为工具错误。

## 7. 工具契约

### 7.1 工具名

```text
notify
```

必须保持小写，避免与事件驱动通知插件的命名混淆。若 runtime 已存在同名工具，遵循宿主的工具名冲突处理；本包不在运行时自动改名。

### 7.2 描述

工具描述建议使用英文，便于模型稳定理解：

```text
Use for non-blocking progress and phase updates only; do not require immediate user response.
```

README 中需要同时提供中文边界说明。

### 7.3 参数 schema

使用宿主注入的 TypeBox，并通过宿主导出的 `StringEnum` 表达字符串枚举。不要为了 `StringEnum` 新增 runtime dependency。

```ts
const { Type } = pi.typebox;
const { StringEnum } = pi.pi;

const parameters = Type.Object({
  message: Type.String({
    minLength: 1,
    description: "Progress message to show without blocking.",
  }),
  variant: Type.Optional(
    StringEnum(["info", "warning", "error"] as const, {
      description: "Notification variant. Defaults to info.",
    }),
  ),
});
```

约束：

- 首选 `pi.pi.StringEnum`，因为 OMP/Pi 的 provider tool schema 对字符串枚举有兼容性要求。
- 如果目标 runtime 暂时没有注入 `pi.pi.StringEnum`，实现必须提供本地 fallback，生成等价 JSON schema：`{ type: "string", enum: ["info", "warning", "error"] }`。
- 不得使用 `Type.Union([Type.Literal(...)])` 表达 `variant`，避免部分 provider 无法识别字符串枚举。

首版不开放这些字段：

- `title`
- `duration`
- `channel`
- `dedupeKey`
- `sound`
- `desktop`
- `sticky`
- `actions`

原因：OMP/Pi 版本应保持小而稳定的进度工具边界，避免把进度工具膨胀成通知系统。

### 7.4 空白字符串

OMP/Pi 版本首版只要求 `message.minLength === 1`，不额外 trim：

- 空字符串 `""`：由 schema 拒绝。
- 纯空白字符串：不额外拒绝。

如果未来要收紧为 `trim().length > 0`，应作为破坏性或至少行为变更记录在 release notes 中。

## 8. 执行语义

### 8.1 成功路径

公开工具参数直接贴合 OMP/Pi UI notify 类型，只接收 `info | warning | error`。执行前只需应用默认值：

```ts
const variant = params.variant ?? "info";
const notifyType = variant;
```

当 UI 可用且 `ctx.ui.notify` 调用成功：

```ts
return {
  content: [{ type: "text", text: "ok" }],
  details: {
    delivered: true,
    variant,
    notifyType,
  },
};
```

`details.variant` 保留模型传入或默认后的公开 variant；`details.notifyType` 记录实际传给 OMP/Pi UI 的类型。当前二者应保持一致。

### 8.2 无 UI 路径

当没有 UI 或 `notify` 方法不可用：

```ts
return {
  content: [{ type: "text", text: "notify skipped: UI unavailable" }],
  details: {
    delivered: false,
    reason: "ui_unavailable",
    variant,
    notifyType,
  },
};
```

这与 OpenCode 版本的 fail-open 一致，但比固定返回 `ok` 更诚实，便于测试和排障。

### 8.3 UI 失败路径

当 `ctx.ui.notify` 抛错或异步失败：

```ts
return {
  content: [{ type: "text", text: "notify failed: continuing" }],
  details: {
    delivered: false,
    reason: "notify_failed",
    variant,
    notifyType,
  },
};
```

同时记录 warning。实现必须包含可读错误细节，但不得让日志失败影响工具返回：

```ts
function warn(logger: { warn?: (message: string, error?: unknown) => void } | undefined, message: string, error: unknown): void {
  try {
    logger?.warn?.(message, error);
  } catch {
    // keep notify fail-open
  }
}

const detail = error instanceof Error ? error.message : String(error);
warn(api.logger, `[omp-notify-tool] notify failed: ${detail}`, error);
warn(ctx.logger, `[omp-notify-tool] notify failed: ${detail}`, error);
```

日志失败不得影响工具返回；`api.logger.warn` 或 `ctx.logger.warn` 自身抛错时，也必须返回上面的 failed/continuing 结果。


### 8.4 Cancellation

`notify` 是一次快速 fire-and-forget UI 操作。若 `signal.aborted === true`：

- 不调用 UI。
- 返回 `notify skipped: aborted`。
- `details.reason = "aborted"`。

不要调用 `ctx.abort()`。

## 9. Extension 实现结构

### 9.1 `src/types.ts`

定义最小 runtime-like 类型，避免依赖 OMP/Pi core 包：

```ts
export type NotifyVariant = "info" | "warning" | "error";
export type RuntimeNotifyType = "info" | "warning" | "error";

export interface NotifyParams {
  message: string;
  variant?: NotifyVariant;
}

export interface AgentToolTextContent {
  type: "text";
  text: string;
}

export interface AgentToolResultLike {
  content: AgentToolTextContent[];
  details?: Record<string, unknown>;
}

export interface ExtensionContextLike {
  hasUI?: boolean;
  ui?: {
    notify?: (message: string, variant?: RuntimeNotifyType) => void | Promise<void>;
  };
  logger?: {
    warn?: (message: string, error?: unknown) => void;
  };
}

export interface ExtensionApiLike {
  typebox: {
    Type: any;
  };
  pi?: {
    StringEnum?: (values: readonly string[], options?: Record<string, unknown>) => unknown;
  };
  logger?: {
    warn?: (message: string, error?: unknown) => void;
  };
  setLabel?: (label: string) => void;
  registerTool: (tool: unknown) => void;
}
```

### 9.2 `src/notify-tool.ts`

封装业务逻辑，便于单测：

```ts
export const NOTIFY_TOOL_DESCRIPTION =
  "Use for non-blocking progress and phase updates only; do not require immediate user response.";

export function createNotifyTool(api: ExtensionApiLike) {
  const { Type } = api.typebox;
  const StringEnum = api.pi?.StringEnum ?? ((values: readonly string[], options?: Record<string, unknown>) => ({
    type: "string",
    enum: [...values],
    ...options,
  }));

  return {
    name: "notify",
    label: "Notify",
    description: NOTIFY_TOOL_DESCRIPTION,
    parameters: Type.Object({
      message: Type.String({
        minLength: 1,
        description: "Progress message to show without blocking.",
      }),
      variant: Type.Optional(
        StringEnum(["info", "warning", "error"] as const, {
          description: "Notification variant. Defaults to info.",
        }),
      ),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      return executeNotify(api, params, signal, ctx);
    },
  };
}
```

`executeNotify(api, params, signal, ctx)` 单独导出，直接覆盖成功、无 UI、失败、aborted 路径。

### 9.3 `src/extension.ts`

共享 extension entry：

```ts
import { createNotifyTool } from "./notify-tool";

export default function notifyExtension(pi: ExtensionApiLike): void {
  pi.setLabel?.("Notify Tool");
  pi.registerTool(createNotifyTool(pi));
}
```

禁止在 extension load 阶段调用 `pi.ui.notify`、`pi.sendMessage` 或其他 runtime action。

## 10. README 规格

README 必须覆盖以下内容：

1. 项目一句话说明：

   ```md
   `omp-notify-tool` 为 OMP 和 Pi-family runtime 提供模型可调用的非阻塞 `notify` 工具。
   ```

2. 与 `question` 的边界：

   ```md
   `notify` 只用于进度、阶段切换和后台状态。需要用户响应、确认、授权、最终交接或无安全工作可继续时，不要使用 `notify`。
   ```

3. 与完成提醒插件的边界：

   ```md
   如果你需要 Agent 完成后提醒人回来，请使用 `pi-notify` 或 `pi-poly-notify`。本包不是完成提醒插件。
   ```

4. 安装命令必须带明确版本号：

   ```bash
   omp plugin install omp-notify-tool@0.1.0
   ```

5. 本地开发链接：

   ```bash
   omp plugin link <path-to-this-repo>
   ```

6. 安装后验证：

   ```bash
   omp plugin doctor
   ```

7. 工具参数示例：

   ```json
   {
     "message": "Running verification",
     "variant": "info"
   }
   ```

8. 运行模式说明：interactive/RPC 可通知，headless/subagent 可能 skipped；`variant` 只支持 `info`、`warning`、`error`，且 tool result 中 `details.notifyType` 与最终使用的 `variant` 一致。

9. Pi-family runtime 通过同一个 npm 包的 legacy `pi.extensions` 入口加载。若目标 Pi CLI 的安装命令与 OMP 不同，应在实现阶段验证后补充对应命令；未验证前不要写成事实。

10. License：`MPL-2.0`，并链接 `LICENSE`。

## 11. Runtime compatibility 文档

新增 `docs/runtime-compatibility.md`，参考 `omp-openai-provider-tools` 的风格，但内容聚焦本包：

- 本文档只记录能力门槛和观察结果，不声明未验证 runtime 一定支持。
- OMP interactive TUI：需要 extension entry、`registerTool`、`ctx.ui.notify`。
- OMP RPC：需要 fire-and-forget `notify` UI request。
- Headless/subagent：应返回 skipped。
- Pi-family：需要 legacy `pi.extensions` manifest 和兼容的 extension API。
- 本包不依赖 active-tools、provider request hook、message renderer 或 custom UI。

## 12. 测试规格

实现阶段必须严格使用 TDD：先为每个任务添加或更新会失败的 Bun 测试，运行并确认失败原因是功能缺失，再实现最少代码使测试通过。建议任务组为：manifest/docs、extension registration、notify execution semantics、release workflow。每组完成前只运行本组新增或修改的测试；所有组完成后再运行 `bun test` 和 `npm pack --dry-run --json`。

### 12.1 `test/package-manifest.test.ts`

必须断言：

- `packageJson.name` 等于 `"omp-notify-tool"`。
- `packageJson.type` 等于 `"module"`。
- `packageJson.omp` 等于 `{ extensions: ["./src/extension.ts"] }`。
- `packageJson.pi` 等于 `{ extensions: ["./src/extension.ts"] }`。
- `packageJson.scripts.test` 等于 `"bun test"`。
- `packageJson.scripts.check` 等于 `"bun test"`。
- `packageJson.engines.node` 满足 `>=20`。
- `packageJson.engines.bun` 满足 `>=1.3.7`。
- `packageJson.publishConfig.access` 等于 `"public"`。
- `packageJson.bin` 未定义。
- `keywords` 包含 `oh-my-pi`、`pi-package`、`omp`、`pi`、`extension`、`notify`。
- `license` 为 `MPL-2.0`，且 `LICENSE` 存在。
- README 包含当前版本安装命令：`omp plugin install omp-notify-tool@${version}`。
- `files` 等于 `src`、`README.md`、`LICENSE`、`docs/runtime-compatibility.md`。
- `files` 不包含 `docs/superpowers`、`test`、`dist`。
- runtime dependencies 不包含：
  - `@oh-my-pi/*`
  - `@mariozechner/*`
  - `@opencode-ai/*`
- 若没有必要，`dependencies` 应为空对象或未定义。

### 12.2 `test/extension.test.ts`

必须断言：

- 默认导出是函数。
- 调用 extension factory 后注册一个工具。
- 工具名是 `notify`。
- label 是 `Notify`。
- description 等于规定文案。
- factory 调用期间不会调用 UI runtime action。
- factory 可在缺少 `setLabel` 时正常工作。

### 12.3 `test/notify-tool.test.ts`

必须断言：

- 参数 schema 只包含 `message` 和 `variant`。
- `message` 是必填字段。
- `message.minLength === 1`。
- schema 拒绝缺失 `message` 的参数对象。
- schema 拒绝空字符串 `""`。
- schema 接受普通非空字符串。
- 首版不额外拒绝纯空白字符串。
- `variant` 枚举只允许 `info`、`warning`、`error`。
- `variant` schema 使用 `StringEnum` 或等价 `{ type: "string", enum: [...] }`，不使用 `Type.Union([Type.Literal(...)])`。
- 不暴露 `title`、`duration`、`channel`、`dedupeKey`、`sound`、`desktop`、`sticky`。
- 缺省 `variant` 时调用 UI 使用 `notifyType = "info"`。
- 显式 `variant` 会保留在 `details.variant`。
- UI 可用时返回结构化 tool result：`content[0].text === "ok"`，`details.delivered === true`，`details.variant === 实际 variant`，`details.notifyType === 实际 UI notify type`。
- `ctx.hasUI = false` 时不调用 UI，返回 skipped，`details.delivered = false`。
- `ctx.ui.notify` 缺失时返回 skipped。
- `ctx.ui.notify` 同步抛错时返回 failed，且 logger warning 被调用。
- `ctx.ui.notify` 返回 rejected promise 时返回 failed，且 logger warning 被调用。
- `api.logger.warn` 抛错时，失败路径仍返回 `details.reason = "notify_failed"` 且不 reject。
- `ctx.logger.warn` 抛错时，失败路径仍返回 `details.reason = "notify_failed"` 且不 reject。
- `signal.aborted = true` 时不调用 UI，返回 aborted。
- `onUpdate` 不被调用；本工具不产生流式部分结果。

### 12.4 `test/docs-content.test.ts`

必须断言：

- README 包含项目一句话说明。
- README 包含 `question` 边界。
- README 包含 `pi-notify` / `pi-poly-notify` 完成提醒插件边界。
- README 包含版本化安装命令。
- README 包含 `omp plugin link`。
- README 包含 `omp plugin doctor`。
- README 包含工具参数 JSON 示例。
- README 包含 interactive、RPC、headless/subagent 说明。
- README 包含 `variant` 只支持 `info`、`warning`、`error` 的说明。
- README 包含 `MPL-2.0` 并链接 `LICENSE`。
- `docs/runtime-compatibility.md` 存在，并覆盖 OMP interactive、OMP RPC、headless/subagent、Pi-family，以及“不声明未验证 runtime 一定支持”。
- `docs/release-notes-v0.1.0.md` 存在，并包含版本号、版本化安装命令、OMP/Pi 双入口、完成提醒插件边界、headless/subagent skipped 说明、`variant` 支持范围说明。

### 12.5 `test/release-workflow.test.ts`

必须断言 `.github/workflows/release.yml`：

- 触发条件为 GitHub Release published。
- `permissions.id-token = write`，用于 npm Trusted Publisher。
- 使用 Node 24。
- 安装 Bun。
- 执行 `bun install --frozen-lockfile`。
- 执行 `bun test`。
- 执行 `npm pack --dry-run --json`。
- 发布前检查同版本是否已存在。
- 未发布时执行 `npm publish --access public`。

## 13. 发布流程

首发流程：

```bash
bun test
npm pack --dry-run --json
npm view omp-notify-tool@0.1.0 version --json
npm whoami
npm publish --access public
```

Trusted Publisher 配置完成后，后续发布走 GitHub Release：

```bash
gh release create v0.1.0 \
  --repo jiwangyihao/omp-notify-tool \
  --target master \
  --title "v0.1.0" \
  --notes-file docs/release-notes-v0.1.0.md \
  --latest
```

release notes 必须包含：

- 版本号。
- 明确版本安装命令。
- OMP/Pi 双入口说明。
- 与 `pi-notify` / `pi-poly-notify` 的边界。
- headless/subagent 可能返回 skipped 的说明。
- `variant` 只支持 `info`、`warning`、`error` 的说明。

## 14. 安全与可靠性要求

- 通知失败不得中断 Agent 主任务。
- 工具结果不得伪装 UI 成功；失败或跳过要在 `details` 中明确表达。
- 不写用户配置，不修改 active tools，不注册 completion event 通知。
- 不创建外部网络请求。
- 不读取环境变量或凭据。
- 不在 extension load 阶段调用 runtime action。
- logger 不存在或 logger 抛错时，工具仍应返回正常失败结果。
- tool name 冲突由宿主处理；本包不自动覆盖其他工具。

## 15. 与现有项目的关系

### 15.1 与 `opencode-notify-tool`

保留的契约：

- 工具名：`notify`。
- 参数：`message`、`variant`。
- 默认 variant：`info`。
- 非阻塞进度语义。
- fail-open。
- 与 `question` / `wait` 分离。

重写的部分：

- OpenCode `@opencode-ai/plugin` 替换为 OMP/Pi extension `registerTool`。
- `client.tui.showToast` 替换为 `ctx.ui.notify`。
- 字符串返回 `"ok"` 扩展为结构化 `AgentToolResultLike`，在 `details` 中表达 `delivered`、`reason` 和 `variant`。
- npm 包发布形态从 `dist` 产物包改为参考 `omp-openai-provider-tools` 的源码 extension 包。

### 15.2 与 `omp-openai-provider-tools`

应复用的模式：

- 同一个 npm 包同时声明 `omp.extensions` 与 legacy `pi.extensions`。
- extension entry 指向源码 `./src/extension.ts`。
- 使用 Bun 运行测试，发布前执行 `bun test`。
- `package-manifest.test.ts` 固化 package manifest、license、README、发布文件和运行时依赖边界。
- `release-workflow.test.ts` 固化 GitHub Release + npm Trusted Publisher 发布链路。
- `docs/runtime-compatibility.md` 明确记录观察到的能力和能力门槛，不把未验证 runtime 行为写成事实。

不应复用的模式：

- 不需要 provider request hook。
- 不需要 active-tools 冲突控制。
- 不需要 message renderer、image renderer 或 provider result renderer。
- 不需要 CLI；除非未来新增显式配置需求。

### 15.3 与 `pi-notify` / `pi-poly-notify`

这两个项目属于事件驱动完成提醒，主要回答「Agent 完成后如何提醒人回来」。本包回答的是另一件事：

```text
模型当前正在推进任务，如何发出不要求用户回复的进度提示？
```

因此 README 和 release notes 必须明确边界，避免用户以为本包提供桌面完成通知或外部推送。

## 16. 规格验收标准

实现完成后，必须满足以下验收标准：

- `package.json` 同时声明 `omp.extensions` 和 `pi.extensions`，且都指向 `./src/extension.ts`。
- `notify` tool 可由模型调用，参数只包含 `message` 和 `variant`。
- `variant` 缺省时按 `info` 处理。
- interactive UI 可用时调用 `ctx.ui.notify(message, variant)`。
- RPC UI 可用时通过 runtime 的 fire-and-forget notify 通道发送。
- headless/subagent/no-UI 场景不抛错，返回 skipped。
- UI notify 抛错或 rejected 时不使 tool 失败，返回 failed/continuing，并记录 warning。
- 工具不会调用 `question`、`wait`、`ctx.abort()` 或任何外部通知通道。
- 安装插件不会写用户配置、不会生成 agent、不会修改 active tools。
- `bun test` 通过。
- `npm pack --dry-run --json` 只包含允许发布的文件。
- README 包含明确版本安装命令和 OMP/Pi 双运行时说明。
- `docs/runtime-compatibility.md` 说明 interactive、RPC、headless/subagent 和 Pi-family 的能力门槛。

## 17. 已确认事实与待实现阶段再验证事项

已确认事实：

- 当前 `opencode-notify-tool` 是 OpenCode 独立 npm 插件，依赖 `@opencode-ai/plugin`，不含 OMP/Pi 适配。
- OMP extension 支持 `registerTool`，工具执行上下文包含 `ctx.ui` 和 `ctx.hasUI`。
- OMP extension loading 支持 npm package manifest 的 `omp.extensions`，并接受 legacy `pi.extensions`。
- `omp-openai-provider-tools` 已采用同包双入口模式：`omp.extensions` 与 `pi.extensions` 同时指向 `./src/extension.ts`。
- 编写本规格时，npm registry 查询 `omp-notify-tool` 和 `pi-notify-tool` 返回 404；GitHub 搜索 `jiwangyihao/omp-notify-tool` 未发现已存在仓库。

实现阶段必须再验证：

- 目标 OMP/Pi runtime 当前版本的 `ctx.ui.notify` 参数签名是否仍为 `(message, variant?)`。
- `registerTool.execute` 的参数顺序是否与当前文档一致：`toolCallId, params, signal, onUpdate, ctx`。
- `omp plugin install omp-notify-tool@0.1.0` 在发布后能正确加载源码 `src/extension.ts`。
- RPC 模式下 notify 是否可由客户端实际展示；若不能展示，工具仍应返回明确 skipped/failed。

## 18. 自检

- 范围聚焦：本规格只覆盖 OMP/Pi 版模型可调用 `notify` 工具，不包含 OpenCode 包改造、完成提醒、外部推送或 loop-safety 总控。
- 边界明确：`notify` 仅用于非阻塞进度；交互、等待和最终交接继续由宿主其他工具处理。
- 双运行时明确：package manifest 必须同时包含 `omp.extensions` 和 `pi.extensions`。
- 安全策略明确：通知失败 fail-open，但 tool result 必须如实表达 skipped/failed，不能把未展示伪装成 delivered。
- 测试可执行：每个关键行为都有对应测试文件和断言。