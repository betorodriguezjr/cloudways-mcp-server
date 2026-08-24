import { CloudwaysClient } from "./client.js";
import { firstString, JsonRecord } from "./utils.js";

export class DeployApi {
  constructor(private readonly client: CloudwaysClient) {}

  /**
   * POST /git/pull requires deploy_path; an empty string means public_html.
   * commitMessage has no equivalent in the Cloudways API and is ignored.
   */
  async deploy(serverId: string, appId: string, gitBranch = "main", deployPath = "") {
    const data = await this.client.request<JsonRecord>("POST", "/git/pull", {
      server_id: serverId,
      app_id: appId,
      branch_name: gitBranch,
      deploy_path: deployPath,
    });

    return {
      operation_id: firstString(data, ["operation_id", "id"]),
      branch: gitBranch,
      status: firstString(data, ["status"], "requested"),
      raw: data,
    };
  }

  /**
   * With an operation id, report that operation. Without one, fall back to the
   * app's recent deployment history.
   */
  async checkDeploymentStatus(serverId: string, appId: string, deploymentId?: string) {
    if (deploymentId) {
      const operation = await this.client.pollOperation(deploymentId, 1, 0);
      return {
        operation_id: deploymentId,
        is_completed: String(operation.is_completed ?? "0") === "1",
        status: firstString(operation, ["status", "message"], "unknown"),
        raw: operation,
      };
    }

    const history = await this.client.request<JsonRecord>("GET", "/git/history", undefined, {
      params: { server_id: serverId, app_id: appId },
    });

    return { history: history.logs ?? history, raw: history };
  }
}
