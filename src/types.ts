export type NotifyVariant = "info" | "success" | "warning" | "error"
export type RuntimeNotifyType = "info" | "warning" | "error"

export interface NotifyParams {
  message: string
  variant?: NotifyVariant
}

export interface AgentToolTextContent {
  type: "text"
  text: string
}

export interface AgentToolResultLike {
  content: AgentToolTextContent[]
  details?: Record<string, unknown>
}

export interface ExtensionContextLike {
  hasUI?: boolean
  ui?: {
    notify?: (message: string, variant?: RuntimeNotifyType) => void | Promise<void>
  }
  logger?: {
    warn?: (message: string, error?: unknown) => void
  }
}

export interface ExtensionApiLike {
  typebox: {
    Type: {
      Object: (properties: Record<string, unknown>, options?: Record<string, unknown>) => unknown
      String: (options?: Record<string, unknown>) => unknown
      Optional: (schema: unknown) => unknown
    }
  }
  pi?: {
    StringEnum?: (values: readonly string[], options?: Record<string, unknown>) => unknown
  }
  logger?: {
    warn?: (message: string, error?: unknown) => void
  }
  setLabel?: (label: string) => void
  registerTool: (tool: unknown) => void
}
