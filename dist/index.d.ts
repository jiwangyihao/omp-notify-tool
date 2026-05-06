import type { Plugin } from "@opencode-ai/plugin";
import { createNotifyTool, type NotifyToolInput } from "./notify-tool.js";
export { createNotifyTool };
export type { NotifyToolInput };
export declare function createNotifyPlugin(notifyInput?: NotifyToolInput): Plugin;
export declare const NotifyPlugin: Plugin;
export default NotifyPlugin;
