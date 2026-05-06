import { createNotifyTool } from "./notify-tool.js";
const NOTIFY_TOOL_DESCRIPTION = "Use for non-blocking progress and phase updates only; do not require immediate user response.";
export { createNotifyTool };
export function createNotifyPlugin(notifyInput = {}) {
    return async (input) => ({
        tool: {
            notify: createNotifyTool({
                ...notifyInput,
                client: notifyInput.client ?? input.client,
            }),
        },
        "tool.definition": async (hookInput, output) => {
            if (hookInput.toolID === "notify") {
                output.description = NOTIFY_TOOL_DESCRIPTION;
            }
        },
    });
}
export const NotifyPlugin = createNotifyPlugin();
export default NotifyPlugin;
