import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaywallManager } from './PaywallManager';
import { PaywallResult } from '@/sync/revenueCat/types';

describe('PaywallManager', () => {
    beforeEach(() => {
        PaywallManager.setShowFn(null);
        vi.restoreAllMocks();
    });

    afterEach(() => {
        PaywallManager.setShowFn(null);
        vi.restoreAllMocks();
    });

    it('returns NOT_PRESENTED when the host is unavailable', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(PaywallManager.present()).resolves.toBe(PaywallResult.NOT_PRESENTED);
        expect(warn).toHaveBeenCalledWith('PaywallHost not initialized. Make sure the host is mounted.');
    });

    it('resolves with the result returned by the host', async () => {
        let resolvePaywall: ((result: PaywallResult) => void) | null = null;
        PaywallManager.setShowFn((resolve) => {
            resolvePaywall = resolve;
        });

        const promise = PaywallManager.present();
        expect(resolvePaywall).not.toBeNull();

        const resolver = resolvePaywall as unknown as (result: PaywallResult) => void;
        if (typeof resolver !== 'function') {
            throw new Error('Expected paywall resolver to be set');
        }

        resolver(PaywallResult.PURCHASED);

        await expect(promise).resolves.toBe(PaywallResult.PURCHASED);
    });

    it('reuses the same promise while a paywall is already active', async () => {
        let resolvePaywall: ((result: PaywallResult) => void) | null = null;
        PaywallManager.setShowFn((resolve) => {
            resolvePaywall = resolve;
        });

        const first = PaywallManager.present();
        const second = PaywallManager.present();

        expect(second).toBe(first);

        const resolver = resolvePaywall as unknown as (result: PaywallResult) => void;
        if (typeof resolver !== 'function') {
            throw new Error('Expected paywall resolver to be set');
        }

        resolver(PaywallResult.RESTORED);

        await expect(first).resolves.toBe(PaywallResult.RESTORED);
        await expect(second).resolves.toBe(PaywallResult.RESTORED);
    });

    it('resolves NOT_PRESENTED if the host disappears before finishing', async () => {
        PaywallManager.setShowFn(() => {});

        const promise = PaywallManager.present();
        PaywallManager.setShowFn(null);

        await expect(promise).resolves.toBe(PaywallResult.NOT_PRESENTED);
    });
});
