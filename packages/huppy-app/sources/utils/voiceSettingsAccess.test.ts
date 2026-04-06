import { describe, expect, it } from 'vitest';
import { canConfigureCustomVoiceAgent, shouldUseDirectVoiceConnection } from './voiceSettingsAccess';

describe('voiceSettingsAccess', () => {
    it('hides custom voice agent settings for customer builds', () => {
        expect(canConfigureCustomVoiceAgent({ isDevBuild: false, devModeEnabled: false })).toBe(false);
    });

    it('shows custom voice agent settings in dev builds or developer mode', () => {
        expect(canConfigureCustomVoiceAgent({ isDevBuild: true, devModeEnabled: false })).toBe(true);
        expect(canConfigureCustomVoiceAgent({ isDevBuild: false, devModeEnabled: true })).toBe(true);
    });

    it('only allows direct voice connections when advanced voice settings are enabled', () => {
        expect(shouldUseDirectVoiceConnection({
            isDevBuild: false,
            devModeEnabled: false,
            voiceBypassToken: true,
        })).toBe(false);

        expect(shouldUseDirectVoiceConnection({
            isDevBuild: false,
            devModeEnabled: true,
            voiceBypassToken: true,
        })).toBe(true);
    });
});
