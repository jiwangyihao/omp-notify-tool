export type ToastVariant = "info" | "success" | "warning" | "error";
export type NotifyToolInput = {
    client?: {
        tui?: {
            showToast?: (options: {
                body: {
                    message: string;
                    variant: ToastVariant;
                };
                query?: undefined;
            }) => Promise<unknown>;
        };
    };
};
export declare function createNotifyTool(input?: NotifyToolInput): {
    description: string;
    args: {
        message: import("zod").ZodString;
        variant: import("zod").ZodOptional<import("zod").ZodEnum<{
            info: "info";
            success: "success";
            warning: "warning";
            error: "error";
        }>>;
    };
    execute(args: {
        message: string;
        variant?: "info" | "success" | "warning" | "error" | undefined;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<import("@opencode-ai/plugin").ToolResult>;
};
