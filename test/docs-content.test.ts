import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const README = readFileSync("README.md", "utf8");
const RELEASE_NOTES = readFileSync("docs/release-notes-v0.2.0.md", "utf8");
const RUNTIME_COMPATIBILITY_PATH = "docs/runtime-compatibility.md";

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
    expectIncludes(README, "omp plugin install npm:omp-notify-tool@0.2.0");
    expectIncludes(README, "Latest in v0.2.0 | v0.2.0 原生 OMP/Pi 语义");
    expectIncludes(README, "面向人类用户");
    expectIncludes(README, "面向 LLM 智能体");
    expectIncludes(README, "不要使用裸包名或 latest");
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
    expectIncludes(runtimeCompatibility, "skipped");
    expectIncludes(runtimeCompatibility, "Pi-family");
    expectIncludes(runtimeCompatibility, "legacy `pi.extensions`");
    expectIncludes(runtimeCompatibility, "不声明未验证 runtime 一定支持");
    expectIncludes(runtimeCompatibility, "`variant` 只支持 OMP/Pi UI notify 类型：`info`、`warning`、`error`");
    expectIncludes(runtimeCompatibility, "本包不做跨宿主语义转换");
  });
});

describe("v0.2.0 release notes", () => {
  test("summarize install, dual entry, boundaries, and runtime caveats", () => {
    expectIncludes(RELEASE_NOTES, "v0.2.0");
    expectIncludes(RELEASE_NOTES, "omp plugin install npm:omp-notify-tool@0.2.0");
    expectIncludes(RELEASE_NOTES, "OMP/Pi 双入口");
    expectIncludes(RELEASE_NOTES, "`pi-notify`");
    expectIncludes(RELEASE_NOTES, "`pi-poly-notify`");
    expectIncludes(RELEASE_NOTES, "完成提醒");
    expect(RELEASE_NOTES).toMatch(/headless\s*\/\s*subagent/);
    expectIncludes(RELEASE_NOTES, "skipped");
    expectIncludes(RELEASE_NOTES, "`variant` 只支持 OMP/Pi UI notify 类型：`info`、`warning`、`error`");
  });
});
