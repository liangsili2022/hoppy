const TOP_LEVEL_AUTH_ALIASES = new Set(['login', 'logout', 'status']);

export function normalizeTopLevelCommandAliases(args: string[]): string[] {
    const [subcommand, ...rest] = args;

    if (!subcommand || !TOP_LEVEL_AUTH_ALIASES.has(subcommand)) {
        return args;
    }

    return ['auth', subcommand, ...rest];
}
