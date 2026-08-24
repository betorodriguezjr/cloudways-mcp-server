// Read-only smoke test for the Cloudways MCP fork. Asserts the endpoints return
// real data instead of the catch-all "You have reached Cloudways API." page.
import assert from "node:assert";
import { createToolContext } from "../dist/tools/context.js";

const ctx = createToolContext();

const servers = await ctx.servers.listServers();
assert(Array.isArray(servers) && servers.length > 0, "listServers returned nothing");
assert(servers[0].server_id && servers[0].label, "server records are empty");
console.log(`OK listServers -> ${servers.length} servers (first: ${servers[0].label} #${servers[0].server_id})`);

const sid = servers[0].server_id;
const apps = await ctx.applications.listApplications(sid);
assert(Array.isArray(apps) && apps.length > 0, "listApplications returned nothing");
assert(apps[0].app_id && apps[0].app_name, "app records are empty");
console.log(`OK listApplications -> ${apps.length} apps (first: ${apps[0].app_name} #${apps[0].app_id})`);

const stats = await ctx.servers.getServerStats(sid);
assert(stats.operation_completed, "serverUsage operation never completed");
assert(stats.applications.length > 0, "no per-app usage rows");
assert(Object.keys(stats.services).length > 0, "no service statuses");
console.log(`OK getServerStats -> ${stats.applications.length} app rows, ${Object.keys(stats.services).length} services (apache2=${stats.services.apache2})`);

const backups = await ctx.backups.listBackups(sid, apps[0].app_id);
assert(backups.is_completed, "backup listing operation never completed");
console.log(`OK listBackups -> completed, restore_points=${JSON.stringify(backups.restore_points).slice(0,60)}`);

// the Cloudways API has no environment-variable endpoints, so the tools are gone
assert.strictEqual(ctx.applications.listEnvironmentVariables, undefined, "env-var API should not exist");
console.log("OK environment-variable tools -> removed, no dead surface");

console.log("\nAll read-only checks passed.");
