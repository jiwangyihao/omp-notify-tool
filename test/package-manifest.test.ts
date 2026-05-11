import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "bun:test";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const readme = await readFile("README.md", "utf8");

function expectMinimumRange(range: unknown, expected: [number, number, number]) {
  expect(typeof range).toBe("string");

  const match = String(range).match(/^>=(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
  expect(match).not.toBeNull();

  const actual: [number, number, number] = [
    Number(match?.[1] ?? 0),
    Number(match?.[2] ?? 0),
    Number(match?.[3] ?? 0),
  ];

  expect(actual[0]).toBeGreaterThanOrEqual(expected[0]);
  if (actual[0] === expected[0]) {
    expect(actual[1]).toBeGreaterThanOrEqual(expected[1]);
  }
  if (actual[0] === expected[0] && actual[1] === expected[1]) {
    expect(actual[2]).toBeGreaterThanOrEqual(expected[2]);
  }
}

function expectNoForbiddenRuntimeDependencies(dependencies: Record<string, string> | undefined) {
  const forbiddenScopes = ["@oh-my-pi/", "@mariozechner/", "@opencode-ai/"];

  for (const name of Object.keys(dependencies ?? {})) {
    expect(forbiddenScopes.some((scope) => name.startsWith(scope))).toBe(false);
  }
}

describe("package manifest", () => {
  test("declares the OMP/Pi extension package identity", () => {
    expect(packageJson.name).toBe("omp-notify-tool");
    expect(packageJson.type).toBe("module");
    expect(packageJson.omp).toEqual({ extensions: ["./src/extension.ts"] });
    expect(packageJson.pi).toEqual({ extensions: ["./src/extension.ts"] });
  });

  test("uses Bun test scripts and supported runtime engines", () => {
    expect(packageJson.scripts?.test).toBe("bun test");
    expect(packageJson.scripts?.check).toBe("bun test");
    expectMinimumRange(packageJson.engines?.node, [20, 0, 0]);
    expectMinimumRange(packageJson.engines?.bun, [1, 3, 7]);
  });

  test("publishes as a public source extension without a CLI", () => {
    expect(packageJson.publishConfig?.access).toBe("public");
    expect(packageJson.bin).toBeUndefined();
    expect(packageJson.files).toEqual([
      "src",
      "README.md",
      "LICENSE",
      "docs/runtime-compatibility.md",
      "docs/release-notes-v0.2.3.md",
    ]);
    expect(packageJson.files).not.toContain("docs/superpowers");
    expect(packageJson.files).not.toContain("test");
    expect(packageJson.files).not.toContain("dist");
  });

  test("keeps discoverability metadata and license requirements", () => {
    expect(packageJson.license).toBe("MPL-2.0");
    expect(existsSync("LICENSE")).toBe(true);

    for (const keyword of ["oh-my-pi", "pi-package", "omp", "pi", "extension", "notify"]) {
      expect(packageJson.keywords).toContain(keyword);
    }
  });

  test("documents the versioned npm installation command", () => {
    expect(readme).toContain(`omp plugin install omp-notify-tool@${packageJson.version}`);
  });

  test("does not ship runtime dependencies on runtime SDK packages", () => {
    expectNoForbiddenRuntimeDependencies(packageJson.dependencies);
    expect(packageJson.dependencies === undefined || Object.keys(packageJson.dependencies).length === 0).toBe(true);
  });
});
