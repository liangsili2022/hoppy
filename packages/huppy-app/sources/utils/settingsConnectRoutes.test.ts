import { describe, expect, it } from 'vitest';
import { getSettingsConnectRoute } from './settingsConnectRoutes';

describe('getSettingsConnectRoute', () => {
    it('returns the GitHub connect route', () => {
        expect(getSettingsConnectRoute('github')).toBe('/settings/connect/github');
    });

    it('returns the Claude connect route', () => {
        expect(getSettingsConnectRoute('claude')).toBe('/settings/connect/claude');
    });
});
