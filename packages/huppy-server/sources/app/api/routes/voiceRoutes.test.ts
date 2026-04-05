import fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Fastify } from "../types";

const { hasEntitlementMock } = vi.hoisted(() => ({
    hasEntitlementMock: vi.fn(async () => false)
}));

vi.mock("@/app/billing/entitlements", () => ({
    hasEntitlement: hasEntitlementMock
}));

import { voiceRoutes } from "./voiceRoutes";

const LEGACY_PRODUCTION_ELEVENLABS_AGENT_ID = "agent_6701k211syvvegba4kt7m68nxjmw";
const CURRENT_PRODUCTION_ELEVENLABS_AGENT_ID = "agent_7801k2c0r5hjfraa1kdbytpvs6yt";

function jsonResponse(status: number, body: unknown) {
    return {
        ok: status >= 200 && status < 300,
        status,
        async json() {
            return body;
        }
    } as Response;
}

async function createApp() {
    const app = fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    const typed = app.withTypeProvider<ZodTypeProvider>() as unknown as Fastify;

    typed.decorate("authenticate", async (request: any, reply: any) => {
        const userId = request.headers["x-user-id"];
        if (typeof userId !== "string") {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        request.userId = userId;
    });

    voiceRoutes(typed);
    await typed.ready();
    return typed;
}

describe("voiceRoutes", () => {
    let app: Fastify;
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        hasEntitlementMock.mockReset();
        hasEntitlementMock.mockResolvedValue(false);
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
        process.env.HANDY_MASTER_SECRET = "test-secret";
        process.env.ELEVENLABS_API_KEY = "test-elevenlabs-key";
    });

    afterEach(async () => {
        vi.unstubAllGlobals();
        delete process.env.HANDY_MASTER_SECRET;
        delete process.env.ELEVENLABS_API_KEY;
        if (app) {
            await app.close();
        }
    });

    it("remaps the legacy production agent id before minting an ElevenLabs token", async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, { conversations: [] }))
            .mockResolvedValueOnce(jsonResponse(200, { token: "voice-token" }));

        app = await createApp();

        const response = await app.inject({
            method: "POST",
            url: "/v1/voice/token",
            headers: {
                "x-user-id": "user-1"
            },
            payload: {
                agentId: LEGACY_PRODUCTION_ELEVENLABS_AGENT_ID
            }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            allowed: true,
            token: "voice-token",
            agentId: CURRENT_PRODUCTION_ELEVENLABS_AGENT_ID,
            usedSeconds: 0,
            limitSeconds: 3600
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(String(fetchMock.mock.calls[1]?.[0])).toContain(CURRENT_PRODUCTION_ELEVENLABS_AGENT_ID);
    });

    it("leaves non-aliased agent ids unchanged", async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, { conversations: [] }))
            .mockResolvedValueOnce(jsonResponse(200, { token: "voice-token" }));

        app = await createApp();

        const response = await app.inject({
            method: "POST",
            url: "/v1/voice/token",
            headers: {
                "x-user-id": "user-1"
            },
            payload: {
                agentId: "agent_custom"
            }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            allowed: true,
            token: "voice-token",
            agentId: "agent_custom"
        });
        expect(String(fetchMock.mock.calls[1]?.[0])).toContain("agent_custom");
    });
});
