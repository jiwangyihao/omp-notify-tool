import test from "node:test"
import assert from "node:assert/strict"

import NotifyPlugin, { createNotifyPlugin } from "../dist/index.js"

function createToolContext() {
  return {
    sessionID: "s1",
    messageID: "m1",
    agent: "task",
    directory: process.cwd(),
    worktree: process.cwd(),
    abort: new AbortController().signal,
    metadata() {},
    async ask() {},
  }
}

test("default export is a callable OpenCode plugin", () => {
  assert.equal(typeof NotifyPlugin, "function")
})

test("createNotifyPlugin returns hooks and tool.notify.execute is callable", async () => {
  const hooks = await createNotifyPlugin()({ client: {}, directory: process.cwd(), worktree: process.cwd() })

  assert.equal(typeof hooks.tool?.notify?.execute, "function")
})

test("plugin entry uses runtime injected client", async () => {
  const calls = []
  const hooks = await createNotifyPlugin()({
    client: { tui: { showToast: async (options) => calls.push(options) } },
    directory: process.cwd(),
    worktree: process.cwd(),
  })

  const result = await hooks.tool.notify.execute({ message: "runtime progress" }, createToolContext())

  assert.equal(result, "ok")
  assert.equal(calls[0]?.body?.message, "runtime progress")
  assert.equal(calls[0]?.body?.variant, "info")
})

test("explicit seam client takes precedence over runtime client", async () => {
  const seamCalls = []
  const runtimeCalls = []
  const hooks = await createNotifyPlugin({
    client: { tui: { showToast: async (options) => seamCalls.push(options) } },
  })({
    client: { tui: { showToast: async (options) => runtimeCalls.push(options) } },
    directory: process.cwd(),
    worktree: process.cwd(),
  })

  await hooks.tool.notify.execute({ message: "seam progress", variant: "warning" }, createToolContext())

  assert.equal(seamCalls.length, 1)
  assert.equal(runtimeCalls.length, 0)
  assert.equal(seamCalls[0]?.body?.variant, "warning")
})

test("tool.definition only rewrites notify", async () => {
  const hooks = await createNotifyPlugin()({ client: {}, directory: process.cwd(), worktree: process.cwd() })
  const notifyOutput = { description: "original notify", parameters: { type: "object" }, extra: "keep" }
  const questionOutput = { description: "original question", parameters: { type: "object" }, extra: "keep" }
  const waitOutput = { description: "original wait", parameters: { type: "object" }, extra: "keep" }
  const otherOutput = { description: "original other", parameters: { type: "object" }, extra: "keep" }

  await hooks["tool.definition"]?.({ toolID: "notify" }, notifyOutput)
  await hooks["tool.definition"]?.({ toolID: "question" }, questionOutput)
  await hooks["tool.definition"]?.({ toolID: "wait" }, waitOutput)
  await hooks["tool.definition"]?.({ toolID: "bash" }, otherOutput)

  assert.deepEqual(notifyOutput, {
    description: "Use for non-blocking progress and phase updates only; do not require immediate user response.",
    parameters: { type: "object" },
    extra: "keep",
  })
  assert.deepEqual(questionOutput, { description: "original question", parameters: { type: "object" }, extra: "keep" })
  assert.deepEqual(waitOutput, { description: "original wait", parameters: { type: "object" }, extra: "keep" })
  assert.deepEqual(otherOutput, { description: "original other", parameters: { type: "object" }, extra: "keep" })
})