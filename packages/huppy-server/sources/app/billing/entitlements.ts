import { db } from "@/storage/db";
import { inTx } from "@/storage/inTx";
import { log } from "@/utils/log";

const REVENUECAT_API = "https://api.revenuecat.com/v1";

// Cache TTL: re-query RevenueCat if local record is older than this
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RevenueCatSubscriber {
    subscriber?: {
        entitlements?: {
            active?: Record<string, unknown>;
        };
        subscriptions?: Record<string, {
            expires_date: string | null;
            product_identifier: string;
        }>;
    };
}

/**
 * Fetches subscriber info from RevenueCat REST API.
 * Returns null on network error or missing API key.
 */
async function fetchFromRevenueCat(userId: string): Promise<RevenueCatSubscriber | null> {
    const apiKey = process.env.REVENUECAT_API_KEY;
    if (!apiKey) {
        log({ module: "billing" }, "REVENUECAT_API_KEY not configured");
        return null;
    }

    try {
        const response = await fetch(`${REVENUECAT_API}/subscribers/${encodeURIComponent(userId)}`, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            log({ module: "billing" }, `RevenueCat GET /subscribers failed: ${response.status} for user ${userId}`);
            return null;
        }

        return await response.json() as RevenueCatSubscriber;
    } catch (error) {
        log({ module: "billing" }, `RevenueCat fetch error for user ${userId}: ${error}`);
        return null;
    }
}

/**
 * Syncs RevenueCat subscriber state into the local Subscription cache table.
 * Uses accountId as the synthetic key (rc_{accountId}) to support upsert.
 */
async function syncSubscriberToCache(accountId: string, data: RevenueCatSubscriber): Promise<void> {
    const activeEntitlements = data.subscriber?.entitlements?.active ?? {};
    const isPro = !!activeEntitlements.pro;

    // Find the latest expiry among active subscriptions
    const subscriptions = data.subscriber?.subscriptions ?? {};
    let expiresAt: Date | null = null;
    let productId: string | null = null;

    for (const [pid, sub] of Object.entries(subscriptions)) {
        if (sub.expires_date) {
            const exp = new Date(sub.expires_date);
            if (!expiresAt || exp > expiresAt) {
                expiresAt = exp;
                productId = pid;
            }
        }
    }

    const status = isPro ? "active" : (expiresAt && expiresAt < new Date() ? "expired" : "inactive");

    await inTx(async (tx) => {
        await tx.subscription.upsert({
            where: { originalTransactionId: `rc_${accountId}` },
            create: {
                accountId,
                platform: "revenuecat",
                productId: productId ?? "unknown",
                status,
                originalTransactionId: `rc_${accountId}`,
                expiresAt,
            },
            update: {
                status,
                productId: productId ?? "unknown",
                expiresAt,
            },
        });
    });
}

/**
 * The single entitlement check used by all backend routes.
 *
 * Strategy:
 * 1. Read local Subscription cache (fast path).
 * 2. If cache is fresh (< 1h) and status is definitive, return it.
 * 3. Otherwise query RevenueCat GET /subscribers and sync back to cache.
 *
 * Always trusts RevenueCat as the authoritative source.
 */
export async function hasEntitlement(accountId: string, entitlement: "pro"): Promise<boolean> {
    let cached: {
        status: string;
        expiresAt: Date | null;
        updatedAt: Date;
    } | null = null;

    try {
        cached = await db.subscription.findFirst({
            where: {
                accountId,
                platform: "revenuecat",
                originalTransactionId: `rc_${accountId}`,
            },
            select: { status: true, expiresAt: true, updatedAt: true },
        });
    } catch (error) {
        log({ module: "billing", level: "warn" }, `Subscription cache lookup failed for user ${accountId}: ${error}`);
    }

    const cacheIsFresh = cached && (Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS);

    if (cacheIsFresh && cached) {
        return cached.status === "active" && (!cached.expiresAt || cached.expiresAt > new Date());
    }

    // Cache miss or stale: query RevenueCat
    const data = await fetchFromRevenueCat(accountId);
    if (!data) {
        // RevenueCat unreachable — fall back to cached value if available
        if (cached) {
            return cached.status === "active" && (!cached.expiresAt || cached.expiresAt > new Date());
        }
        return false;
    }

    try {
        await syncSubscriberToCache(accountId, data);
    } catch (error) {
        log({ module: "billing", level: "warn" }, `Subscription cache sync failed for user ${accountId}: ${error}`);
    }

    return !!data.subscriber?.entitlements?.active?.pro;
}

/**
 * Forces a full sync from RevenueCat for a given user.
 * Called by the webhook handler after receiving any subscription event.
 */
export async function syncEntitlementsFromRevenueCat(accountId: string): Promise<void> {
    const data = await fetchFromRevenueCat(accountId);
    if (data) {
        await syncSubscriberToCache(accountId, data);
    }
}
