import { afterEach, describe, expect, it, vi } from "vitest";

describe("storage/db", () => {
    afterEach(() => {
        vi.resetModules();
        vi.unstubAllEnvs();
        vi.clearAllMocks();
    });

    it("defers Prisma client creation until the db proxy is used", async () => {
        const prismaCtor = vi.fn().mockImplementation(() => ({
            $connect: vi.fn(async () => undefined),
            $disconnect: vi.fn(async () => undefined),
        }));

        vi.doMock("@prisma/client", () => ({
            PrismaClient: prismaCtor,
        }));
        vi.doMock("@electric-sql/pglite", () => ({
            PGlite: class {},
        }));
        vi.doMock("pglite-prisma-adapter", () => ({
            PrismaPGlite: class {},
        }));

        const mod = await import("./db");

        expect(prismaCtor).not.toHaveBeenCalled();

        await mod.db.$connect();

        expect(prismaCtor).toHaveBeenCalledTimes(1);
    });
});
