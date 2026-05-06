import { tool } from "@opencode-ai/plugin";
export function createNotifyTool(input = {}) {
    return tool({
        description: "Notify the user with a non-blocking progress update.",
        args: {
            message: tool.schema.string().min(1).describe("Progress message to show without blocking"),
            variant: tool.schema.enum(["info", "success", "warning", "error"]).optional().describe("Toast variant"),
        },
        async execute(args) {
            try {
                await input.client?.tui?.showToast?.({
                    body: {
                        message: args.message,
                        variant: args.variant ?? "info",
                    },
                });
            }
            catch (error) {
                console.warn("[notify-tool] failed to show toast", error);
            }
            return "ok";
        },
    });
}
