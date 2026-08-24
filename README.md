# Cloudways MCP Server

Servidor MCP para operar Cloudways desde Claude Code u otros clientes MCP.

>  Note: Cloudways API v1 reached end-of-life on 2026-03-31. This package now targets
> **v2** (`https://api.cloudways.com/api/v2`), which accepts the same credentials and
> returns the same payloads. Override with `CLOUDWAYS_API_BASE_URL` if needed.
>
> All endpoint paths were verified against the live API and the official operation
> reference on 2026-08-24. Cloudways answers unknown paths with **HTTP 200 and the
> plain-text body `You have reached Cloudways API.`** rather than a 404, so a wrong
> path fails silently — `test/smoke.mjs` exists to catch exactly that.

## Tools incluidos

- `list-cloudways-servers`
- `list-cloudways-apps`
- `get-server-stats`
- `deploy-cloudways-app`
- `check-deployment-status`
- `get-cloudways-logs` (staging deployment logs only — the API exposes no others)
- `manage-ssl-certificate` (`install_letsencrypt` / `renew_letsencrypt` / `revoke_letsencrypt` / `install_custom`)
- `create-cloudways-backup`
- `list-cloudways-backups`
- `restart-cloudways-service`

## Instalacion local

```bash
npm install
npm run build
```

Configura credenciales:

```bash
cp .env.example .env
```

```env
CLOUDWAYS_EMAIL=tu_email@example.com
CLOUDWAYS_API_TOKEN=tu_api_token
CLOUDWAYS_LOG_LEVEL=info
CLOUDWAYS_API_BASE_URL=https://api.cloudways.com/api/v1
```

## Uso con Claude Code

Ejemplo de configuracion MCP:

```json
{
  "mcpServers": {
    "cloudways": {
      "command": "node",
      "args": ["C:/Claude/empaya/cloudways-mcp-server/dist/index.js"],
      "env": {
        "CLOUDWAYS_EMAIL": "tu_email@example.com",
        "CLOUDWAYS_API_TOKEN": "tu_api_token"
      }
    }
  }
}
```

Tambien puedes ejecutar:

```bash
npm run dev
```

## Seguridad

- No commitees `.env` ni tokens.
- Los certificados SSL custom se pasan solo en la llamada MCP y no se escriben en disco.
- `set-environment-variable` / `list-environment-variables` were removed: the Cloudways
  API has no environment-variable endpoints at all. Use SSH or the Cloudways panel.

## Desarrollo

```bash
npm run typecheck
npm run build
```

Los endpoints estan centralizados en `src/api/*`.

Read-only check against the live API (needs `CLOUDWAYS_EMAIL` + `CLOUDWAYS_API_TOKEN`):

```bash
npm run build && npm run smoke
```

It never issues a write — no deploy, backup, SSL change, or service restart.
