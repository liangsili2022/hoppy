import type { PrismaClient } from "@prisma/client";

type StartupLogger = (src: any, ...args: any[]) => void;
type ShutdownRegistrar = (name: string, callback: () => Promise<void>) => unknown;

type DatabaseLifecycle = Pick<PrismaClient, "$connect" | "$disconnect">;

export async function connectDatabaseForStartup({
    db,
    onShutdown,
    log,
}: {
    db: DatabaseLifecycle;
    onShutdown: ShutdownRegistrar;
    log: StartupLogger;
}): Promise<boolean> {
    try {
        await db.$connect();
        onShutdown("db", async () => {
            await db.$disconnect();
        });
        return true;
    } catch (error) {
        log({
            module: "db",
            level: "error",
            stack: error instanceof Error ? error.stack : undefined,
        }, `Database unavailable, starting in degraded mode: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}
