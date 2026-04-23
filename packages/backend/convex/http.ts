import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/sync-matches",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json().catch(() => ({})) as Record<string, string>;
    await ctx.runAction(internal.footballData.syncAll, {
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/sync-bsa",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json().catch(() => ({})) as Record<string, string>;
    await ctx.runAction(internal.footballData.syncAllBSA, {
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
