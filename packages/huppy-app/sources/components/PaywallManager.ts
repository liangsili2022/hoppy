import { PaywallResult } from '@/sync/revenueCat/types';

export type PaywallShowFn = (resolve: (result: PaywallResult) => void) => void;

class PaywallManagerClass {
    private showFn: PaywallShowFn | null = null;
    private activePromise: Promise<PaywallResult> | null = null;
    private activeResolve: ((result: PaywallResult) => void) | null = null;

    setShowFn(fn: PaywallShowFn | null) {
        this.showFn = fn;

        if (!fn && this.activeResolve) {
            const resolve = this.activeResolve;
            this.activeResolve = null;
            this.activePromise = null;
            resolve(PaywallResult.NOT_PRESENTED);
        }
    }

    present(): Promise<PaywallResult> {
        if (this.activePromise) {
            return this.activePromise;
        }

        if (!this.showFn) {
            console.warn('PaywallHost not initialized. Make sure the host is mounted.');
            return Promise.resolve(PaywallResult.NOT_PRESENTED);
        }

        this.activePromise = new Promise<PaywallResult>((resolve) => {
            this.activeResolve = resolve;

            this.showFn?.((result) => {
                if (!this.activeResolve) {
                    return;
                }

                const activeResolve = this.activeResolve;
                this.activeResolve = null;
                activeResolve(result);
            });
        }).finally(() => {
            this.activePromise = null;
            this.activeResolve = null;
        });

        return this.activePromise;
    }
}

export const PaywallManager = new PaywallManagerClass();
