import fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Fastify } from "../types";

const {
    sessionCreateMock,
    sessionFindFirstMock,
    sessionFindManyMock,
    machineCreateMock,
    machineFindFirstMock,
    machineFindManyMock,
    pgliteQueryMock,
    emitUpdateMock,
    allocateUserSeqMock,
} = vi.hoisted(() => {
    const sessionFindFirstMock = vi.fn(async () => null);
    const sessionFindManyMock = vi.fn(async () => []);
    const sessionCreateMock = vi.fn(async (args: any) => {
        const now = new Date("2026-04-04T00:00:00.000Z");
        return {
            id: "session-1",
            seq: 0,
            metadata: args.data.metadata,
            metadataVersion: 0,
            agentState: null,
            agentStateVersion: 0,
            dataEncryptionKey: args.data.dataEncryptionKey ?? null,
            active: false,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
        };
    });

    const machineFindFirstMock = vi.fn(async () => null);
    const machineFindManyMock = vi.fn(async () => []);
    const machineCreateMock = vi.fn(async (args: any) => {
        const now = new Date("2026-04-04T00:00:00.000Z");
        return {
            id: args.data.id,
            metadata: args.data.metadata,
            metadataVersion: 1,
            daemonState: args.data.daemonState ?? null,
            daemonStateVersion: args.data.daemonStateVersion ?? 0,
            dataEncryptionKey: args.data.dataEncryptionKey ?? null,
            active: false,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
        };
    });

    return {
        sessionCreateMock,
        sessionFindFirstMock,
        sessionFindManyMock,
        machineCreateMock,
        machineFindFirstMock,
        machineFindManyMock,
        pgliteQueryMock: vi.fn(async () => ({ rows: [] })),
        emitUpdateMock: vi.fn(),
        allocateUserSeqMock: vi.fn(async () => 1),
    };
});

vi.mock("@/storage/db", () => ({
    db: {
        session: {
            findFirst: sessionFindFirstMock,
            findMany: sessionFindManyMock,
            create: sessionCreateMock,
        },
        machine: {
            findFirst: machineFindFirstMock,
            findMany: machineFindManyMock,
            create: machineCreateMock,
        },
    },
    getPGlite: () => ({
        query: pgliteQueryMock,
    }),
}));

vi.mock("@/storage/seq", () => ({
    allocateUserSeq: allocateUserSeqMock,
}));

vi.mock("@/utils/randomKeyNaked", () => ({
    randomKeyNaked: vi.fn(() => "update-key"),
}));

vi.mock("@/app/events/eventRouter", () => ({
    eventRouter: {
        emitUpdate: emitUpdateMock,
    },
    buildNewSessionUpdate: vi.fn(() => ({ type: "new-session" })),
    buildNewMachineUpdate: vi.fn(() => ({ type: "new-machine" })),
    buildUpdateMachineUpdate: vi.fn(() => ({ type: "update-machine" })),
}));

vi.mock("@/app/session/sessionDelete", () => ({
    sessionDelete: vi.fn(),
}));

import { sessionRoutes } from "./sessionRoutes";
import { machinesRoutes } from "./machinesRoutes";

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

    sessionRoutes(typed);
    machinesRoutes(typed);
    await typed.ready();
    return typed;
}

describe("dataEncryptionKey route handling", () => {
    let app: Fastify;

    beforeEach(() => {
        vi.stubEnv("DB_PROVIDER", "pglite");
        sessionCreateMock.mockClear();
        sessionFindFirstMock.mockClear();
        machineCreateMock.mockClear();
        machineFindFirstMock.mockClear();
        sessionFindManyMock.mockClear();
        machineFindManyMock.mockClear();
        pgliteQueryMock.mockClear();
        emitUpdateMock.mockClear();
        allocateUserSeqMock.mockClear();
    });

    afterEach(async () => {
        vi.unstubAllEnvs();
        if (app) {
            await app.close();
        }
    });

    it("persists a session data encryption key through the pglite raw SQL path", async () => {
        app = await createApp();

        const response = await app.inject({
            method: "POST",
            url: "/v1/sessions",
            headers: { "x-user-id": "user-1" },
            payload: {
                tag: "session-tag",
                metadata: "encrypted-metadata",
                agentState: null,
                dataEncryptionKey: "AQID",
            },
        });

        expect(response.statusCode).toBe(200);
        expect(sessionCreateMock).toHaveBeenCalledTimes(1);
        expect(sessionCreateMock.mock.calls[0][0].data.dataEncryptionKey).toBeUndefined();
        expect(pgliteQueryMock).toHaveBeenCalledWith(
            'UPDATE "Session" SET "dataEncryptionKey" = decode($1, $2) WHERE id = $3',
            ["AQID", "base64", "session-1"],
        );
        expect(response.json().session.dataEncryptionKey).toBe("AQID");
    });

    it("persists a machine data encryption key through the pglite raw SQL path", async () => {
        app = await createApp();

        const response = await app.inject({
            method: "POST",
            url: "/v1/machines",
            headers: { "x-user-id": "user-1" },
            payload: {
                id: "machine-1",
                metadata: "encrypted-metadata",
                daemonState: "encrypted-daemon-state",
                dataEncryptionKey: "AQID",
            },
        });

        expect(response.statusCode).toBe(200);
        expect(machineCreateMock).toHaveBeenCalledTimes(1);
        expect(machineCreateMock.mock.calls[0][0].data.dataEncryptionKey).toBeUndefined();
        expect(pgliteQueryMock).toHaveBeenCalledWith(
            'UPDATE "Machine" SET "dataEncryptionKey" = decode($1, $2) WHERE id = $3',
            ["AQID", "base64", "machine-1"],
        );
        expect(response.json().machine.dataEncryptionKey).toBe("AQID");
    });

    it("returns session data encryption keys from the pglite raw SQL path", async () => {
        app = await createApp();
        const now = new Date("2026-04-04T00:00:00.000Z");
        sessionFindManyMock.mockResolvedValueOnce([
            {
                id: "session-1",
                seq: 7,
                metadata: "encrypted-metadata",
                metadataVersion: 1,
                agentState: null,
                agentStateVersion: 0,
                active: true,
                lastActiveAt: now,
                createdAt: now,
                updatedAt: now,
            },
        ] as any);
        pgliteQueryMock.mockResolvedValueOnce({
            rows: [{ id: "session-1", dataEncryptionKey: "AQID" }],
        } as any);

        const response = await app.inject({
            method: "GET",
            url: "/v1/sessions",
            headers: { "x-user-id": "user-1" },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().sessions[0].dataEncryptionKey).toBe("AQID");
    });

    it("returns machine data encryption keys from the pglite raw SQL path", async () => {
        app = await createApp();
        const now = new Date("2026-04-04T00:00:00.000Z");
        machineFindManyMock.mockResolvedValueOnce([
            {
                id: "machine-1",
                seq: 3,
                metadata: "encrypted-metadata",
                metadataVersion: 1,
                daemonState: null,
                daemonStateVersion: 0,
                active: true,
                lastActiveAt: now,
                createdAt: now,
                updatedAt: now,
            },
        ] as any);
        pgliteQueryMock.mockResolvedValueOnce({
            rows: [{ id: "machine-1", dataEncryptionKey: "AQID" }],
        } as any);

        const response = await app.inject({
            method: "GET",
            url: "/v1/machines",
            headers: { "x-user-id": "user-1" },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()[0].dataEncryptionKey).toBe("AQID");
    });
});
