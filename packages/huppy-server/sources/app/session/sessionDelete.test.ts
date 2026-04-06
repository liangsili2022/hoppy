import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    tx,
    inTxMock,
    afterTxMock,
    emitUpdateMock,
    allocateUserSeqMock,
} = vi.hoisted(() => {
    const tx = {
        session: {
            findFirst: vi.fn(async () => ({ id: "session-1" })),
            delete: vi.fn(async () => ({ id: "session-1" })),
            deleteMany: vi.fn(async () => ({ count: 1 })),
        },
        sessionMessage: {
            deleteMany: vi.fn(async () => ({ count: 0 })),
        },
        usageReport: {
            deleteMany: vi.fn(async () => ({ count: 0 })),
        },
        accessKey: {
            deleteMany: vi.fn(async () => ({ count: 0 })),
        },
    };

    return {
        tx,
        inTxMock: vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(tx)),
        afterTxMock: vi.fn(),
        emitUpdateMock: vi.fn(),
        allocateUserSeqMock: vi.fn(async () => 1),
    };
});

vi.mock("@/storage/inTx", () => ({
    inTx: inTxMock,
    afterTx: afterTxMock,
}));

vi.mock("@/app/events/eventRouter", () => ({
    eventRouter: {
        emitUpdate: emitUpdateMock,
    },
    buildDeleteSessionUpdate: vi.fn(() => ({ type: "delete-session" })),
}));

vi.mock("@/storage/seq", () => ({
    allocateUserSeq: allocateUserSeqMock,
}));

vi.mock("@/utils/randomKeyNaked", () => ({
    randomKeyNaked: vi.fn(() => "update-key"),
}));

vi.mock("@/utils/log", () => ({
    log: vi.fn(),
}));

import { sessionDelete } from "./sessionDelete";

describe("sessionDelete", () => {
    beforeEach(() => {
        inTxMock.mockClear();
        afterTxMock.mockClear();
        emitUpdateMock.mockClear();
        allocateUserSeqMock.mockClear();
        tx.session.findFirst.mockClear();
        tx.session.delete.mockClear();
        tx.session.deleteMany.mockClear();
        tx.sessionMessage.deleteMany.mockClear();
        tx.usageReport.deleteMany.mockClear();
        tx.accessKey.deleteMany.mockClear();
    });

    it("uses a pglite-safe session lookup and delete path", async () => {
        const result = await sessionDelete({ uid: "user-1" } as any, "session-1");

        expect(result).toBe(true);
        expect(tx.session.findFirst).toHaveBeenCalledWith({
            where: {
                id: "session-1",
                accountId: "user-1",
            },
            select: { id: true },
        });
        expect(tx.session.deleteMany).toHaveBeenCalledWith({
            where: { id: "session-1" },
        });
        expect(tx.session.delete).not.toHaveBeenCalled();
    });
});
