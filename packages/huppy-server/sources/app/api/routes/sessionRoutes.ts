import { eventRouter, buildNewSessionUpdate } from "@/app/events/eventRouter";
import { type Fastify } from "../types";
import { db } from "@/storage/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { log } from "@/utils/log";
import { randomKeyNaked } from "@/utils/randomKeyNaked";
import { allocateUserSeq } from "@/storage/seq";
import { sessionDelete } from "@/app/session/sessionDelete";
import {
    decodeDataEncryptionKeyForPayload,
    decodeDataEncryptionKeyForStorage,
    encodeDataEncryptionKeyForResponse,
    loadPGliteDataEncryptionKeys,
    persistPGliteDataEncryptionKey,
    usesPGliteDataEncryptionKeyWorkaround,
} from "@/storage/pgliteDataEncryptionKeys";

type SessionRow = {
    id: string;
    seq: number;
    createdAt: Date;
    updatedAt: Date;
    metadata: string;
    metadataVersion: number;
    agentState: string | null;
    agentStateVersion: number;
    active: boolean;
    lastActiveAt: Date;
    dataEncryptionKey?: Uint8Array | null;
};

export function sessionRoutes(app: Fastify) {

    // Sessions API
    app.get('/v1/sessions', {
        preHandler: app.authenticate,
    }, async (request, reply) => {
        const userId = request.userId;

        const includeDataEncryptionKey = !usesPGliteDataEncryptionKeyWorkaround();
        const sessions = await db.session.findMany({
            where: { accountId: userId },
            orderBy: { updatedAt: 'desc' },
            take: 150,
            select: includeDataEncryptionKey
                ? {
                    id: true,
                    seq: true,
                    createdAt: true,
                    updatedAt: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    dataEncryptionKey: true,
                    active: true,
                    lastActiveAt: true,
                }
                : {
                    id: true,
                    seq: true,
                    createdAt: true,
                    updatedAt: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    active: true,
                    lastActiveAt: true,
                }
        }) as SessionRow[];
        const pgliteKeys = await loadPGliteDataEncryptionKeys("Session", sessions.map((session) => session.id));

        return reply.send({
            sessions: sessions.map((v) => {
                // const lastMessage = v.messages[0];
                const sessionUpdatedAt = v.updatedAt.getTime();
                // const lastMessageCreatedAt = lastMessage ? lastMessage.createdAt.getTime() : 0;

                return {
                    id: v.id,
                    seq: v.seq,
                    createdAt: v.createdAt.getTime(),
                    updatedAt: sessionUpdatedAt,
                    active: v.active,
                    activeAt: v.lastActiveAt.getTime(),
                    metadata: v.metadata,
                    metadataVersion: v.metadataVersion,
                    agentState: v.agentState,
                    agentStateVersion: v.agentStateVersion,
                    dataEncryptionKey: usesPGliteDataEncryptionKeyWorkaround()
                        ? (pgliteKeys.get(v.id) ?? null)
                        : encodeDataEncryptionKeyForResponse(v.dataEncryptionKey),
                    lastMessage: null
                };
            })
        });
    });

    // V2 Sessions API - Active sessions only
    app.get('/v2/sessions/active', {
        preHandler: app.authenticate,
        schema: {
            querystring: z.object({
                limit: z.coerce.number().int().min(1).max(500).default(150)
            }).optional()
        }
    }, async (request, reply) => {
        const userId = request.userId;
        const limit = request.query?.limit || 150;

        const includeDataEncryptionKey = !usesPGliteDataEncryptionKeyWorkaround();
        const sessions = await db.session.findMany({
            where: {
                accountId: userId,
                active: true,
                lastActiveAt: { gt: new Date(Date.now() - 1000 * 60 * 15) /* 15 minutes */ }
            },
            orderBy: { lastActiveAt: 'desc' },
            take: limit,
            select: includeDataEncryptionKey
                ? {
                    id: true,
                    seq: true,
                    createdAt: true,
                    updatedAt: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    dataEncryptionKey: true,
                    active: true,
                    lastActiveAt: true,
                }
                : {
                    id: true,
                    seq: true,
                    createdAt: true,
                    updatedAt: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    active: true,
                    lastActiveAt: true,
                }
        }) as SessionRow[];
        const pgliteKeys = await loadPGliteDataEncryptionKeys("Session", sessions.map((session) => session.id));

        return reply.send({
            sessions: sessions.map((v) => ({
                id: v.id,
                seq: v.seq,
                createdAt: v.createdAt.getTime(),
                updatedAt: v.updatedAt.getTime(),
                active: v.active,
                activeAt: v.lastActiveAt.getTime(),
                metadata: v.metadata,
                metadataVersion: v.metadataVersion,
                agentState: v.agentState,
                agentStateVersion: v.agentStateVersion,
                dataEncryptionKey: usesPGliteDataEncryptionKeyWorkaround()
                    ? (pgliteKeys.get(v.id) ?? null)
                    : encodeDataEncryptionKeyForResponse(v.dataEncryptionKey),
            }))
        });
    });

    // V2 Sessions API - Cursor-based pagination with change tracking
    app.get('/v2/sessions', {
        preHandler: app.authenticate,
        schema: {
            querystring: z.object({
                cursor: z.string().optional(),
                limit: z.coerce.number().int().min(1).max(200).default(50),
                changedSince: z.coerce.number().int().positive().optional()
            }).optional()
        }
    }, async (request, reply) => {
        const userId = request.userId;
        const { cursor, limit = 50, changedSince } = request.query || {};

        // Decode cursor - simple ID-based cursor
        let cursorSessionId: string | undefined;
        if (cursor) {
            if (cursor.startsWith('cursor_v1_')) {
                cursorSessionId = cursor.substring(10);
            } else {
                return reply.code(400).send({ error: 'Invalid cursor format' });
            }
        }

        // Build where clause
        const where: Prisma.SessionWhereInput = { accountId: userId };

        // Add changedSince filter (just a filter, doesn't affect pagination)
        if (changedSince) {
            where.updatedAt = {
                gt: new Date(changedSince)
            };
        }

        // Add cursor pagination - always by ID descending (most recent first)
        if (cursorSessionId) {
            where.id = {
                lt: cursorSessionId  // Get sessions with ID less than cursor (for desc order)
            };
        }

        // Always sort by ID descending for consistent pagination
        const orderBy = { id: 'desc' as const };

        const includeDataEncryptionKey = !usesPGliteDataEncryptionKeyWorkaround();
        const sessions = await db.session.findMany({
            where,
            orderBy,
            take: limit + 1, // Fetch one extra to determine if there are more
            select: includeDataEncryptionKey
                ? {
                    id: true,
                    seq: true,
                    createdAt: true,
                    updatedAt: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    dataEncryptionKey: true,
                    active: true,
                    lastActiveAt: true,
                }
                : {
                    id: true,
                    seq: true,
                    createdAt: true,
                    updatedAt: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    active: true,
                    lastActiveAt: true,
                }
        }) as SessionRow[];

        // Check if there are more results
        const hasNext = sessions.length > limit;
        const resultSessions = hasNext ? sessions.slice(0, limit) : sessions;
        const pgliteKeys = await loadPGliteDataEncryptionKeys("Session", resultSessions.map((session) => session.id));

        // Generate next cursor - simple ID-based cursor
        let nextCursor: string | null = null;
        if (hasNext && resultSessions.length > 0) {
            const lastSession = resultSessions[resultSessions.length - 1];
            nextCursor = `cursor_v1_${lastSession.id}`;
        }

        return reply.send({
            sessions: resultSessions.map((v) => ({
                id: v.id,
                seq: v.seq,
                createdAt: v.createdAt.getTime(),
                updatedAt: v.updatedAt.getTime(),
                active: v.active,
                activeAt: v.lastActiveAt.getTime(),
                metadata: v.metadata,
                metadataVersion: v.metadataVersion,
                agentState: v.agentState,
                agentStateVersion: v.agentStateVersion,
                dataEncryptionKey: usesPGliteDataEncryptionKeyWorkaround()
                    ? (pgliteKeys.get(v.id) ?? null)
                    : encodeDataEncryptionKeyForResponse(v.dataEncryptionKey),
            })),
            nextCursor,
            hasNext
        });
    });

    // Create or load session by tag
    app.post('/v1/sessions', {
        schema: {
            body: z.object({
                tag: z.string(),
                metadata: z.string(),
                agentState: z.string().nullish(),
                dataEncryptionKey: z.string().nullish()
            })
        },
        preHandler: app.authenticate
    }, async (request, reply) => {
        const userId = request.userId;
        const { tag, metadata, dataEncryptionKey } = request.body;
        const includeDataEncryptionKey = !usesPGliteDataEncryptionKeyWorkaround();

        const session = await db.session.findFirst({
            where: {
                accountId: userId,
                tag: tag
            },
            select: includeDataEncryptionKey
                ? {
                    id: true,
                    seq: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    dataEncryptionKey: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
                : {
                    id: true,
                    seq: true,
                    metadata: true,
                    metadataVersion: true,
                    agentState: true,
                    agentStateVersion: true,
                    active: true,
                    lastActiveAt: true,
                    createdAt: true,
                    updatedAt: true,
                }
        }) as SessionRow | null;
        if (session) {
            let responseDataEncryptionKey = usesPGliteDataEncryptionKeyWorkaround()
                ? (await loadPGliteDataEncryptionKeys("Session", [session.id])).get(session.id) ?? null
                : encodeDataEncryptionKeyForResponse(session.dataEncryptionKey);
            if (!responseDataEncryptionKey && dataEncryptionKey) {
                await persistPGliteDataEncryptionKey("Session", session.id, dataEncryptionKey);
                responseDataEncryptionKey = dataEncryptionKey;
            }
            log({ module: 'session-create', sessionId: session.id, userId, tag }, `Found existing session: ${session.id} for tag ${tag}`);
            return reply.send({
                session: {
                    id: session.id,
                    seq: session.seq,
                    metadata: session.metadata,
                    metadataVersion: session.metadataVersion,
                    agentState: session.agentState,
                    agentStateVersion: session.agentStateVersion,
                    dataEncryptionKey: responseDataEncryptionKey,
                    active: session.active,
                    activeAt: session.lastActiveAt.getTime(),
                    createdAt: session.createdAt.getTime(),
                    updatedAt: session.updatedAt.getTime(),
                    lastMessage: null
                }
            });
        } else {

            // Resolve seq
            const updSeq = await allocateUserSeq(userId);

            // Create session
            log({ module: 'session-create', userId, tag }, `Creating new session for user ${userId} with tag ${tag}`);
            const session = await db.session.create({
                data: {
                    accountId: userId,
                    tag: tag,
                    metadata: metadata,
                    dataEncryptionKey: decodeDataEncryptionKeyForStorage(dataEncryptionKey)
                }
            });
            await persistPGliteDataEncryptionKey("Session", session.id, dataEncryptionKey);
            const responseDataEncryptionKey = usesPGliteDataEncryptionKeyWorkaround()
                ? (dataEncryptionKey ?? null)
                : encodeDataEncryptionKeyForResponse(session.dataEncryptionKey);
            log({ module: 'session-create', sessionId: session.id, userId }, `Session created: ${session.id}`);

            // Emit new session update
            const updatePayload = buildNewSessionUpdate({
                ...session,
                dataEncryptionKey: usesPGliteDataEncryptionKeyWorkaround()
                    ? decodeDataEncryptionKeyForPayload(responseDataEncryptionKey)
                    : (session.dataEncryptionKey ?? null),
            }, updSeq, randomKeyNaked(12));
            log({
                module: 'session-create',
                userId,
                sessionId: session.id,
                updateType: 'new-session',
                updatePayload: JSON.stringify(updatePayload)
            }, `Emitting new-session update to user-scoped connections`);
            eventRouter.emitUpdate({
                userId,
                payload: updatePayload,
                recipientFilter: { type: 'user-scoped-only' }
            });

            return reply.send({
                session: {
                    id: session.id,
                    seq: session.seq,
                    metadata: session.metadata,
                    metadataVersion: session.metadataVersion,
                    agentState: session.agentState,
                    agentStateVersion: session.agentStateVersion,
                    dataEncryptionKey: responseDataEncryptionKey,
                    active: session.active,
                    activeAt: session.lastActiveAt.getTime(),
                    createdAt: session.createdAt.getTime(),
                    updatedAt: session.updatedAt.getTime(),
                    lastMessage: null
                }
            });
        }
    });

    app.get('/v1/sessions/:sessionId/messages', {
        schema: {
            params: z.object({
                sessionId: z.string()
            })
        },
        preHandler: app.authenticate
    }, async (request, reply) => {
        const userId = request.userId;
        const { sessionId } = request.params;

        // Verify session belongs to user
        const session = await db.session.findFirst({
            where: {
                id: sessionId,
                accountId: userId
            },
            select: { id: true }
        });

        if (!session) {
            return reply.code(404).send({ error: 'Session not found' });
        }

        const messages = await db.sessionMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            take: 150,
            select: {
                id: true,
                seq: true,
                localId: true,
                content: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return reply.send({
            messages: messages.map((v) => ({
                id: v.id,
                seq: v.seq,
                content: v.content,
                localId: v.localId,
                createdAt: v.createdAt.getTime(),
                updatedAt: v.updatedAt.getTime()
            }))
        });
    });

    // Delete session
    app.delete('/v1/sessions/:sessionId', {
        schema: {
            params: z.object({
                sessionId: z.string()
            })
        },
        preHandler: app.authenticate
    }, async (request, reply) => {
        const userId = request.userId;
        const { sessionId } = request.params;

        const deleted = await sessionDelete({ uid: userId }, sessionId);

        if (!deleted) {
            return reply.code(404).send({ error: 'Session not found or not owned by user' });
        }

        return reply.send({ success: true });
    });
}
