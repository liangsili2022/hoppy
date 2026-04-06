import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, inTxMock } = vi.hoisted(() => ({
    dbMock: {
        subscription: {
            findFirst: vi.fn(),
        },
    },
    inTxMock: vi.fn(),
}));

vi.mock("@/storage/db", () => ({
    db: dbMock,
}));

vi.mock("@/storage/inTx", () => ({
    inTx: inTxMock,
}));

import { hasEntitlement } from "./entitlements";

describe("hasEntitlement", () => {
    beforeEach(() => {
        vi.stubEnv("REVENUECAT_API_KEY", "rc_test_key");
        dbMock.subscription.findFirst.mockReset();
        inTxMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("falls back to RevenueCat when the local subscription cache is unavailable", async () => {
        dbMock.subscription.findFirst.mockRejectedValueOnce(new Error("db unavailable"));
        inTxMock.mockRejectedValueOnce(new Error("db unavailable"));

        const fetchMock = vi.fn(async () =>
            new Response(JSON.stringify({
                subscriber: {
                    entitlements: {
                        active: {
                            pro: {},
                        },
                    },
                    subscriptions: {},
                },
            }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            })
        );
        vi.stubGlobal("fetch", fetchMock as typeof fetch);

        const entitled = await hasEntitlement("user-1", "pro");

        expect(entitled).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
