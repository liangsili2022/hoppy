import { describe, expect, it } from 'vitest';
import { en } from './translations/en';
import { zhHans } from './translations/zh-Hans';
import { zhHant } from './translations/zh-Hant';

describe('settingsVoice translation copy', () => {
    it('clarifies in English that the custom agent ID is optional', () => {
        expect(en.settingsVoice.customAgentId).toBe('Custom ElevenLabs Agent ID');
        expect(en.settingsVoice.customAgentIdNotSet).toBe('Using Huppy default agent');
        expect(en.settingsVoice.customAgentIdDescription).toContain('only if you want to use your own agent');
    });

    it('clarifies in simplified Chinese that the field is optional and defaults to Huppy', () => {
        expect(zhHans.settingsVoice.customAgentId).toBe('自定义 ElevenLabs Agent ID');
        expect(zhHans.settingsVoice.customAgentIdNotSet).toBe('当前使用 Huppy 默认代理');
        expect(zhHans.settingsVoice.customAgentIdDescription).toContain('仅在您要使用自己的 ElevenLabs 代理时填写');
    });

    it('clarifies in traditional Chinese that the field is optional and defaults to Huppy', () => {
        expect(zhHant.settingsVoice.customAgentId).toBe('自訂 ElevenLabs Agent ID');
        expect(zhHant.settingsVoice.customAgentIdNotSet).toBe('目前使用 Huppy 預設代理');
        expect(zhHant.settingsVoice.customAgentIdDescription).toContain('僅在您要使用自己的 ElevenLabs 代理時填寫');
    });
});
