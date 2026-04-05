import { getPGlite } from "./db";

type DataEncryptionKeyTable = "Session" | "Machine";

export function usesPGliteDataEncryptionKeyWorkaround() {
    return process.env.DB_PROVIDER === "pglite";
}

export function decodeDataEncryptionKeyForStorage(dataEncryptionKey: string | null | undefined) {
    if (!dataEncryptionKey || usesPGliteDataEncryptionKeyWorkaround()) {
        return undefined;
    }
    return Buffer.from(dataEncryptionKey, "base64");
}

export function encodeDataEncryptionKeyForResponse(dataEncryptionKey: Uint8Array | null | undefined) {
    return dataEncryptionKey ? Buffer.from(dataEncryptionKey).toString("base64") : null;
}

export function decodeDataEncryptionKeyForPayload(dataEncryptionKey: string | null | undefined) {
    return dataEncryptionKey ? Buffer.from(dataEncryptionKey, "base64") : null;
}

export async function persistPGliteDataEncryptionKey(
    table: DataEncryptionKeyTable,
    id: string,
    dataEncryptionKey: string | null | undefined,
) {
    if (!usesPGliteDataEncryptionKeyWorkaround() || !dataEncryptionKey) {
        return;
    }

    const pg = getPGlite();
    if (!pg) {
        throw new Error(`PGlite instance is not available while persisting ${table}.dataEncryptionKey`);
    }

    await pg.query(
        `UPDATE "${table}" SET "dataEncryptionKey" = decode($1, $2) WHERE id = $3`,
        [dataEncryptionKey, "base64", id],
    );
}

export async function loadPGliteDataEncryptionKeys(
    table: DataEncryptionKeyTable,
    ids: string[],
) {
    const keys = new Map<string, string | null>();

    if (!usesPGliteDataEncryptionKeyWorkaround() || ids.length === 0) {
        return keys;
    }

    const pg = getPGlite();
    if (!pg) {
        throw new Error(`PGlite instance is not available while loading ${table}.dataEncryptionKey`);
    }

    const placeholders = ids.map((_, index) => `$${index + 2}`).join(", ");
    const result = await pg.query<{ id: string; dek?: string | null; dataEncryptionKey?: string | null }>(
        `SELECT id, CASE WHEN "dataEncryptionKey" IS NULL THEN NULL ELSE encode("dataEncryptionKey", $1) END AS dek FROM "${table}" WHERE id IN (${placeholders})`,
        ["base64", ...ids],
    );

    for (const row of result.rows) {
        const encoded = row.dek ?? row.dataEncryptionKey ?? null;
        keys.set(String(row.id), encoded == null ? null : String(encoded));
    }

    return keys;
}
