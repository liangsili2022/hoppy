import { describe, expect, it } from 'vitest';
import {
    buildTerminalAuthUrl,
    extractTerminalAuthPublicKeyTail,
    isTerminalAuthUrl,
} from './terminalAuthUrl';

describe('terminalAuthUrl', () => {
    it('extracts the terminal auth key tail from happy scheme urls', () => {
        expect(extractTerminalAuthPublicKeyTail('happy://terminal?abc123')).toBe('abc123');
    });

    it('extracts the terminal auth key tail from huppy scheme urls', () => {
        expect(extractTerminalAuthPublicKeyTail('huppy://terminal?abc123')).toBe('abc123');
    });

    it('rejects non-terminal auth urls', () => {
        expect(extractTerminalAuthPublicKeyTail('huppy://settings')).toBeNull();
        expect(isTerminalAuthUrl('https://app.huppy.ai')).toBe(false);
    });

    it('builds huppy urls by default', () => {
        expect(buildTerminalAuthUrl('abc123')).toBe('huppy://terminal?abc123');
    });

    it('can build happy urls for legacy compatibility', () => {
        expect(buildTerminalAuthUrl('abc123', 'happy')).toBe('happy://terminal?abc123');
    });
});
