import { db } from "@/storage/db";

/**
 * Returns the current active subscription status for a user.
 * Checks for any non-expired active subscription record in the database.
 */
export async function subscriptionStatus(args: {
    accountId: string;
}): Promise<{ isPro: boolean; expiresAt: Date | null; productId: string | null }> {
    const { accountId } = args;

    const active = await db.subscription.findFirst({
        where: {
            accountId,
            status: "active",
            expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "desc" },
        select: { expiresAt: true, productId: true },
    });

    if (!active) {
        return { isPro: false, expiresAt: null, productId: null };
    }

    return { isPro: true, expiresAt: active.expiresAt, productId: active.productId };
}
