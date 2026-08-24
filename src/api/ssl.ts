import { CloudwaysClient } from "./client.js";
import { CloudwaysApiError, firstString, JsonRecord } from "./utils.js";

export type SslAction = "install_letsencrypt" | "renew_letsencrypt" | "revoke_letsencrypt" | "install_custom";

export class SslApi {
  constructor(private readonly client: CloudwaysClient) {}

  async manageCertificate(
    serverId: string,
    appId: string,
    action: SslAction,
    options: { sslEmail?: string; sslDomains?: string[]; wildCard?: boolean; certificate?: string; key?: string } = {},
  ) {
    const target = { server_id: serverId, app_id: appId };

    switch (action) {
      case "install_letsencrypt": {
        if (!options.sslEmail || !options.sslDomains?.length) {
          throw new CloudwaysApiError("ssl_email and ssl_domains are required to install Let's Encrypt");
        }
        return this.post("/security/lets_encrypt_install", {
          ...target,
          ssl_email: options.sslEmail,
          ssl_domains: options.sslDomains,
          wild_card: options.wildCard ?? false,
        });
      }
      case "renew_letsencrypt":
        return this.post("/security/lets_encrypt_manual_renew", target);
      case "revoke_letsencrypt":
        return this.post("/security/lets_encrypt_revoke", target);
      case "install_custom": {
        if (!options.certificate || !options.key) {
          throw new CloudwaysApiError("certificate and key are required to install a custom certificate");
        }
        return this.post("/security/own_ssl", { ...target, ssl_cert: options.certificate, ssl_key: options.key });
      }
    }
  }

  private async post(path: string, body: JsonRecord) {
    const data = await this.client.request<JsonRecord>("POST", path, body);
    return {
      operation_id: firstString(data, ["operation_id", "id"]),
      status: firstString(data, ["status", "message"], "requested"),
      raw: data,
    };
  }
}
