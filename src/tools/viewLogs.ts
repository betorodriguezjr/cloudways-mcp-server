import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonContent, toolError } from "../api/utils.js";
import { ToolContext } from "./context.js";

// The Cloudways API only exposes staging deployment logs; log_type/lines had
// no backing endpoint and were silently ignored, so they are gone.
const InputSchema = z.object({
  server_id: z.string().min(1),
  app_id: z.string().min(1),
});

export function registerViewLogsTool(server: McpServer, context: ToolContext) {
  server.registerTool(
    "get-cloudways-logs",
    {
      title: "Get Cloudways Logs",
      description: "Read the staging deployment logs for a Cloudways application.",
      inputSchema: InputSchema,
    },
    async (input) => {
      try {
        return jsonContent(await context.logs.getLogs(input.server_id, input.app_id));
      } catch (error) {
        return toolError(error);
      }
    },
  );
}

