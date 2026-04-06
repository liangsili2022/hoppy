import { describe, expect, it } from 'vitest';
import { buildTerminalAuthUrl } from './terminalAuthUrl.js';

describe('buildTerminalAuthUrl', () => {
    it('builds terminal auth urls with the huppy scheme', () => {
        expect(buildTerminalAuthUrl('abc123')).toBe('huppy://terminal?abc123');
    });
});
