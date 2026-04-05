import { describe, expect, it } from 'vitest';
import type { Message } from '@/sync/typesMessage';
import type { NormalizedMessage } from '@/sync/typesRaw';
import { getApprovedModeForTool, resolvePlanModeTransition } from './planMode';

describe('planMode', () => {
    it('treats exit plan approvals as a return to default mode', () => {
        expect(getApprovedModeForTool('ExitPlanMode')).toBe('default');
        expect(getApprovedModeForTool('exit_plan_mode')).toBe('default');
        expect(getApprovedModeForTool('Edit')).toBeUndefined();
    });

    it('switches into plan mode when EnterPlanMode arrives', () => {
        const incomingMessages: NormalizedMessage[] = [
            {
                id: 'msg-enter-plan',
                localId: null,
                createdAt: 1,
                isSidechain: false,
                role: 'agent',
                content: [
                    {
                        type: 'tool-call',
                        id: 'tool-enter-plan',
                        name: 'EnterPlanMode',
                        input: {},
                        description: null,
                        uuid: 'tool-enter-plan',
                        parentUUID: null,
                    },
                ],
            },
        ];

        expect(resolvePlanModeTransition(incomingMessages, [])).toBe('plan');
    });

    it('switches back to default only after exit plan approval is approved', () => {
        const processedMessages: Message[] = [
            {
                kind: 'tool-call',
                id: 'tool-exit-plan',
                localId: null,
                createdAt: 2,
                children: [],
                tool: {
                    name: 'ExitPlanMode',
                    state: 'running',
                    input: { plan: 'Ship it' },
                    createdAt: 2,
                    startedAt: null,
                    completedAt: null,
                    description: null,
                    permission: {
                        id: 'tool-exit-plan',
                        status: 'approved',
                    },
                },
            },
        ];

        expect(resolvePlanModeTransition([], processedMessages)).toBe('default');
    });

    it('keeps plan mode active while exit plan approval is still pending', () => {
        const processedMessages: Message[] = [
            {
                kind: 'tool-call',
                id: 'tool-exit-plan',
                localId: null,
                createdAt: 2,
                children: [],
                tool: {
                    name: 'ExitPlanMode',
                    state: 'running',
                    input: { plan: 'Ship it' },
                    createdAt: 2,
                    startedAt: null,
                    completedAt: null,
                    description: null,
                    permission: {
                        id: 'tool-exit-plan',
                        status: 'pending',
                    },
                },
            },
        ];

        expect(resolvePlanModeTransition([], processedMessages)).toBeNull();
    });
});
