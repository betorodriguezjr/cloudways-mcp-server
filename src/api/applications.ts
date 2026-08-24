import { CloudwaysClient } from "./client.js";
import { CloudwaysApiError, firstString, JsonRecord, toArray } from "./utils.js";

export class ApplicationsApi {
  constructor(private readonly client: CloudwaysClient) {}

  /**
   * Cloudways has no per-server "list apps" endpoint: GET /server already
   * embeds each server's apps[], so the list is derived from there.
   */
  async listApplications(serverId: string) {
    const data = await this.client.request<JsonRecord>("GET", "/server");
    const server = toArray<JsonRecord>(data).find(
      (candidate) => firstString(candidate, ["id", "server_id"]) === String(serverId),
    );

    if (!server) {
      throw new CloudwaysApiError(`Server ${serverId} not found on this Cloudways account`);
    }

    return toArray<JsonRecord>(server.apps).map((app) => ({
      app_id: firstString(app, ["id", "app_id", "application_id"]),
      app_name: firstString(app, ["label", "app_name", "name"]),
      domain: firstString(app, ["app_fqdn", "cname", "domain"]),
      application: firstString(app, ["application", "app_type"]),
      sys_user: firstString(app, ["sys_user"]),
      created_at: firstString(app, ["created_at", "created_on"]),
    }));
  }
}
