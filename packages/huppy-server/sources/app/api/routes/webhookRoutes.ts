import { z } from "zod";
import { type Fastify } from "../types";
import { log } from "@/utils/log";
import { syncEntitlementsFromRevenueCat } from "@/app/billing/entitlements";

/**
 * POST /webhook/revenuecat
 *
 * Receives RevenueCat webhook events. On any subscription-relevant event,
 * re-fetches the subscriber from RevenueCat GET /subscribers to get the
 * authoritative state and syncs it to the local cache.
 *
 * We do NOT trust the webhook payload directly — we use it only as a trigger.
 */
export function webhookRoutes(app: Fastify) {
    app.post('/webhook/revenuecat', {
        schema: {
            body: z.object({
                event: z.object({
                    app_user_id: z.string(),
                    type: z.string(),
                }).passthrough(),
            }).passthrough(),
        },
    }, async (request, reply) => {
        const { event } = request.body as { event: { app_user_id: string; type: string } };
        const appUserId = event.app_user_id;

        log({ module: "webhook" }, `RevenueCat webhook: ${event.type} for user ${appUserId}`);

        // Trigger re-sync from RevenueCat (fire and forget, respond 200 immediately)
        syncEntitlementsFromRevenueCat(appUserId).catch((err) => {
            log({ module: "webhook" }, `Failed to sync entitlements for ${appUserId}: ${err}`);
        });

        return reply.code(200).send({ ok: true });
    });
}
