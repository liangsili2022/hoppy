import { describe, expect, it, vi } from "vitest";
import { connectDatabaseForStartup } from "./databaseStartup";

describe("connectDatabaseForStartup", () => {
    it("falls back to degraded mode when the database connect fails", async () => {
        const db = {
            $connect: vi.fn(async () => {
                throw new Error("db down");
            }),
            $disconnect: vi.fn(async () => undefined),
        };
        const onShutdown = vi.fn();
        const log = vi.fn();

        const connected = await connectDatabaseForStartup({
            db: db as any,
            onShutdown,
            log,
        });

        expect(connected).toBe(false);
        expect(onShutdown).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalled();
    });

    it("registers a disconnect hook when the database connect succeeds", async () => {
        const db = {
            $connect: vi.fn(async () => undefined),
            $disconnect: vi.fn(async () => undefined),
        };
        const onShutdown = vi.fn();
        const log = vi.fn();

        const connected = await connectDatabaseForStartup({
            db: db as any,
            onShutdown,
            log,
        });

        expect(connected).toBe(true);
        expect(db.$connect).toHaveBeenCalledTimes(1);
        expect(onShutdown).toHaveBeenCalledTimes(1);
        expect(log).not.toHaveBeenCalled();
    });
});
