import { describe, expect, it } from 'vitest';
import { parseMessageAsEvent } from './messageToEvent';
import type { NormalizedMessage } from '../typesRaw';

describe('parseMessageAsEvent', () => {
    it('does not surface internal change_title tool calls as visible events', () => {
        const message: NormalizedMessage = {
            id: 'msg-1',
            localId: null,
            createdAt: 1000,
            role: 'agent',
            isSidechain: false,
            content: [{
                type: 'tool-call',
                id: 'tool-1',
                name: 'mcp__happy__change_title',
                input: {
                    title: '企业微信日程管理'
                },
                description: null,
                uuid: 'tool-uuid-1',
                parentUUID: null
            }]
        };

        expect(parseMessageAsEvent(message)).toBeNull();
    });
});
