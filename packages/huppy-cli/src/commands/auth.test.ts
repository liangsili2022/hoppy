import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleAuthCommand } from './auth';

describe('handleAuthCommand', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows huppy auth help with top-level aliases', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await handleAuthCommand(['help']);

        const output = logSpy.mock.calls.flat().join('\n');
        expect(output).toContain('huppy auth');
        expect(output).toContain('huppy login [--force]');
        expect(output).toContain('huppy logout');
        expect(output).toContain('huppy status');
    });
});
