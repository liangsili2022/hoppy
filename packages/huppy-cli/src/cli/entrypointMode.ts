export type EntrypointMode = 'help' | 'version' | 'start';

export function resolveEntrypointMode({
    showHelp,
    showVersion,
}: {
    showHelp: boolean;
    showVersion: boolean;
}): EntrypointMode {
    if (showHelp) {
        return 'help';
    }

    if (showVersion) {
        return 'version';
    }

    return 'start';
}
