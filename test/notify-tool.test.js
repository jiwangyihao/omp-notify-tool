import test from "node:test"
import assert from "node:assert/strict"

import { createNotifyTool } from "../dist/notify-tool.js"

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

test("notify tool exposes message and optional variant only", () => {
  const notify = createNotifyTool()

  assert.deepEqual(Object.keys(notify.args).sort(), ["message", "variant"])
  assert.equal(Object.hasOwn(notify.args, "title"), false)
  assert.equal(Object.hasOwn(notify.args, "duration"), false)
  assert.equal(Object.hasOwn(notify.args, "channel"), false)
  assert.equal(Object.hasOwn(notify.args, "dedupeKey"), false)
})

test("notify tool defaults variant to info", async () => {
  const calls = []
  const notify = createNotifyTool({
    client: { tui: { showToast: async (options) => calls.push(options) } },
  })

  const result = await notify.execute({ message: "still working" }, createToolContext())

  assert.equal(result, "ok")
  assert.equal(calls[0]?.body?.message, "still working")
  assert.equal(calls[0]?.body?.variant, "info")
})

test("notify tool maps message and variant to tui.showToast", async () => {
  const calls = []
  const notify = createNotifyTool({
    client: { tui: { showToast: async (options) => calls.push(options) } },
  })

  const result = await notify.execute({ message: "running verification", variant: "success" }, createToolContext())

  assert.equal(result, "ok")
  assert.deepEqual(calls, [{ body: { message: "running verification", variant: "success" } }])
})

test("notify tool fails open when showToast is unavailable", async () => {
  const shapes = [
    undefined,
    {},
    { client: {} },
    { client: { tui: {} } },
  ]

  for (const input of shapes) {
    const notify = createNotifyTool(input)
    await assert.doesNotReject(() => notify.execute({ message: "still running" }, createToolContext()))
    assert.equal(await notify.execute({ message: "still running" }, createToolContext()), "ok")
  }
})

test("notify tool swallows toast failures and warns once", async () => {
  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => warnings.push(args.map(String).join(" "))

  try {
    const notify = createNotifyTool({
      client: { tui: { showToast: async () => { throw new Error("toast failed") } } },
    })

    const result = await notify.execute({ message: "still running" }, createToolContext())
    assert.equal(result, "ok")
  } finally {
    console.warn = originalWarn
  }

  assert.equal(warnings.length, 1)
  assert.match(warnings[0] ?? "", /\[notify-tool\] failed to show toast/)
})

test("notify tool validates schema boundaries", () => {
  const notify = createNotifyTool()

  assert.equal(notify.args.message.safeParse("").success, false)
  assert.equal(notify.args.message.safeParse("progress").success, true)
  for (const variant of ["info", "success", "warning", "error"]) {
    assert.equal(notify.args.variant.safeParse(variant).success, true)
  }
  assert.equal(notify.args.variant.safeParse("debug").success, false)
})