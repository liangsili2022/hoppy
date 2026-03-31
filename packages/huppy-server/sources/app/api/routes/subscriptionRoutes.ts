import { z } from "zod";
import { Fastify } from "../types";
import { hasEntitlement } from "@/app/billing/entitlements";

export function subscriptionRoutes(app: Fastify) {

    // GET /v1/subscription/status
    // Returns Pro entitlement status from RevenueCat (with local cache).
    // RevenueCat is the single source of truth — no Apple receipt verification here.
    app.get('/v1/subscription/status', {
        preHandler: app.authenticate,
        schema: {
            response: {
                200: z.object({
                    isPro: z.boolean(),
                }),
            },
        },
    }, async (request, reply) => {
        const isPro = await hasEntitlement(request.userId, "pro");
        return reply.send({ isPro });
    });
}
