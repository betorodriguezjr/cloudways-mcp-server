import { CloudwaysClient } from "./client.js";
import { firstString, JsonRecord, toArray } from "./utils.js";

export type ServerFilter = "running" | "stopped" | "all";

/** serverUsage returns its payload as a JSON string in `parameters`. */
function parseOperationParameters(operation: JsonRecord): JsonRecord {
  const raw = operation.parameters;
  if (typeof raw !== "string") return (raw as JsonRecord) ?? {};
  try {
    return JSON.parse(raw) as JsonRecord;
  } catch {
    return {};
  }
}

export class ServersApi {
  constructor(private readonly client: CloudwaysClient) {}

  async listServers(filter: ServerFilter = "all") {
    const data = await this.client.request("GET", "/server");
    const servers = toArray<JsonRecord>(data).map((server) => ({
      server_id: firstString(server, ["server_id", "id"]),
      label: firstString(server, ["label", "name", "server_name"]),
      status: firstString(server, ["status", "server_status"], "unknown"),
      ip_address: firstString(server, ["ip_address", "public_ip", "ip"]),
      created_at: firstString(server, ["created_at", "created_on"]),
    }));

    if (filter === "all") return servers;
    return servers.filter((server) => server.status.toLowerCase() === filter);
  }

  /**
   * Cloudways has no synchronous "server stats" endpoint. Live per-application
   * CPU/RAM comes from /server/analytics/serverUsage, which is asynchronous, and
   * service state comes from /service. Both are combined here.
   */
  async getServerStats(serverId: string) {
    const started = await this.client.request<JsonRecord>("GET", "/server/analytics/serverUsage", undefined, {
      params: { server_id: serverId },
    });

    const operationId = firstString(started, ["operation_id", "id"]);
    const operation = operationId ? await this.client.pollOperation(operationId) : {};
    const rows = toArray<unknown>(
      ((parseOperationParameters(operation).applications as JsonRecord) ?? {}).body,
    );

    const applications = rows
      .filter((row): row is unknown[] => Array.isArray(row))
      .map((row) => ({
        sys_user: String(row[0] ?? ""),
        cpu_usage: String(row[1] ?? ""),
        ram_usage: String(row[2] ?? ""),
      }));

    const services = await this.client.request<JsonRecord>("GET", "/service", undefined, {
      params: { server_id: serverId },
    });

    return {
      server_id: serverId,
      applications,
      services: (services.services as JsonRecord)?.status ?? services.services ?? {},
      operation_completed: String((operation as JsonRecord).is_completed ?? "0") === "1",
    };
  }

  async restartService(serverId: string, service: string) {
    const data = await this.client.request<JsonRecord>("POST", "/service/state", {
      server_id: serverId,
      service,
      state: "restart",
    });

    return {
      service,
      operation_id: firstString(data, ["operation_id", "id"]),
      status: firstString(data, ["status"], "restart_requested"),
      raw: data,
    };
  }
}
