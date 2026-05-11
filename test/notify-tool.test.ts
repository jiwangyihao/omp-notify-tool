import { describe, expect, test } from "bun:test"

import { NOTIFY_TOOL_DESCRIPTION, createNotifyTool, executeNotify } from "../src/notify-tool"
import type { ExtensionApiLike, ExtensionContextLike, NotifyParams } from "../src/types"

const variants = ["info", "warning", "error"] as const

function createTypeboxStub() {
  return {
    Type: {
      Object: (properties: Record<string, unknown>) => ({
        type: "object",
        properties,
        required: Object.entries(properties)
          .filter(([, schema]) => !(schema as { optional?: boolean }).optional)
          .map(([name]) => name),
        additionalProperties: false,
      }),
      String: (options?: Record<string, unknown>) => ({ type: "string", ...options }),
      Optional: (schema: unknown) => ({ ...(schema as Record<string, unknown>), optional: true }),
      Union: (schemas: unknown[]) => ({ anyOf: schemas, unionWasUsed: true }),
      Literal: (value: unknown) => ({ const: value }),
    },
  }
}

function createApi(overrides: Partial<ExtensionApiLike> = {}): ExtensionApiLike {
  return {
    typebox: createTypeboxStub(),
    registerTool: () => undefined,
    ...overrides,
  }
}

function validateNotifyParams(schema: any, value: Record<string, unknown>) {
  const errors: string[] = []

  for (const key of schema.required ?? []) {
    if (!Object.hasOwn(value, key)) errors.push(`missing:${key}`)
  }

  for (const [key, fieldSchema] of Object.entries(schema.properties ?? {}) as Array<[string, any]>) {
    if (!Object.hasOwn(value, key)) continue
    const fieldValue = value[key]
    if (fieldSchema.type === "string" && typeof fieldValue !== "string") errors.push(`type:${key}`)
    if (typeof fieldValue === "string" && typeof fieldSchema.minLength === "number" && fieldValue.length < fieldSchema.minLength) {
      errors.push(`minLength:${key}`)
    }
    if (Array.isArray(fieldSchema.enum) && !fieldSchema.enum.includes(fieldValue)) errors.push(`enum:${key}`)
  }

  return { success: errors.length === 0, errors }
}

function createAbortSignal(aborted: boolean): AbortSignal {
  const controller = new AbortController()
  if (aborted) controller.abort()
  return controller.signal
}

describe("createNotifyTool", () => {
  test("exposes notify metadata and parameters schema for message and variant only", () => {
    const stringEnumCalls: Array<{ values: readonly string[]; options?: Record<string, unknown> }> = []
    const api = createApi({
      pi: {
        StringEnum: (values, options) => {
          stringEnumCalls.push({ values, options })
          return { type: "string", enum: [...values], stringEnumWasUsed: true, ...options }
        },
      },
    })

    const tool = createNotifyTool(api)
    const parameters = tool.parameters as any

    expect(tool.name).toBe("notify")
    expect(tool.label).toBe("Notify")
    expect(tool.description).toBe(NOTIFY_TOOL_DESCRIPTION)
    expect(Object.keys(parameters.properties).sort()).toEqual(["message", "variant"])
    expect(parameters.required).toEqual(["message"])
    expect(parameters.properties.message.minLength).toBe(1)
    expect(stringEnumCalls).toHaveLength(1)
    expect(stringEnumCalls[0]?.values).toEqual(variants)
    expect(parameters.properties.variant.enum).toEqual(variants)
    expect(parameters.properties.variant.stringEnumWasUsed).toBe(true)
    expect(parameters.properties.variant.anyOf).toBeUndefined()
    expect(parameters.properties.variant.unionWasUsed).toBeUndefined()

    for (const hiddenField of ["title", "duration", "channel", "dedupeKey", "sound", "desktop", "sticky"]) {
      expect(parameters.properties).not.toHaveProperty(hiddenField)
    }
  })

  test("uses equivalent enum schema fallback when runtime StringEnum is unavailable", () => {
    const tool = createNotifyTool(createApi())
    const variantSchema = (tool.parameters as any).properties.variant

    expect(variantSchema.type).toBe("string")
    expect(variantSchema.enum).toEqual(variants)
    expect(variantSchema.anyOf).toBeUndefined()
    expect(variantSchema.unionWasUsed).toBeUndefined()
  })

  test("schema validation rejects missing and empty message while accepting non-empty and whitespace messages", () => {
    const schema = createNotifyTool(createApi()).parameters

    expect(validateNotifyParams(schema, {}).success).toBe(false)
    expect(validateNotifyParams(schema, { message: "" }).success).toBe(false)
    expect(validateNotifyParams(schema, { message: "progress" }).success).toBe(true)
    expect(validateNotifyParams(schema, { message: "   " }).success).toBe(true)
  })

  test("schema validation allows only public notify variants", () => {
    const schema = createNotifyTool(createApi()).parameters

    for (const variant of variants) {
      expect(validateNotifyParams(schema, { message: "progress", variant }).success).toBe(true)
    }

    expect(validateNotifyParams(schema, { message: "progress", variant: "debug" }).success).toBe(false)
    expect(validateNotifyParams(schema, { message: "progress", variant: "success" }).success).toBe(false)
  })

  test("execute delegates runtime execution without emitting streaming updates", async () => {
    let onUpdateCalled = false
    const calls: unknown[] = []
    const tool = createNotifyTool(createApi())

    const result = await tool.execute(
      "tool-call-1",
      { message: "phase 1" },
      createAbortSignal(false),
      () => {
        onUpdateCalled = true
      },
      {
        hasUI: true,
        ui: { notify: (message, type) => calls.push([message, type]) },
      },
    )

    expect(result.details?.delivered).toBe(true)
    expect(calls).toEqual([["phase 1", "info"]])
    expect(onUpdateCalled).toBe(false)
  })
})

describe("executeNotify", () => {
  test("defaults variant to info and returns structured delivered result when UI succeeds", async () => {
    const calls: unknown[] = []

    const result = await executeNotify(createApi(), { message: "running" }, createAbortSignal(false), {
      hasUI: true,
      ui: { notify: (message, type) => calls.push([message, type]) },
    })

    expect(calls).toEqual([["running", "info"]])
    expect(result).toEqual({
      content: [{ type: "text", text: "ok" }],
      details: { delivered: true, variant: "info", notifyType: "info" },
    })
  })

  test("preserves explicit warning variant in result details", async () => {
    const result = await executeNotify(createApi(), { message: "careful", variant: "warning" }, createAbortSignal(false), {
      hasUI: true,
      ui: { notify: () => undefined },
    })

    expect(result.details?.variant).toBe("warning")
    expect(result.details?.notifyType).toBe("warning")
  })

  test("passes OMP/Pi notify message and type arguments for each public variant", async () => {
    for (const variant of variants) {
      const calls: unknown[] = []

      const result = await executeNotify(createApi(), { message: "progress", variant }, createAbortSignal(false), {
        hasUI: true,
        ui: { notify: (message, type) => calls.push([message, type]) },
      })

      expect(calls).toEqual([["progress", variant]])
      expect(result.details?.delivered).toBe(true)
      expect(result.details?.variant).toBe(variant)
      expect(result.details?.notifyType).toBe(variant)
    }
  })

  test("uses notify capability when present even if hasUI is false", async () => {
    const calls: unknown[] = []

    const result = await executeNotify(createApi(), { message: "rpc background" }, createAbortSignal(false), {
      hasUI: false,
      ui: { notify: (message, type) => calls.push([message, type]) },
    })

    expect(calls).toEqual([["rpc background", "info"]])
    expect(result.details).toEqual({ delivered: true, variant: "info", notifyType: "info" })
  })

  test("returns ok text when UI notify method is missing", async () => {
    const result = await executeNotify(createApi(), { message: "background" }, createAbortSignal(false), {
      hasUI: true,
      ui: {},
    })

    expect(result.content[0]?.text).toBe("ok")
    expect(result.details?.delivered).toBe(false)
    expect(result.details?.reason).toBe("ui_unavailable")
  })

  test("returns ok text and warns when UI notify throws synchronously", async () => {
    const warnings: string[] = []
    const error = new Error("sync boom")

    const result = await executeNotify(
      createApi({ logger: { warn: (message) => warnings.push(message) } }),
      { message: "running" },
      createAbortSignal(false),
      {
        hasUI: true,
        ui: { notify: () => { throw error } },
      },
    )

    expect(result.content[0]?.text).toBe("ok")
    expect(result.details).toEqual({ delivered: false, reason: "notify_failed", variant: "info", notifyType: "info" })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain("sync boom")
  })

  test("returns ok text and warns when UI notify rejects", async () => {
    const warnings: string[] = []

    const result = await executeNotify(
      createApi({ logger: { warn: (message) => warnings.push(message) } }),
      { message: "running" },
      createAbortSignal(false),
      {
        hasUI: true,
        ui: { notify: async () => { throw new Error("async boom") } },
      },
    )

    expect(result.content[0]?.text).toBe("ok")
    expect(result.details?.reason).toBe("notify_failed")
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain("async boom")
  })

  test("returns ok text when thrown value cannot be stringified", async () => {
    const result = await executeNotify(createApi(), { message: "running" }, createAbortSignal(false), {
      hasUI: true,
      ui: { notify: () => { throw Object.create(null) } },
    })

    expect(result.content[0]?.text).toBe("ok")
    expect(result.details).toEqual({ delivered: false, reason: "notify_failed", variant: "info", notifyType: "info" })
  })

  test("still returns failed result when api logger throws", async () => {
    await expect(
      executeNotify(
        createApi({ logger: { warn: () => { throw new Error("logger failed") } } }),
        { message: "running" },
        createAbortSignal(false),
        {
          hasUI: true,
          ui: { notify: () => { throw new Error("notify failed") } },
        },
      ),
    ).resolves.toMatchObject({ details: { reason: "notify_failed" } })
  })

  test("still returns failed result when ctx logger throws", async () => {
    const ctx: ExtensionContextLike = {
      hasUI: true,
      ui: { notify: () => { throw new Error("notify failed") } },
      logger: { warn: () => { throw new Error("logger failed") } },
    }

    await expect(executeNotify(createApi(), { message: "running" }, createAbortSignal(false), ctx)).resolves.toMatchObject({
      details: { reason: "notify_failed" },
    })
  })

  test("uses ctx logger for notify failures", async () => {
    const warnings: string[] = []

    await executeNotify(createApi(), { message: "running" }, createAbortSignal(false), {
      hasUI: true,
      ui: { notify: () => { throw new Error("notify failed") } },
      logger: { warn: (message) => warnings.push(message) },
    })

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain("notify failed")
  })

  test("returns ok text without calling UI when signal is already aborted", async () => {
    let notifyCalled = false

    const result = await executeNotify(createApi(), { message: "running", variant: "error" }, createAbortSignal(true), {
      hasUI: true,
      ui: { notify: () => { notifyCalled = true } },
    })

    expect(notifyCalled).toBe(false)
    expect(result.content[0]?.text).toBe("ok")
    expect(result.details).toEqual({ delivered: false, reason: "aborted", variant: "error", notifyType: "error" })
  })
})
