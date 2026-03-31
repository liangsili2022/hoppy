import { db } from "@/storage/db";
import { inTx } from "@/storage/inTx";
import axios from "axios";

const APPLE_VERIFY_URL_PROD = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_URL_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

const PLUS_PRODUCT_IDS = new Set([
    "ai.huppy.plus.monthly",
    "ai.huppy.plus.yearly",
]);

interface AppleVerifyResponse {
    status: number;
    latest_receipt_info?: AppleReceiptInfo[];
    receipt?: {
        in_app?: AppleReceiptInfo[];
    };
}

interface AppleReceiptInfo {
    product_id: string;
    original_transaction_id: string;
    expires_date_ms?: string;
    cancellation_date_ms?: string;
}

/**
 * Verifies an Apple receipt with Apple servers and upserts the subscription
 * record for the user. Tries production first, falls back to sandbox for
 * test purchases (status 21007).
 *
 * Returns the active subscription status after verification.
 */
export async function subscriptionVerify(args: {
    accountId: string;
    receiptData: string;
}): Promise<{ isPro: boolean; expiresAt: Date | null; productId: string | null }> {
    const { accountId, receiptData } = args;

    // Try production first, then sandbox fallback
    let appleResponse = await verifyWithApple(receiptData, APPLE_VERIFY_URL_PROD);
    if (appleResponse.status === 21007) {
        appleResponse = await verifyWithApple(receiptData, APPLE_VERIFY_URL_SANDBOX);
    }

    if (appleResponse.status !== 0) {
        throw new Error(`Apple receipt verification failed with status ${appleResponse.status}`);
    }

    // Find the most recent Plus receipt
    const allReceipts: AppleReceiptInfo[] = [
        ...(appleResponse.latest_receipt_info ?? []),
        ...(appleResponse.receipt?.in_app ?? []),
    ];

    const plusReceipts = allReceipts.filter(r => PLUS_PRODUCT_IDS.has(r.product_id));
    if (plusReceipts.length === 0) {
        return { isPro: false, expiresAt: null, productId: null };
    }

    // Sort by expiry descending, pick the latest
    const latest = plusReceipts.sort((a, b) => {
        const aExp = Number(a.expires_date_ms ?? 0);
        const bExp = Number(b.expires_date_ms ?? 0);
        return bExp - aExp;
    })[0];

    const expiresAt = latest.expires_date_ms
        ? new Date(Number(latest.expires_date_ms))
        : null;

    const isCancelled = !!latest.cancellation_date_ms;
    const isExpired = expiresAt ? expiresAt < new Date() : false;
    const status = isCancelled ? "cancelled" : isExpired ? "expired" : "active";

    await inTx(async (tx) => {
        await tx.subscription.upsert({
            where: { originalTransactionId: latest.original_transaction_id },
            create: {
                accountId,
                platform: "apple",
                productId: latest.product_id,
                status,
                originalTransactionId: latest.original_transaction_id,
                expiresAt,
            },
            update: {
                status,
                productId: latest.product_id,
                expiresAt,
            },
        });
    });

    return {
        isPro: status === "active",
        expiresAt,
        productId: latest.product_id,
    };
}

async function verifyWithApple(
    receiptData: string,
    url: string
): Promise<AppleVerifyResponse> {
    const response = await axios.post<AppleVerifyResponse>(
        url,
        { "receipt-data": receiptData, password: process.env.APPLE_IAP_SHARED_SECRET ?? "" },
        { timeout: 10000 }
    );
    return response.data;
}
