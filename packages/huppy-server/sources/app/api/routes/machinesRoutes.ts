import { eventRouter } from "@/app/events/eventRouter";
import { Fastify } from "../types";
import { z } from "zod";
import { db } from "@/storage/db";
import { log } from "@/utils/log";
import { randomKeyNaked } from "@/utils/randomKeyNaked";
import { allocateUserSeq } from "@/storage/seq";
import { buildNewMachineUpdate, buildUpdateMachineUpdate } from "@/app/events/eventRouter";
import {
    decodeDataEncryptionKeyForPayload,
    decodeDataEncryptionKeyForStorage,
    encodeDataEncryptionKeyForResponse,
    loadPGliteDataEncryptionKeys,
    persistPGliteDataEncryptionKey,
    usesPGliteDataEncryptionKeyWorkaround,
} from "@/storage/pgliteDataEncryptionKeys";

type MachineRow = {
    id: string;
    metadata: string;
    metadataVersion: number;
    daemonState: string | null;
    daemonStateVersion: number;
    seq: number;
    active: boolean;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
    dataEncryptionKey?: Uint8Array | null;
};

export function machinesRoutes(app: Fastify) {
    app.post('/v1/machines', {
        preHandler: app.authenticate,
        schema: {
            body: z.object({
                id: z.string(),
                metadata: z.string(), // Encrypted metadata
                daemonState: z.string().optional(), // Encrypted daemon state
                dataEncryptionKey: z.string().nullish()
            })
        }
    }, async (request, reply) => {
        const userId = request.userId;
        const { id, metadata, daemonState, dataEncryptionKey } = request.body;
        const includeDataEncryptionKey = !usesPGliteDataEncryptionKeyWorkaround();

        // Check if machine exists (like sessions do)
        const machine = await db.machine.findFirst({
            where: {
                accountId: userId,
                id: id
            },
            select: includeDataEncryptionKey
                ? {
                    id: true,
                    metadata: true,
                    metadataVersion: true,
                    daemonState: true,
                    daemonStateVersion: true,
                    dataEncryptionKey: true,
                    seq: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
                : {
                    id: true,
                    metadata: true,
                    metadataVersion: true,
                    daemonState: true,
                    daemonStateVersion: true,
                    seq: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
        }) as MachineRow | null;

        if (machine) {
            let responseDataEncryptionKey = usesPGliteDataEncryptionKeyWorkaround()
                ? (await loadPGliteDataEncryptionKeys("Machine", [machine.id])).get(machine.id) ?? null
                : encodeDataEncryptionKeyForResponse(machine.dataEncryptionKey);
            if (!responseDataEncryptionKey && dataEncryptionKey) {
                await persistPGliteDataEncryptionKey("Machine", machine.id, dataEncryptionKey);
                responseDataEncryptionKey = dataEncryptionKey;
            }
            // Machine exists - just return it
            log({ module: 'machines', machineId: id, userId }, 'Found existing machine');
            return reply.send({
                machine: {
                    id: machine.id,
                    metadata: machine.metadata,
                    metadataVersion: machine.metadataVersion,
                    daemonState: machine.daemonState,
                    daemonStateVersion: machine.daemonStateVersion,
                    dataEncryptionKey: responseDataEncryptionKey,
                    active: machine.active,
                    activeAt: machine.lastActiveAt.getTime(),  // Return as activeAt for API consistency
                    createdAt: machine.createdAt.getTime(),
                    updatedAt: machine.updatedAt.getTime()
                }
            });
        } else {
            // Create new machine
            log({ module: 'machines', machineId: id, userId }, 'Creating new machine');

            const newMachine = await db.machine.create({
                data: {
                    id,
                    accountId: userId,
                    metadata,
                    metadataVersion: 1,
                    daemonState: daemonState || null,
                    daemonStateVersion: daemonState ? 1 : 0,
                    dataEncryptionKey: decodeDataEncryptionKeyForStorage(dataEncryptionKey),
                    // Default to offline - in case the user does not start daemon
                    active: false,
                    // lastActiveAt and activeAt defaults to now() in schema
                }
            });
            await persistPGliteDataEncryptionKey("Machine", newMachine.id, dataEncryptionKey);
            const responseDataEncryptionKey = usesPGliteDataEncryptionKeyWorkaround()
                ? (dataEncryptionKey ?? null)
                : encodeDataEncryptionKeyForResponse(newMachine.dataEncryptionKey);

            // Emit both new-machine and update-machine events for backward compatibility
            const updSeq1 = await allocateUserSeq(userId);
            const updSeq2 = await allocateUserSeq(userId);
            
            // Emit new-machine event with all data including dataEncryptionKey
            const newMachinePayload = buildNewMachineUpdate({
                ...newMachine,
                dataEncryptionKey: usesPGliteDataEncryptionKeyWorkaround()
                    ? decodeDataEncryptionKeyForPayload(responseDataEncryptionKey)
                    : (newMachine.dataEncryptionKey ?? null),
            }, updSeq1, randomKeyNaked(12));
            eventRouter.emitUpdate({
                userId,
                payload: newMachinePayload,
                recipientFilter: { type: 'user-scoped-only' }
            });

            // Emit update-machine event for backward compatibility (without dataEncryptionKey)
            const machineMetadata = {
                version: 1,
                value: metadata
            };
            const updatePayload = buildUpdateMachineUpdate(newMachine.id, updSeq2, randomKeyNaked(12), machineMetadata);
            eventRouter.emitUpdate({
                userId,
                payload: updatePayload,
                recipientFilter: { type: 'machine-scoped-only', machineId: newMachine.id }
            });

            return reply.send({
                machine: {
                    id: newMachine.id,
                    metadata: newMachine.metadata,
                    metadataVersion: newMachine.metadataVersion,
                    daemonState: newMachine.daemonState,
                    daemonStateVersion: newMachine.daemonStateVersion,
                    dataEncryptionKey: responseDataEncryptionKey,
                    active: newMachine.active,
                    activeAt: newMachine.lastActiveAt.getTime(),  // Return as activeAt for API consistency
                    createdAt: newMachine.createdAt.getTime(),
                    updatedAt: newMachine.updatedAt.getTime()
                }
            });
        }
    });


    // Machines API
    app.get('/v1/machines', {
        preHandler: app.authenticate,
    }, async (request, reply) => {
        const userId = request.userId;
        const includeDataEncryptionKey = !usesPGliteDataEncryptionKeyWorkaround();

        const machines = await db.machine.findMany({
            where: { accountId: userId },
            orderBy: { lastActiveAt: 'desc' },
            select: includeDataEncryptionKey
                ? {
                    id: true,
                    metadata: true,
                    metadataVersion: true,
                    daemonState: true,
                    daemonStateVersion: true,
                    dataEncryptionKey: true,
                    seq: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
                : {
                    id: true,
                    metadata: true,
                    metadataVersion: true,
                    daemonState: true,
                    daemonStateVersion: true,
                    seq: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
        }) as MachineRow[];
        const pgliteKeys = await loadPGliteDataEncryptionKeys("Machine", machines.map((machine) => machine.id));

        return machines.map(m => ({
            id: m.id,
            metadata: m.metadata,
            metadataVersion: m.metadataVersion,
            daemonState: m.daemonState,
            daemonStateVersion: m.daemonStateVersion,
            dataEncryptionKey: usesPGliteDataEncryptionKeyWorkaround()
                ? (pgliteKeys.get(m.id) ?? null)
                : encodeDataEncryptionKeyForResponse(m.dataEncryptionKey),
            seq: m.seq,
            active: m.active,
            activeAt: m.lastActiveAt.getTime(),
            createdAt: m.createdAt.getTime(),
            updatedAt: m.updatedAt.getTime()
        }));
    });

    // GET /v1/machines/:id - Get single machine by ID
    app.get('/v1/machines/:id', {
        preHandler: app.authenticate,
        schema: {
            params: z.object({
                id: z.string()
            })
        }
    }, async (request, reply) => {
        const userId = request.userId;
        const { id } = request.params;
        const includeDataEncryptionKey = !usesPGliteDataEncryptionKeyWorkaround();

        const machine = await db.machine.findFirst({
            where: {
                accountId: userId,
                id: id
            },
            select: includeDataEncryptionKey
                ? {
                    id: true,
                    metadata: true,
                    metadataVersion: true,
                    daemonState: true,
                    daemonStateVersion: true,
                    dataEncryptionKey: true,
                    seq: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
                : {
                    id: true,
                    metadata: true,
                    metadataVersion: true,
                    daemonState: true,
                    daemonStateVersion: true,
                    seq: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
        }) as MachineRow | null;

        if (!machine) {
            return reply.code(404).send({ error: 'Machine not found' });
        }

        const responseDataEncryptionKey = usesPGliteDataEncryptionKeyWorkaround()
            ? (await loadPGliteDataEncryptionKeys("Machine", [machine.id])).get(machine.id) ?? null
            : encodeDataEncryptionKeyForResponse(machine.dataEncryptionKey);

        return {
            machine: {
                id: machine.id,
                metadata: machine.metadata,
                metadataVersion: machine.metadataVersion,
                daemonState: machine.daemonState,
                daemonStateVersion: machine.daemonStateVersion,
                dataEncryptionKey: responseDataEncryptionKey,
                seq: machine.seq,
                active: machine.active,
                activeAt: machine.lastActiveAt.getTime(),
                createdAt: machine.createdAt.getTime(),
                updatedAt: machine.updatedAt.getTime()
            }
        };
    });

}
