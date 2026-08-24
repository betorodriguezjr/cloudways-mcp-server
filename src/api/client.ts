import axios, { AxiosInstance, AxiosRequestConfig, Method } from "axios";
import { CloudwaysAuth } from "./auth.js";
import { JsonRecord, normalizeBaseUrl, optionalEnv, unwrapData } from "./utils.js";

export class CloudwaysClient {
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly auth: CloudwaysAuth;

  constructor() {
    this.baseUrl = normalizeBaseUrl(optionalEnv("CLOUDWAYS_API_BASE_URL", "https://api.cloudways.com/api/v2")!);
    this.http = axios.create({
      timeout: Number(process.env.CLOUDWAYS_TIMEOUT_MS ?? 30_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "cloudways-mcp-server/1.0.0",
      },
    });
    this.auth = new CloudwaysAuth(this.http, this.baseUrl);
  }

  async request<T = unknown>(method: Method, path: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
    const token = await this.auth.getAccessToken();
    const response = await this.http.request<T>({
      ...config,
      method,
      url: `${this.baseUrl}${path}`,
      data,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    return unwrapData<T>(response.data);
  }

  /**
   * Several Cloudways endpoints answer with { operation_id } and resolve in the
   * background. Poll /operation/{id} until is_completed, then return the record.
   * ponytail: fixed 2s interval; switch to backoff if an operation ever runs long.
   */
  async pollOperation(operationId: string, attempts = 15, intervalMs = 2000): Promise<JsonRecord> {
    let last: JsonRecord = {};
    for (let i = 0; i < attempts; i++) {
      const res = await this.request<JsonRecord>("GET", `/operation/${encodeURIComponent(operationId)}`);
      last = (res.operation as JsonRecord) ?? res;
      if (String(last.is_completed ?? "0") === "1") return last;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return last;
  }
}

