import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedMode } from './loop';
import type { Session } from './session';

const {
    mockClaudeLocal,
    mockScannerCleanup,
    mockScannerOnNewSession,
    mockCloseClaudeSessionTurn,
    mockSendSessionEvent,
    mockSendClaudeSessionMessage,
    mockRegisterHandler,
} = vi.hoisted(() => ({
    mockClaudeLocal: vi.fn(),
    mockScannerCleanup: vi.fn(),
    mockScannerOnNewSession: vi.fn(),
    mockCloseClaudeSessionTurn: vi.fn(),
    mockSendSessionEvent: vi.fn(),
    mockSendClaudeSessionMessage: vi.fn(),
    mockRegisterHandler: vi.fn(),
}));

vi.mock('./claudeLocal', async () => {
    const actual = await vi.importActual<typeof import('./claudeLocal')>('./claudeLocal');

    return {
        ...actual,
        claudeLocal: mockClaudeLocal,
    };
});

vi.mock('./utils/sessionScanner', () => ({
    createSessionScanner: vi.fn(async () => ({
        cleanup: mockScannerCleanup,
        onNewSession: mockScannerOnNewSession,
    })),
}));

vi.mock('@/ui/logger', () => ({
    logger: {
        debug: vi.fn(),
    },
}));

import { claudeLocalLauncher } from './claudeLocalLauncher';
import { ExitCodeError } from './claudeLocal';

describe('claudeLocalLauncher', () => {
    let queueHandler: ((message: string, mode: EnhancedMode) => void | Promise<void>) | null;

    beforeEach(() => {
        vi.clearAllMocks();
        queueHandler = null;
    });

    it('returns switch when a remote message aborts local Claude with exit code 143', async () => {
        mockClaudeLocal.mockImplementation(({ abort }: { abort: AbortSignal }) => {
            return new Promise<void>((resolve, reject) => {
                if (abort.aborted) {
                    reject(new ExitCodeError(143));
                    return;
                }

                abort.addEventListener(
                    'abort',
                    () => {
                        reject(new ExitCodeError(143));
                    },
                    { once: true },
                );
            });
        });

        const session = {
            path: '/tmp/workspace',
            sessionId: null,
            claudeEnvVars: undefined,
            claudeArgs: undefined,
            mcpServers: {},
            allowedTools: undefined,
            hookSettingsPath: '/tmp/hook-settings.json',
            sandboxConfig: undefined,
            onThinkingChange: vi.fn(),
            addSessionFoundCallback: vi.fn(),
            removeSessionFoundCallback: vi.fn(),
            onSessionFound: vi.fn(),
            client: {
                closeClaudeSessionTurn: mockCloseClaudeSessionTurn,
                sendSessionEvent: mockSendSessionEvent,
                sendClaudeSessionMessage: mockSendClaudeSessionMessage,
                rpcHandlerManager: {
                    registerHandler: mockRegisterHandler,
                },
            },
            queue: {
                size: vi.fn(() => 0),
                reset: vi.fn(),
                setOnMessage: vi.fn((handler: ((message: string, mode: EnhancedMode) => void | Promise<void>) | null) => {
                    queueHandler = handler;
                }),
            },
        } as unknown as Session;

        const launcherPromise = claudeLocalLauncher(session);

        await vi.waitFor(() => {
            expect(session.queue.setOnMessage).toHaveBeenCalled();
            expect(queueHandler).not.toBeNull();
        });

        await queueHandler?.('你好', { permissionMode: 'default' });

        await expect(launcherPromise).resolves.toEqual({ type: 'switch' });
        expect(mockCloseClaudeSessionTurn).toHaveBeenCalledWith('cancelled');
        expect(mockCloseClaudeSessionTurn).not.toHaveBeenCalledWith('failed');
        expect(mockScannerCleanup).toHaveBeenCalled();
    });
});
