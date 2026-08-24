import { CloudwaysClient } from "./client.js";
import { firstString, JsonRecord, toArray } from "./utils.js";

export class BackupsApi {
  constructor(private readonly client: CloudwaysClient) {}

  async createBackup(serverId: string, appId: string) {
    const data = await this.client.request<JsonRecord>("POST", "/app/manage/takeBackup", {
      server_id: serverId,
      app_id: appId,
    });

    return {
      operation_id: firstString(data, ["operation_id", "id"]),
      status: firstString(data, ["status"], "requested"),
      raw: data,
    };
  }

  /** GET /app/manage/backup resolves asynchronously into app_restore_points. */
  async listBackups(serverId: string, appId: string) {
    const started = await this.client.request<JsonRecord>("GET", "/app/manage/backup", undefined, {
      params: { server_id: serverId, app_id: appId },
    });

    const operationId = firstString(started, ["operation_id", "id"]);
    if (!operationId) return toArray<JsonRecord>(started);

    const operation = await this.client.pollOperation(operationId);
    return {
      is_completed: String(operation.is_completed ?? "0") === "1",
      restore_points: operation.data ?? [],
      raw: operation,
    };
  }
}
