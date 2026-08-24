import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonContent, toolError } from "../api/utils.js";
import { AppTargetSchema } from "../schemas/app.schema.js";
import { ToolContext } from "./context.js";

// The Cloudways API has no "read current SSL" endpoint, so the old "list"
// action was never real. These four are the operations it actually exposes.
const InputSchema = AppTargetSchema.extend({
  action: z.enum(["install_letsencrypt", "renew_letsencrypt", "revoke_letsencrypt", "install_custom"]),
  ssl_email: z.string().email().optional(),
  ssl_domains: z.array(z.string().min(1)).optional(),
  wild_card: z.boolean().default(false),
  certificate_content: z.string().optional(),
  key_content: z.string().optional(),
});

export function registerManageSslTool(server: McpServer, context: ToolContext) {
  server.registerTool(
    "manage-ssl-certificate",
    {
      title: "Manage SSL Certificate",
      description: "Install, renew, or revoke Let's Encrypt, or install a custom certificate, for a Cloudways app.",
      inputSchema: InputSchema,
    },
    async (input) => {
      try {
        return jsonContent(
          await context.ssl.manageCertificate(input.server_id, input.app_id, input.action, {
            sslEmail: input.ssl_email,
            sslDomains: input.ssl_domains,
            wildCard: input.wild_card,
            certificate: input.certificate_content,
            key: input.key_content,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
