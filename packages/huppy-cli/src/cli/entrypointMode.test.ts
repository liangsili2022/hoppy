import { describe, expect, it } from 'vitest';
import { resolveEntrypointMode } from './entrypointMode';

describe('resolveEntrypointMode', () => {
    it('returns help when help is requested', () => {
        expect(resolveEntrypointMode({ showHelp: true, showVersion: false })).toBe('help');
    });

    it('returns version when only version is requested', () => {
        expect(resolveEntrypointMode({ showHelp: false, showVersion: true })).toBe('version');
    });

    it('prefers help over version when both flags are present', () => {
        expect(resolveEntrypointMode({ showHelp: true, showVersion: true })).toBe('help');
    });

    it('returns start when no early-exit flags are present', () => {
        expect(resolveEntrypointMode({ showHelp: false, showVersion: false })).toBe('start');
    });
});
