import { describe, expect, test } from "bun:test"

import notifyExtension from "../src/extension"

const NOTIFY_TOOL_DESCRIPTION =
  "Use for non-blocking progress and phase updates only; do not require immediate user response."

type FakeApi = {
  typebox: {
    Type: {
      Object: (properties: Record<string, unknown>) => unknown
      String: (schemaOptions?: Record<string, unknown>) => unknown
      Optional: (schema: unknown) => unknown
    }
  }
  pi: {
    StringEnum: (values: readonly string[], schemaOptions?: Record<string, unknown>) => unknown
  }
  registerTool: (tool: unknown) => void
  ui: {
    notify: () => never
  }
  setLabel?: (label: string) => void
}

function createFakeApi(options: { includeSetLabel?: boolean } = {}) {
  const registeredTools: unknown[] = []
  const labels: string[] = []
  let uiNotifyCalls = 0

  const api: FakeApi = {
    typebox: {
      Type: {
        Object: (properties: Record<string, unknown>) => ({ type: "object", properties }),
        String: (schemaOptions: Record<string, unknown> = {}) => ({ type: "string", ...schemaOptions }),
        Optional: (schema: unknown) => ({ optional: true, schema }),
      },
    },
    pi: {
      StringEnum: (values: readonly string[], schemaOptions: Record<string, unknown> = {}) => ({
        type: "string",
        enum: [...values],
        ...schemaOptions,
      }),
    },
    registerTool: (tool: unknown) => {
      registeredTools.push(tool)
    },
    ui: {
      notify: () => {
        uiNotifyCalls += 1
        throw new Error("extension load must not call ui.notify")
      },
    },
  }

  if (options.includeSetLabel !== false) {
    api.setLabel = (label: string) => {
      labels.push(label)
    }
  }

  return { api, registeredTools, labels, getUiNotifyCalls: () => uiNotifyCalls }
}

describe("notify extension entry", () => {
  test("default export is a function", () => {
    expect(typeof notifyExtension).toBe("function")
  })

  test("registers the notify tool and sets the extension label without runtime UI actions", () => {
    const { api, registeredTools, labels, getUiNotifyCalls } = createFakeApi()

    notifyExtension(api)

    expect(labels).toEqual(["Notify Tool"])
    expect(registeredTools).toHaveLength(1)
    expect(getUiNotifyCalls()).toBe(0)

    const tool = registeredTools[0] as { name?: string; label?: string; description?: string }
    expect(tool.name).toBe("notify")
    expect(tool.label).toBe("Notify")
    expect(tool.description).toBe(NOTIFY_TOOL_DESCRIPTION)
  })

  test("loads and registers the notify tool when setLabel is unavailable", () => {
    const { api, registeredTools, getUiNotifyCalls } = createFakeApi({ includeSetLabel: false })

    notifyExtension(api)

    expect(registeredTools).toHaveLength(1)
    expect(getUiNotifyCalls()).toBe(0)
  })
})
