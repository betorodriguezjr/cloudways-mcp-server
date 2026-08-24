import { CloudwaysClient } from "./client.js";
import { JsonRecord, toArray } from "./utils.js";

/**
 * The Cloudways API exposes exactly one log endpoint — staging deployment logs.
 * Application/error/access logs live on the server filesystem and are only
 * reachable over SSH, so they are not offered here.
 */
export class LogsApi {
  constructor(private readonly client: CloudwaysClient) {}

  async getLogs(serverId: string, appId: string): Promise<string[]> {
    const data = await this.client.request<unknown>("GET", "/staging/app/logs", undefined, {
      params: { server_id: serverId, app_id: appId },
    });

    if (typeof data === "string") return data.split(/\r?\n/).filter(Boolean);
    return toArray<JsonRecord | string>(data).map((line) =>
      typeof line === "string" ? line : JSON.stringify(line),
    );
  }
}
