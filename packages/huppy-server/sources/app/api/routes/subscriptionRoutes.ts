import { z } from "zod";
import { Fastify } from "../types";
import { subscriptionVerify } from "@/app/subscription/subscriptionVerify";
import { subscriptionStatus } from "@/app/subscription/subscriptionStatus";

export function subscriptionRoutes(app: Fastify) {

    // POST /v1/subscription/verify
    // Verifies an Apple IAP receipt and activates Pro if valid
    app.post('/v1/subscription/verify', {
        preHandler: app.authenticate,
        schema: {
            body: z.object({
                receiptData: z.string().min(1),
            }),
            response: {
                200: z.object({
                    isPro: z.boolean(),
                    expiresAt: z.string().nullable(),
                    productId: z.string().nullable(),
                }),
                400: z.object({ error: z.string() }),
                500: z.object({ error: z.string() }),
            },
        },
    }, async (request, reply) => {
        const { receiptData } = request.body;
        const accountId = request.userId;

        try {
            const result = await subscriptionVerify({ accountId, receiptData });
            return reply.send({
                isPro: result.isPro,
                expiresAt: result.expiresAt?.toISOString() ?? null,
                productId: result.productId,
            });
        } catch (e: any) {
            if (e.message?.includes("Apple receipt verification failed")) {
                return reply.code(400).send({ error: e.message });
            }
            return reply.code(500).send({ error: "Failed to verify receipt" });
        }
    });

    // GET /v1/subscription/status
    // Returns the current subscription status for the authenticated user
    app.get('/v1/subscription/status', {
        preHandler: app.authenticate,
        schema: {
            response: {
                200: z.object({
                    isPro: z.boolean(),
                    expiresAt: z.string().nullable(),
                    productId: z.string().nullable(),
                }),
            },
        },
    }, async (request, reply) => {
        const accountId = request.userId;
        const result = await subscriptionStatus({ accountId });
        return reply.send({
            isPro: result.isPro,
            expiresAt: result.expiresAt?.toISOString() ?? null,
            productId: result.productId,
        });
    });
}
