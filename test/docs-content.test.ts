import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const README = readFileSync("README.md", "utf8");
const RELEASE_NOTES = readFileSync("docs/release-notes-v0.2.3.md", "utf8");
const RUNTIME_COMPATIBILITY_PATH = "docs/runtime-compatibility.md";
const SPEC_PATH = "docs/omp-pi-notify-tool-spec.md";

function expectIncludes(text: string, expected: string) {
  expect(text).toContain(expected);
}

describe("README documentation", () => {
  test("covers required omp-notify-tool usage and boundaries", () => {
    expectIncludes(
      README,
      "`omp-notify-tool` 为 OMP 和 Pi-family runtime 提供模型可调用的非阻塞 `notify` 工具。",
    );
    expectIncludes(
      README,
      "需要用户响应、确认、授权、最终交接或无安全工作可继续时，不要使用 `notify`。",
    );
    expectIncludes(README, "`pi-notify`");
    expectIncludes(README, "`pi-poly-notify`");
    expectIncludes(README, "本包不是完成提醒插件");
    expectIncludes(README, "omp plugin install omp-notify-tool@0.2.3");
    expectIncludes(README, "Latest in v0.2.3 | v0.2.3 ACP 友好的 fail-open 结果");
    expectIncludes(README, "面向人类用户");
    expectIncludes(README, "面向 LLM 智能体");
    expectIncludes(README, "不要省略版本号，不要使用 `latest`");
    expectIncludes(README, "omp plugin link <path-to-this-repo>");
    expectIncludes(README, "omp plugin doctor");
    expectIncludes(
      README,
      `{
  "message": "Running verification",
  "variant": "info"
}`,
    );
    expectIncludes(README, "interactive");
    expectIncludes(README, "RPC");
    expect(README).toMatch(/headless\s*\/\s*subagent/);
    expectIncludes(README, "`variant`：可选，只能是 `info`、`warning`、`error`；缺省为 `info`");
    expectIncludes(README, "`MPL-2.0`");
    expectIncludes(README, "[LICENSE](./LICENSE)");
    expectIncludes(README, "What You Get");
    expectIncludes(README, "For Humans");
    expectIncludes(README, "For LLM Agents");
    expectIncludes(README, "opencode-notify-tool");
    expectIncludes(README, "opencode plugin opencode-notify-tool@0.1.0 --force -g");
    expectIncludes(README, "不要把 OMP/Pi 包直接装到 OpenCode");
  });
});

describe("runtime compatibility documentation", () => {
  test("exists and records capability gates without overclaiming", () => {
    expect(existsSync(RUNTIME_COMPATIBILITY_PATH)).toBe(true);

    const runtimeCompatibility = readFileSync(RUNTIME_COMPATIBILITY_PATH, "utf8");
    expectIncludes(runtimeCompatibility, "OMP interactive");
    expectIncludes(runtimeCompatibility, "ctx.ui.notify");
    expectIncludes(runtimeCompatibility, "OMP RPC");
    expectIncludes(runtimeCompatibility, "fire-and-forget");
    expect(runtimeCompatibility).toMatch(/headless\s*\/\s*subagent/);
    expectIncludes(runtimeCompatibility, "可见工具文本仍为 `ok`");
    expectIncludes(runtimeCompatibility, "Pi-family");
    expectIncludes(runtimeCompatibility, "legacy `pi.extensions`");
    expectIncludes(runtimeCompatibility, "不声明未验证 runtime 一定支持");
    expectIncludes(runtimeCompatibility, "`variant` 只支持 OMP/Pi UI notify 类型：`info`、`warning`、`error`");
    expectIncludes(runtimeCompatibility, "本包不做跨宿主语义转换");
    expectIncludes(runtimeCompatibility, "details.reason = \"ui_unavailable\"");
  });
});

describe("OMP/Pi notify tool spec", () => {
  test("records the official runtime notify signature", () => {
    expect(existsSync(SPEC_PATH)).toBe(true);

    const spec = readFileSync(SPEC_PATH, "utf8");
    expectIncludes(spec, "ctx.ui.notify(message, type)");
    expectIncludes(spec, "notify?: (message: string, type?: RuntimeNotifyType) => void | Promise<void>;");
    expect(spec).not.toContain("notify?: (payload: { type: RuntimeNotifyType; message: string })");
    expectIncludes(spec, "可见工具文本返回 `ok`");
    expectIncludes(spec, "content[0].text === \"ok\"");
  });
});

describe("v0.2.3 release notes", () => {
  test("summarize install, dual entry, boundaries, and runtime caveats", () => {
    expectIncludes(RELEASE_NOTES, "v0.2.3");
    expectIncludes(RELEASE_NOTES, "omp plugin install omp-notify-tool@0.2.3");
    expectIncludes(RELEASE_NOTES, "content[0].text === \"ok\"");
    expectIncludes(RELEASE_NOTES, "无 UI、aborted");
    expectIncludes(RELEASE_NOTES, "details.reason");
    expectIncludes(RELEASE_NOTES, "`variant` 支持范围为 `info`、`warning`、`error`");
    expectIncludes(RELEASE_NOTES, "fail-open");
    expectIncludes(RELEASE_NOTES, "ctx.ui.notify` 抛错或 rejected");
  });
});
