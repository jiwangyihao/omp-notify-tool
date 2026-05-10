import { createNotifyTool } from "./notify-tool"
import type { ExtensionApiLike } from "./types"

export default function notifyExtension(pi: ExtensionApiLike): void {
  pi.setLabel?.("Notify Tool")
  pi.registerTool(createNotifyTool(pi))
}
