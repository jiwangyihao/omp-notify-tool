import type {
  AgentToolResultLike,
  ExtensionApiLike,
  ExtensionContextLike,
  NotifyParams,
  NotifyVariant,
  RuntimeNotifyType,
} from "./types"

export const NOTIFY_TOOL_DESCRIPTION =
  "Use for non-blocking progress and phase updates only; do not require immediate user response."

const NOTIFY_VARIANTS = ["info", "success", "warning", "error"] as const

type NotifyToolExecute = (
  toolCallId: string,
  params: NotifyParams,
  signal?: AbortSignal,
  onUpdate?: (update: unknown) => void,
  ctx?: ExtensionContextLike,
) => Promise<AgentToolResultLike>

export interface NotifyToolLike {
  name: "notify"
  label: "Notify"
  description: typeof NOTIFY_TOOL_DESCRIPTION
  parameters: unknown
  execute: NotifyToolExecute
}

function createStringEnum(api: ExtensionApiLike, values: readonly string[], options?: Record<string, unknown>): unknown {
  const stringEnum = api.pi?.StringEnum
  if (typeof stringEnum === "function") {
    return stringEnum(values, options)
  }

  return {
    type: "string",
    enum: [...values],
    ...options,
  }
}

function toNotifyType(variant: NotifyVariant): RuntimeNotifyType {
  return variant === "success" ? "info" : variant
}

function result(text: string, details: Record<string, unknown>): AgentToolResultLike {
  return {
    content: [{ type: "text", text }],
    details,
  }
}

function warn(
  logger: { warn?: (message: string, error?: unknown) => void } | undefined,
  message: string,
  error: unknown,
): void {
  try {
    logger?.warn?.(message, error)
  } catch {
    // Keep notify fail-open even when the logger fails.
  }
}

function errorDetail(error: unknown): string {
  if (error instanceof Error) return error.message

  try {
    return String(error)
  } catch {
    return "unknown error"
  }
}

export function createNotifyTool(api: ExtensionApiLike): NotifyToolLike {
  const { Type } = api.typebox

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
        createStringEnum(api, NOTIFY_VARIANTS, {
          description: "Notification variant. Defaults to info.",
        }),
      ),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      return executeNotify(api, params, signal, ctx)
    },
  }
}

export async function executeNotify(
  api: ExtensionApiLike,
  params: NotifyParams,
  signal?: AbortSignal,
  ctx?: ExtensionContextLike,
): Promise<AgentToolResultLike> {
  const variant = params.variant ?? "info"
  const notifyType = toNotifyType(variant)
  const details = { variant, notifyType }

  if (signal?.aborted === true) {
    return result("notify skipped: aborted", {
      delivered: false,
      reason: "aborted",
      ...details,
    })
  }

  const notify = ctx?.ui?.notify
  if (ctx?.hasUI !== true || typeof notify !== "function") {
    return result("notify skipped: UI unavailable", {
      delivered: false,
      reason: "ui_unavailable",
      ...details,
    })
  }

  try {
    await notify(params.message, notifyType)
    return result("ok", {
      delivered: true,
      ...details,
    })
  } catch (error) {
    const message = `[omp-notify-tool] notify failed: ${errorDetail(error)}`
    warn(api.logger, message, error)
    warn(ctx.logger, message, error)

    return result("notify failed: continuing", {
      delivered: false,
      reason: "notify_failed",
      ...details,
    })
  }
}
