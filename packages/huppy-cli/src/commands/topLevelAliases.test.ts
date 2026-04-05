import { describe, expect, it } from 'vitest';
import { normalizeTopLevelCommandAliases } from './topLevelAliases';

describe('normalizeTopLevelCommandAliases', () => {
    it('maps top-level auth aliases to auth subcommands', () => {
        expect(normalizeTopLevelCommandAliases(['login'])).toEqual(['auth', 'login']);
        expect(normalizeTopLevelCommandAliases(['logout'])).toEqual(['auth', 'logout']);
        expect(normalizeTopLevelCommandAliases(['status'])).toEqual(['auth', 'status']);
    });

    it('preserves additional arguments for aliased commands', () => {
        expect(normalizeTopLevelCommandAliases(['login', '--force'])).toEqual(['auth', 'login', '--force']);
    });

    it('leaves existing auth commands unchanged', () => {
        expect(normalizeTopLevelCommandAliases(['auth', 'login'])).toEqual(['auth', 'login']);
    });

    it('leaves unrelated commands unchanged', () => {
        expect(normalizeTopLevelCommandAliases(['doctor', 'clean'])).toEqual(['doctor', 'clean']);
    });
});
