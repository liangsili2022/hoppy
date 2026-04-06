import { startApi } from "@/app/api/api";
import { log } from "@/utils/log";
import { awaitShutdown, onShutdown } from "@/utils/shutdown";
import { db } from './storage/db';
import { startTimeout } from "./app/presence/timeout";
import { startMetricsServer } from "@/app/monitoring/metrics";
import { activityCache } from "@/app/presence/sessionCache";
import { auth } from "./app/auth/auth";
import { startDatabaseMetricsUpdater } from "@/app/monitoring/metrics2";
import { initEncrypt } from "./modules/encrypt";
import { initGithub } from "./modules/github";
import { loadFiles } from "./storage/files";
import { connectDatabaseForStartup } from "./storage/databaseStartup";

async function main() {

    // Storage
    const eagerDatabaseConnectEnabled = process.env.DB_PROVIDER !== "pglite";
    const databaseConnected = eagerDatabaseConnectEnabled
        ? await connectDatabaseForStartup({
            db,
            onShutdown,
            log,
        })
        : false;
    if (!eagerDatabaseConnectEnabled) {
        log({ module: "db", level: "warn" }, "Skipping eager database connect for PGlite startup");
    }
    onShutdown('activity-cache', async () => {
        activityCache.shutdown();
    });
    if (process.env.REDIS_URL) {
        const { Redis } = await import('ioredis');
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
    }

    // Initialize auth module
    await initEncrypt();
    await initGithub();
    await loadFiles();
    await auth.init();

    //
    // Start
    //

    // databaseDegraded is true only when external Postgres failed — PGlite mode
    // is not degraded, it just skips the eager connect because PGlite is lazy.
    const databaseDegraded = eagerDatabaseConnectEnabled && !databaseConnected;

    await startApi({ databaseDegraded });
    await startMetricsServer();
    if (databaseConnected) {
        startDatabaseMetricsUpdater();
        startTimeout();
    } else {
        log({ module: "db", level: "warn" }, "Database background workers disabled while running in degraded mode");
    }

    //
    // Ready
    //

    log('Ready');
    await awaitShutdown();
    log('Shutting down...');
}

// Process-level error handling
process.on('uncaughtException', (error) => {
    log({
        module: 'process-error',
        level: 'error',
        stack: error.stack,
        name: error.name
    }, `Uncaught Exception: ${error.message}`);

    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const errorMsg = reason instanceof Error ? reason.message : String(reason);
    const errorStack = reason instanceof Error ? reason.stack : undefined;

    log({
        module: 'process-error',
        level: 'error',
        stack: errorStack,
        reason: String(reason)
    }, `Unhandled Rejection: ${errorMsg}`);

    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('warning', (warning) => {
    log({
        module: 'process-warning',
        level: 'warn',
        name: warning.name,
        stack: warning.stack
    }, `Process Warning: ${warning.message}`);
});

// Log when the process is about to exit
process.on('exit', (code) => {
    if (code !== 0) {
        log({
            module: 'process-exit',
            level: 'error',
            exitCode: code
        }, `Process exiting with code: ${code}`);
    } else {
        log({
            module: 'process-exit',
            level: 'info',
            exitCode: code
        }, 'Process exiting normally');
    }
});

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).then(() => {
    process.exit(0);
});
